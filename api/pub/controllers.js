'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
const meshconfig = require('./meshconfig');

/**
 * @apiGroup            Publisher
 * @api {get} /health   Get API status for publisher
 * @apiDescription      Get current API status for MCA publisher
 *
 * @apiSuccess {String} status 'ok' or 'failed'
 */
router.get('/health', function(req, res) {
    var status = "ok";
    var msg = null;

    //check meshconfig health
    var mc_status = meshconfig.health();
    if(mc_status.status != "ok") {
        status = mc_status.status;
        msg= mc_status.msg;
    }

    //check db health
    db.Config.findOne().exec(function(err, config) {
        if(err) {
            status = "failed";
            msg = err.toString();
        }
        if(!config) {
            status = "failed";
            msg = "no meshconfig seems to have been registered by user yet.";
        } else {
            msg = "db status ok";
        }
        res.json({status: status, msg: msg});
    });
});

/**
 * @apiGroup                    Publisher
 * @api {get} /config           Enumerate meshconfig URLs
 * @apiDescription              Query registered meshconfigs URLs and its basic details
 *
 * @apiParam {Object} [find]    Mongo find query JSON.stringify & encodeURIComponent-ed - defaults to {}
 *                              To pass regex, you need to use {$regex: "...."} format instead of js: /.../ 
 * @apiParam {string} [ma_override] 
 *                              Override all MA endpoints in this meshconfig with this hostname
 * @apiParam {string} [host_version] 
 *                              Override the host version provided via sLS (like.. to suppress v4 options)
 *
 * @apiHeader {String}          Authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object[]}       List of object containing "include" parameter with meshconfig URL (format adhears to meshconfig_agent
 */
router.get('/config', function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);
    db.Config.find(find)
    .exec(function(err, configs) {
        if(err) return next(err);
        var q = "";
        if(req.query.ma_override) {
            q += "ma_override="+req.query.ma_override;
        }
        if(req.query.host_version) {
            if(q!="") q+="&";
            q += "host_version="+req.query.host_version;
        }
        if(q!="") q="?"+q;
        console.dir(req.headers);
        var proto = "http";
        if(req.headers['x-forwarded-proto']) proto = req.headers['x-forwarded-proto'];
        var urls = configs.map((_config)=>{
            return {include: [ proto+"://"+config.pub.url+'config/'+_config.url+q ]};
        });
        res.json(urls);
    }); 
});

/**
 * @apiGroup                    Publisher
 * @api {get} /config/:url      Download meshconfig
 * @apiDescription              Generate meshconfig that can be consumed by 3rd party tools (like meshconfig_generator for toolkit)
 *
 * @apiParam {string} url       url for registered meshconfig 
 * @apiParam {string} [ma_override] 
 *                              Override all MA endpoints in this meshconfig with this hostname
 * @apiParam {string} [host_version] 
 *                              Override the host version provided via sLS (like.. to suppress v4 options)
 *
 */
router.get('/config/:url/:format?', function(req, res, next) {
    var format = req.params.format || "meshconfig";
    config.format = format;
    console.log("format", format);
    console.log("req.query", req.query);
    var opts = {};
    opts.format = format;
    //if ( req.params.ma_override) opts.ma_override = req.params.ma_override;
    db.Config.findOne({url: req.params.url}).lean().exec(function(err, config) {
        if(err) return next(err);
        if(!config) return res.status(404).text("Couldn't find config with URL:"+req.params.url);
        config._host_version = req.query.host_version;
        meshconfig.generate(config, opts, function(err, m) {
            if(err) return next(err);
            res.json(m);
        });
    });
});

/**
 * @apiGroup                 Publisher
 * @api {get} /auto/:address Download auto-meshconfig 
 * @apiDescription           Construct meshconfig on-the-fly by aggregating all tests that includes the host specified
 *
 * @apiParam {string} address Hostname of the toolkit instance to generate auto-meshconfig for.
 * @apiParam {string} [ma_override] Override all MA endpoints in this meshconfig with this hostname
 * @apiParam {string} [host_version] Override the host version provided via sLS (like.. to suppress v4 options)
 */
router.get('/auto/:address', function(req, res, next) {
    var address = req.params.address;
    //logger.debug(req.query.host_version);
    //find host from hostname or ip
    db.Host.findOne({ hostname: address }, '_id  info.pshost-toolkitversion', function(err, host) {
        if(err) return next(err);
        if(!host) return res.status(404).json({message: "no such hostname registered: "+address});
        var config = {
            name: "Auto-MeshConfig for "+address,
            tests: [], 
        };

        //find all hostgroups that has the host
        db.Hostgroup.find({ hosts: host._id }, '_id', function(err, hostgroups) {
            if(err) return next(err);
            var hostgroup_ids = []; 
            hostgroups.forEach(function(hostgroup) {
                hostgroup_ids.push(hostgroup.id);
            });

            //find all config with tests that uses the hostgroup
            db.Config.find({
                $or: [
                    {"tests.agroup": {$in: hostgroup_ids}},
                    {"tests.bgroup": {$in: hostgroup_ids}},
                    {"tests.center": host._id},
                ],
            }).lean().exec(function(err, configs) {
                if(err) return next(err);

                //add all tests that has hostgroup_id or host._id references
                configs.forEach(function(_config) {
                    _config.tests.forEach(function(test) {
                        if(!test.enabled) return;
                        var found = false;
                        if(test.agroup && ~hostgroup_ids.indexOf(test.agroup.toString())) found = true;
                        if(test.bgroup && ~hostgroup_ids.indexOf(test.bgroup.toString())) found = true;
                        if(test.center && host._id == test.center.toString()) found = true;
                        if(found) config.tests.push(test);
                    });
                });

                //figure out version
                config._host_version = 
                    req.query.host_version || 
                    host.info['pshost-toolkitversion'] || 
                    host.info['pshost-bundle-version'] || 
                    null;
                
                meshconfig.generate(config, req.query, function(err, m) {
                    if(err) return next(err);
                    res.json(m);
                });
            });
        });
    });
});

module.exports = router;

