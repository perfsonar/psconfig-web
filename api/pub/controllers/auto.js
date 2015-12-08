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
var meshconfig = require('../meshconfig');

//construct auto meshconfig
router.get('/:address', function(req, res, next) {
    var address = req.params.address;
    //logger.debug("looking ip "+address);

    //find host from hostname or ip
    db.Host.findOne({
        where: {
            $or: [ {hostname: address}, {ip: address} ]
        },
    }).then(function(host) {
        if(!host) return res.status(404).json({message: "no such hostname or ip address registered: "+address});
        var config = {
            desc: "Auto-MeshConfig for "+address,
            admins: [],  //TODO - find out how I populated this for OSG version..
        };
        //logger.debug("host uuid:"+host.uuid);

        db.Hostgroup.findAll({
            where: { hosts: {$like: '%'+host.uuid+'%'} } //crude.. but necessary?
            //include: { model: db.Test, /*where: {enabled: true}*/ }
        }).then(function(hostgroups) {
            var hostgroup_ids = []; 
            hostgroups.forEach(function(hostgroup) {
                hostgroup_ids.push(hostgroup.id);
            });
            //console.dir(hostgroup_ids);

            //then, look for tests that uses this host groups (or center_address prefixed with host.uuid
            db.Test.findAll({
                where: {
                    $or: [
                        {agroup: {in: hostgroup_ids}}, 
                        {bgroup: {in: hostgroup_ids}}, 
                        //{nagroup: {in: hostgroup_ids}}, 
                        {center_address: {$like: host.uuid+'.%'}}
                    ], 
                    enabled: true
                }, 
                include: [
                    db.Testspec, 
                    { model: db.Hostgroup, as: "HostGroupA" },
                    { model: db.Hostgroup, as: "HostGroupB" },
                    { model: db.Hostgroup, as: "HostGroupNA" }, 
                ]
            }).then(function(tests) {
                config.Tests = tests;
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
            });
        });
    });
});

module.exports = router;

