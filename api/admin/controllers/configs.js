'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const async = require('async');
const request = require('request');

//mine
const config = require('../../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../../models');
const importer = require('./importer');

function canedit(user, config) {
    if(user) {
        if(user.scopes.mca && ~user.scopes.mca.indexOf('admin')) return true;
        if(~config.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

/**
 * @api {get} /configs          Query Configs
 * @apiGroup                    Configs
 * @apiDescription              Query registered meshconfigs and its basic details
 *
 * @apiParam {Object} [find]    Mongo find query JSON.stringify & encodeURIComponent-ed - defaults to {}
 *                              To pass regex, you need to use {$regex: "...."} format instead of js: /.../ 
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to return (admins will always be added). Multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * @apiHeader {String}          Authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         configs: List of meshconfig registrations, count: total number of meshconfig (for paging)
 */
router.get('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);
    
    //we need to select admins , or can't get _canedit set
    var select = req.query.select;
    if(select && !~select.indexOf("admins")) select += " admins";

    db.Config.find(find)
    .select(select)
    .limit(parseInt(req.query.limit) || 100)
    .skip(parseInt(req.query.skip) || 0)
    .sort(req.query.sort || '_id')
    .lean() //so that I can add _canedit later
    .exec(function(err, configs) {
        if(err) return next(err);
        db.Config.count(find).exec(function(err, count) { 
            if(err) return next(err);
            configs.forEach(function(config) {
                config._canedit = canedit(req.user, config);
            });
            res.json({configs: configs, count: count});
        });
    }); 
});

/**
 * @api {post} /configs         New Config
 * @apiGroup                    Configs
 * @apiDescription              Register new meshconfig
 *
 * @apiParam {String} [url]     URL to expose this config ("config" will be published under "/pub/config") - needs to be unique
 * @apiParam {String} [name]    Name of this meshconfig (will be published on the meshconfig)
 * @apiParam {String} [desc]    Description for this meshconfig (MCA use only)
 * @apiParam {Object[]} [tests] Array of test objects (TODO - need documentation)
 * @apiParam {String[]} [admins] Array of admin IDs
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Config created
 */
router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.mca || !~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    db.Config.create(req.body, function(err, config) {
        if(err) return next(err);
        config = JSON.parse(JSON.stringify(config));
        config._canedit = canedit(req.user, config);
        res.json(config);
    });
});

router.put('/import', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.mca || !~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    importer.import(req.body.url, req.user.sub, function(err, tests) {
        if(err) return next(err);
        res.json({msg: "Created testspecs / host / hostgroups records", tests: tests});
    });
});

/**
 * @api {put} /configs/:id      Update Config
 * @apiGroup                    Configs
 * @apiDescription              Update registered meshconfig
 *
 * @apiParam {String} [url]     URL to expose this config ("config" will be published under "/pub/config")
 * @apiParam {String} [name]    Name of this meshconfig (will be published on the meshconfig)
 * @apiParam {String} [desc]    Description for this meshconfig (MCA use only)
 * @apiParam {Object[]} [tests] Array of test objects (TODO - need documentation)
 * @apiParam {String[]} [admins] Array of admin IDs
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Config updated
 */
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Config.findById(req.params.id, function(err, config) {
        if(err) return next(err);
        if(!config) return next(new Error("can't find a config with id:"+req.params.id));
        if(canedit(req.user, config)) {
            config.url = req.body.url;            
            config.name = req.body.name;            
            config.desc = req.body.desc;            
            config.tests = req.body.tests;            
            config.admins = req.body.admins;            
            config.update_date = new Date();
            config.save(function(err) {
                if(err) return next(err);
                config = JSON.parse(JSON.stringify(config));
                config._canedit = canedit(req.user, config);
                res.json(config);
            }).catch(function(err) {
                next(err);
            });
        } else return res.status(401).end("you are not administartor");
    }); 
});




/**
 * @api {delete} /configs/:id   Remove Config
 * @apiGroup                    Configs
 * @apiDescription              Remove registered meshconfig
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "status": "ok"
 *     }
 */
router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Config.findById(req.params.id, function(err, config) {
        if(err) return next(err);
        if(!config) return next(new Error("can't find the config with id:"+req.params.id));
        if(canedit(req.user, config)) {
            config.remove().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

module.exports = router;

