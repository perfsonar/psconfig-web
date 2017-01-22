'use strict';

//contrib
var express = require('express');
var router = express.Router();
var winston = require('winston');
var jwt = require('express-jwt');
var async = require('async');

//mine
var config = require('../../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../../models');
var common = require('../../common');

function canedit(user, host) {
    if(user) {
        if(user.scopes.mca && ~user.scopes.mca.indexOf('admin')) return true; //admin can edit whaterver..
        if(host.admins && ~host.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

//query hosts
router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    db.Host.find(find)
    .select(req.query.select)
    .limit(parseInt(req.query.limit) || 100)
    .skip(parseInt(req.query.skip) || 0)
    .sort(req.query.sort || '_id')
    .lean() //so that I can add _canedit later
    .exec(function(err, hosts) {
        if(err) return next(err);
        db.Host.count(find).exec(function(err, count) {
            if(err) return next(err);
            
            //append canedit flag
            hosts.forEach(function(host) {
                host._canedit = canedit(req.user, host);
            });
           
            res.json({hosts: hosts, count: count});
        });
    });
});

//update host info
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Host.findById(req.params.id, function(err, host) {
        if(err) return next(err);
        if(!host) return res.status(404).end();
        if(!canedit(req.user, host)) return res.status(401).end();

        //things always allowed to edit
        host.no_agent = req.body.no_agent;
        host.toolkit_url = req.body.toolkit_url;
        host.services = req.body.services; //TODO should restrict to just MAs?
        host.update_date = new Date();

        if(!host.lsid) {
            //adhoc records can set more info
            host.hostname = req.body.hostname;
            host.sitename = req.body.sitename;
            host.info = req.body.info;
            host.location = req.body.location;
            host.communities = req.body.communities;
            host.admins =  req.body.admins;
        }

        host.save(function(err) {
            if(err) return next(err);
            host = JSON.parse(JSON.stringify(host));
            host._canedit = canedit(req.user, host);
            res.json(host);
        }).catch(function(err) {
            next(err);
        });
    });
});

//register new adhoc host
router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.mca || !~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    if(req.body.lsid) delete res.body.lsid;// make sure lsid is not set
    db.Host.create(req.body, function(err, host) {
        if(err) return next(err);
        host = JSON.parse(JSON.stringify(host));
        host._canedit = canedit(req.user, host);
        res.json(host);
    });
});

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    //var id = parseInt(req.params.id);
    db.Testspec.findById(req.params.id, function(err, host) {
        if(err) return next(err);
        if(!host) return next(new Error("can't find a host with id:"+req.params.id));
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, host)) {
            host.remove().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

module.exports = router;

