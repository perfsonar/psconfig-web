'use strict';

//contrib
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var winston = require('winston');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');
var meshconfig = require('./meshconfig');

router.get('/health', function(req, res) {
    res.json({status: 'ok'});
});

router.get('/config/:url', function(req, res, next) {
    db.Config.findOne({url: req.params.url}).lean().exec(function(err, config) {
        if(err) return next(err);
        if(!config) return res.status(404).text("Couldn't find config with URL:"+req.params.url);
        meshconfig.generate(config, req.query, function(err, m) {
            if(err) return next(err);
            res.json(m);
        });
    });
});

//construct config on-the-fly by aggregating all tests that includes the host specified
router.get('/auto/:address', function(req, res, next) {
    var address = req.params.address;
    //find host from hostname or ip
    db.Host.findOne({ hostname: address }, '_id', function(err, host) {
        if(err) return next(err);
        if(!host) return res.status(404).json({message: "no such hostname registered: "+address});
        var config = {
            desc: "Auto-MeshConfig for "+address,
            admins: [],  //TODO - find out how I populated this for OSG version..
            tests: [], 
        };
        //console.dir(address);
        //console.dir(host._id.toString());

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
                console.dir(JSON.stringify(config));
                
                meshconfig.generate(config, req.query, function(err, m) {
                    if(err) return next(err);
                    res.json(m);
                });
                /*
                var service_ids = [];
                function add_service_id(id) {
                    if(!~service_ids.indexOf(id)) service_ids.push(id);
                }
                config.Tests.forEach(function(Test) {
                    if(Test.HostGroupA) Test.HostGroupA.hosts.forEach(add_service_id);
                    if(Test.HostGroupB) Test.HostGroupB.hosts.forEach(add_service_id);
                    if(Test.HostGroupNA) Test.HostGroupNA.hosts.forEach(add_service_id);
                    if(Test.center_address) add_service_id(Test.center_address);
                });
 
                //load services for each ids
                db.Service.findAll({
                    where: {uuid: {$in: service_ids}},
                    include: [ 
                        { model: db.Service, as: "MA" },
                        { model: db.Host },
                    ]
                }).then(function(services) {
                    config.services = services;

                    //load all mas involved
                    var uuids = [];
                    services.forEach(function(service) {
                        if(service.MA) {
                            if(!~uuids.indexOf(service.MA.client_uuid)) uuids.push(service.MA.client_uuid);
                        } else {
                            if(!~uuids.indexOf(service.client_uuid)) uuids.push(service.client_uuid);
                        } 
                    });
                    db.Service.findAll({
                        where: {client_uuid: {$in: uuids}, type: "ma" },
                    }).then(function(mas) {
                        config.mas = mas;
                        res.json(meshconfig.generate(config));
                        //res.json(config);
                    });
                });
                */ 
            });
        });
    });
});


module.exports = router;

