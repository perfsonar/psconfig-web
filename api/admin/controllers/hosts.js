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
        if(~user.scopes.mca.indexOf('admin')) {
            return true;
        }
        if(~host.admins.indexOf(user.sub)) { //TODO not tested yet
            return true;
        }
    }
    return false;
}

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    /*
    //handling user_id.
    if(!req.user.scopes.sca || !~req.user.scopes.sca.indexOf("admin") || find.user_id === undefined) {
        //non admin, or admin didn't set user_id
        find.user_id = req.user.sub;
    } else if(find.user_id == null) {
        //admin can set it to null and remove user_id filtering all together
        delete find.user_id;
    }
    */
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

    /*
    db.Host.findAll({raw: true}).then(function(_recs) {
        var recs = [];
        _recs.forEach(function(rec) {
            rec._canedit = false;
            if(req.user) {
                if(~req.user.scopes.mca.indexOf('admin')) {
                    rec._canedit = true;
                }
            }
            recs.push(rec);
        });
        res.json(recs);
    });
    */
});

router.put('/:uuid', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var uuid = req.params.uuid;
    //var newhost = req.body._detail;
    //if(!~req.user.scopes.mca.indexOf('admin')) return res.status(401).end();

    //update host info
    db.Host.findById(uuid).then(function(host) {
        if(!host) return res.status(404).end();
        if(!canedit(req.user, host)) return res.status(401).end();

        //things to allow updates
        host.no_agent = req.body.no_agent;
        host.toolkit_url = req.body.toolkit_url;
        host.services = req.body.services; //should restrict to just MAs?
        host.save().then(function() {
            res.json({status: "ok"});
            /*
            //update ma pointers for each child services
            db.Service.findAll({
                where: {client_uuid: uuid},
            }).then(function(services) {
                req.body.services.forEach(function(_service) {
                    //find the service record to update
                    services.forEach(function(service) {
                        if(service.id == _service.id) service.ma = _service.ma;
                    });
                });
                //and save all
                async.each(services, function(service, next) {
                    service.save().then(function() {
                        next();
                    }); 
                }, function(err) {
                    res.json({status: "ok"});
                }); 
            });
            */
        });
    });
});

module.exports = router;

