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

//return the whole thing.. until that becomes an issue
//open to public
router.get('/services', function(req, res, next) {
    var services = {};
    db.Service.findAll({
        raw: true,
        include: [
            //{ model: db.Service, as: "MA" }
        ],
    }).then(function(recs) {
        //group into each service types
        recs.forEach(function(rec) {
            if(services[rec.type] === undefined) services[rec.type] = [];
            services[rec.type].push(rec);
        });
        res.json({recs: services, lss: config.datasource.services});    
    });
    //res.json(services);
    //res.json({hello: "there"});
});

//TODO - I may need to restrict access to dynamic-allowed scope
router.get('/services-js', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    //need any validation?
    var js = req.query.js;
    var type = req.query.type;

    common.filter.resolveHostGroup(js, type, function(err, hosts) {
        if(err) return next(err);
        res.json(hosts);
    });
});

router.get('/hosts', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    db.Host.findAll({raw: true}).then(function(_recs) {
        var recs = [];
        _recs.forEach(function(rec) {
            //somehow sequelize forgets to parse this.. it works for testspecs, so I am not sure why this doesn't work here
            rec.info = JSON.parse(rec.info); 
            rec.location = JSON.parse(rec.location); 
            rec.communities = JSON.parse(rec.communities); 
            rec.canedit = false;
            if(req.user) {
                if(~req.user.scopes.mca.indexOf('admin') /*|| ~testspec.admins.indexOf(req.user.sub)*/) {
                    rec.canedit = true;
                }
            }

            recs.push(rec);
        });
        res.json(recs);
    });
});

router.put('/host/:uuid', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var uuid = req.params.uuid;
    var _detail = req.body._detail;
    if(!~req.user.scopes.mca.indexOf('admin')) return res.status(401).end();

    //update host info
    db.Host.findOne({where: {uuid: uuid}}).then(function(host) {
        host.no_agent = req.body._detail.no_agent;
        host.toolkit_url = req.body._detail.toolkit_url;
        
        //console.dir(req.body._detail);
        //console.dir(host);
        host.save().then(function() {
            
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
        });
    });
});

//used for admin list editor
router.get('/profiles', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    logger.debug("requested profiles");
    common.profile.getall(function(err, profiles) {
        if(err) next(err);
        res.json(profiles);
    });
});

/*
//update service cache immediately
//TODO - only used for debug purpose right now.
//TODO - should restrict access from localhost?
var slscache = require('../slscache');
router.post('/cache', function(req, res, next) {
    slscache.cache(function(err) {
        if(err) return next(err);
        res.json({status: "ok"});
    });
});
*/

module.exports = router;

