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
var profile = require('../../common').profile;

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    db.Hostgroup.findAll({
        /*include: [{ model: db.Admin}]*/
        //raw: true, //return raw object instead of sequelize objec that I can't modify..
    }).then(function(hostgroups) {
        //convert to normal javascript object so that I can add stuff to it (why can't I for sequelize object?)
        hostgroups = JSON.parse(JSON.stringify(hostgroups));

        //set canedit flag
        hostgroups.forEach(function(hostgroup) {
            hostgroup.canedit = false;
            if(req.user) {
                if(~req.user.scopes.common.indexOf('admin') || ~hostgroup.admins.indexOf(req.user.sub)) {
                    hostgroup.canedit = true;
                }
            }
            hostgroup.admins = profile.load_admins(hostgroup.admins);
        });
        res.json(hostgroups);
    }); 
});

router.get('/:id', function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Hostgroup.findOne({
        where: {id: id}
    }).then(function(hostgroup) {
        hostgroup.admins = profile.load_admins(hostgroup.admins);
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

//remove null items from an array
function filter_null(a) {
    var ret = [];
    a.forEach(function(it) {
        if(it == null) return;
        ret.push(it);
    });
    return ret;
}

router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Hostgroup.findOne({
        where: {id: id}
    }).then(function(hostgroup) {
        if(!hostgroup) return next(new Error("can't find a hostgroup with id:"+id));
        //only superadmin or admin of this test spec can update
        if(~req.user.scopes.common.indexOf('admin') || ~hostgroup.admins.indexOf(req.user.sub)) {
            hostgroup.desc = req.body.desc;

            hostgroup.type = req.body.type; //not service type, the host type (static, dynamic, etc..)
            hostgroup.hosts = filter_null(req.body.hosts);
            hostgroup.host_filter = req.body.host_filter;

            var admins = [];
            req.body.admins.forEach(function(admin) {
                admins.push(admin.sub);
            });
            hostgroup.admins = admins;
            hostgroup.save().then(function() {
                var canedit = false;
                if(~req.user.scopes.common.indexOf('admin') || ~hostgroup.admins.indexOf(req.user.sub)) {
                    canedit = true;
                }
                res.json({status: "ok", canedit: canedit});
            }).catch(function(err) {
                next(err);
            });
        } else return res.status(401).end();
    }); 
});

router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!~req.user.scopes.common.indexOf('user')) return res.status(401).end();
   
    //convert admin objects to list of subs
    var admins = [];
    req.body.admins.forEach(function(admin) {
        admins.push(admin.sub);
    });
    req.body.admins = admins;

    db.Hostgroup.create(req.body).then(function(hostgroup) {
        var canedit = false;
        if(~req.user.scopes.common.indexOf('admin') || ~hostgroup.admins.indexOf(req.user.sub)) {
            canedit = true;
        }
        res.json({status: "ok", canedit: canedit, id: hostgroup.id});
    });
});

module.exports = router;

