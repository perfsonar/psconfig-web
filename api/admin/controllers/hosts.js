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
        if(~host.admins.indexOf(user.sub)) return true;
    }
    return false;
}

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    db.Host.find(find)
    .select(req.query.select)
    .limit(req.query.limit || 100)
    .skip(req.query.skip || 0)
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

router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    //update host info
    db.Host.findById(req.params.id).then(function(host) {
        if(!host) return res.status(404).end();
        if(!canedit(req.user, host)) return res.status(401).end();

        //things to allow updates
        host.no_agent = req.body.no_agent;
        host.toolkit_url = req.body.toolkit_url;
        host.services = req.body.services; //should restrict to just MAs?
        host.save().then(function() {
            res.json({status: "ok"});
        });
    });
});

module.exports = router;

