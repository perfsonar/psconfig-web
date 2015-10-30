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

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    db.Hostgroup.findAll({
        /*include: [{ model: db.Admin}]*/
        //raw: true, //return raw object instead of sequelize objec that I can't modify..
    }).then(function(hostgroups) {
        //convert to normal javascript object so that I can add stuff to it (why can't I for sequelize object?)
        hostgroups = JSON.parse(JSON.stringify(hostgroups)); //convert to raw object so that I can add properties
        //TODO - use clone instead?
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

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
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

router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
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

router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!~req.user.scopes.common.indexOf('user')) return res.status(401).end();
    db.Hostgroup.create(req.body).then(function(hostgroup) {
        res.json({status: "ok"});
    });
});

module.exports = router;

