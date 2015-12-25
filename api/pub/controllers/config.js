'use strict';

//contrib
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var winston = require('winston');

//mine
var config = require('../../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../../models');
var profile = require('../../common').profile;
var meshconfig = require('../meshconfig');

//we want to cache profile up to 60 seconds
var profile_cache = [];
var profile_cache_time = 0;
function load_profiles(cb) {
    var d = new Date();
    var age = d.getTime() - profile_cache_time; 
    if(age < 1000*60) { 
        //console.log("reusing profile cache");
        cb(null, profile_cache);
    } else {
        //console.log("caching profiles");
        profile.getall(function(err, profiles) {
            if(err) return cb(err);
            profile_cache = profiles;
            profile_cache_time = d;
            if(cb) cb(null, profiles);
        });
    }
}
load_profiles();

//construct meshconfig
router.get('/:url', function(req, res, next) {
    var url = req.params.url;
    db.Config.findOne({
        where: {url: url},
        include: [ 
            //test has a lot of stuff
            {   model: db.Test, 
                required: false, //test could be empty
                where: {enabled: true},
                include: [ 
                    db.Testspec, 
                    { model: db.Hostgroup, as: "HostGroupA" },
                    { model: db.Hostgroup, as: "HostGroupB" },
                    { model: db.Hostgroup, as: "HostGroupNA" }, //TODO
                ] 
            } 
        ],
    }).then(function(_config) {
        //console.dir(_config);
        if(!_config) return next(new Error("Couldn't find config with URL:"+url));
        var config = JSON.parse(JSON.stringify(_config)); //sequelize stupidness.. raw:true returns flattened k/v list
        
        //load admin list for config
        load_profiles(function(err, profiles) {    
            if(err) return next(err);
            config.admins = profile.select(profiles, config.admins);

            //list all service ids referenced in various places
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

                    //finally.. construct meshconfig
                    res.json(meshconfig.generate(config));
                });
            });
        });
    });
});

module.exports = router;

