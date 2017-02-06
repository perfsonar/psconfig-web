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

    //we need to select admins , or can't get _canedit set
    var select = req.query.select;
    if(select && !~select.indexOf("admins")) select += " admins";

    db.Host.find(find)
    .select(select)
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
        
        //somehow, mongo doesn't clear ma ref if it's *not set*.. I have to explicity set it to *undefined* 
        //to force mongo from clearing the ref.
        req.body.services.forEach(function(service) {
            if(!service.ma) service.ma = undefined;
        });

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
            //console.log(JSON.stringify(host.services, null, 4));
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
    db.Host.findById(req.params.id, function(err, host) {
        if(err) return next(err);
        if(!host) return next(new Error("can't find a host with id:"+req.params.id));
        
        async.series([
            //check access 
            function(cb) {
                if(canedit(req.user, host)) {
                    cb();
                } else {
                    cb("You don't have access to remove this host");
                }
            },
            
            //check foreign key dependencies on host.ma
            function(cb) {
                db.Host.find({"services.ma": host._id}, function(err, hosts) {
                    if(err) return cb(err);
                    var names = "";
                    hosts.forEach(function(host) {
                        names+=host.hostname+" ";
                    });
                    if(names == "") {
                        cb();
                    } else {
                        cb("You can not remove this host. It is currently referenced as MA in hosts: "+names);
                    }
                }); 
            },

            //check foreign key dependencies on hostgroup.hosts
            function(cb) {
                db.Hostgroup.find({"hosts": host._id}, function(err, hostgroups) {
                    if(err) return cb(err);
                    var names = "";
                    hostgroups.forEach(function(hostgroup) { names+=hostgroup.name+", "; });
                    if(names == "") {
                        cb();
                    } else {
                        cb("You can not remove this host. It is currently referenced in hostgroups: "+names);
                    }
                }); 
            },
            
            //check foreign key dependencies on config test (center / nahosts)
            function(cb) {
                db.Config.find({$or: [
                    {"tests.center": host._id},
                    {"tests.nahosts": host._id},
                ]}, function(err, configs) {
                    if(err) return cb(err);
                    var names = "";
                    configs.forEach(function(config) { names+=config.name+", "; });
                    if(names == "") {
                        cb();
                    } else {
                        cb("You can not remove this host. It is currently referenced in configs: "+names);
                    }
                }); 
            },

        ], function(err) {
            if(err) return next(err);
            //all good.. remove
            host.remove().then(function() {
                res.json({status: "ok"});
            }); 
        });

        /*
        if(canedit(req.user, host)) {
            host.remove().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
        */
    });
});

module.exports = router;

