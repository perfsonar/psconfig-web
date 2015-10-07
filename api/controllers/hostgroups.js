'use strict';

//contrib
var express = require('express');
var router = express.Router();
var winston = require('winston');
var jwt = require('express-jwt');
var async = require('async');

//mine
var config = require('../config/config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

router.get('/', jwt({secret: config.express.jwt.secret, credentialsRequired: false}), function(req, res, next) {
    db.Hostgroup.findAll(/*{include: [{
        model: db.Admin
    }]}*/).then(function(hostgroups) {
        //convert to normal javascript object so that I can add stuff to it (why can't I for sequelize object?)
        var json = JSON.stringify(hostgroups);
        hostgroups = JSON.parse(json);
        hostgroups.forEach(function(hostgroup) {
            hostgroup.canedit = false;
            if(req.user) {
                if(~req.user.scopes.common.indexOf('admin') || ~hostgroup.admins.indexOf(req.user.sub)) {
                    hostgroup.canedit = true;
                }
            }
        });
        res.json(hostgroups);
    }); 
});

//all test specs are open to public for read access
router.get('/:id', function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Hostgroup.findOne({
        where: {id: id}
    }).then(function(hostgroup) {
        res.json(hostgroup);
    }); 
});

router.delete('/:id', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Hostgroup.findOne({
        where: {id: id}
    }).then(function(hostgroup) {
        if(!hostgroup) return next(new Error("can't find the hostgroup with id:"+id));
        //only superadmin or admin of this test spec can update
        if(~req.user.scopes.common.indexOf('admin') || ~hostgroup.admins.indexOf(req.user.sub)) {
            hostgroup.destroy().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

router.put('/:id', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Hostgroup.findOne({
        where: {id: id}
    }).then(function(hostgroup) {
        if(!hostgroup) return next(new Error("can't find a hostgroup with id:"+id));
        //only superadmin or admin of this test spec can update
        if(~req.user.scopes.common.indexOf('admin') || ~hostgroup.admins.indexOf(req.user.sub)) {
            //TODO - should validate?
            hostgroup.desc = req.body.desc;
            hostgroup.hosts = req.body.hosts;
            hostgroup.admins = req.body.admins;
            hostgroup.save().then(function() {
                res.json({status: "ok"});
            }).catch(function(err) {
                next(err);
            });
        } else return res.status(401).end();
    }); 
});

router.post('/', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
    if(!~req.user.scopes.common.indexOf('user')) return res.status(401).end();
    //console.log(JSON.stringify(req.body, null, 4));
    db.Hostgroup.create(req.body).then(function(hostgroup) {
        //console.log(JSON.stringify(testspec, null, 4));
        /*
        //first I need to recreate all admin records
        var admins = [];
        async.eachSeries(req.body.admins, function(sub, cb) {
            //TODO - should remove all current Admins first so that I don't get piles of unsed Admins
            db.Admin.create({sub: sub}).then(function(admin) {
                //logger.debug(JSON.stringify(admin, null, 4));
                admins.push(admin);
                cb(null);
            });
        }, function(err) {
            if(err) return next(err);
            //console.dir(JSON.stringify(admins, null, 4));
            //then reset all
            testspec.setAdmins(admins).then(function() {
                res.json({status: "ok"});
            });
        });
        */
        res.json({status: "ok"});
    });
});

module.exports = router;

