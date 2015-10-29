'use strict';

//contrib
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var winston = require('winston');

//mine
var config = require('../config/config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');
var profile = require('./profile');

router.get('/health', function(req, res) {
    res.json({status: 'ok'});
});

//construct meshconfig
router.get('/config/:url', function(req, res, next) {
    var url = req.params.url;
    db.Config.findOne({
        where: {url: url},
        include: [ 
            //test has a lot of stuff
            {   model: db.Test, 
                include: [ 
                    db.Testspec, 
                    { model: db.Hostgroup, as: "HostGroupA" },
                    { model: db.Hostgroup, as: "HostGroupB" },
                    { model: db.Hostgroup, as: "HostGroupNA" }, //TODO
                ] 
            } 
        ],
    }).then(function(_config) {
        if(!_config) return next(new Error("Couldn't find config with URL:"+url));
        var config = JSON.parse(JSON.stringify(_config)); //sequelize stupidness.. raw:true returns flattened k/v list
        //load admin list for config
        config.admins = profile.load_admins(config.admins);

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
        //config._host_ids = service_ids; //debug

        //load services for each ids
        //var host_ids = [];
        db.Service.findAll({where: {uuid: {$in: service_ids}}}).then(function(services) {
            //var services = JSON.parse(JSON.stringify(services));
            config.services = services;

            /*
            services.forEach(function(service) {
                host_ids.push(service.client_uuid);
            });
            */

            res.json(generate_meshconfig(config));
        });
    });
});

function generate_members(group, services) {
    var members = [];
    group.hosts.forEach(function(host) {
        members.push(services[host]._address);
    });
    return members;
}

//synchronous function to construct meshconfig from admin config
function generate_meshconfig(config) {
    
    //create uuid service mapping
    var services = {};
    config.services.forEach(function(service) {
        services[service.uuid] = service;
    });

    //parse hostname out of locator
    config.services.forEach(function(service) {
        //parse hostname from locator
        var address = service.locator;
        var protpos = address.indexOf("://");
        if(~protpos) {
            address = address.substr(protpos+3); //remove "tcp://" or such
        }
        var portpos = address.indexOf(":");
        if(~portpos) {
            address = address.substr(0, portpos); //strip everything after port :
        }
        service._address = address;
    });
    
    //meshconfig root template
    var mc = {
        organizations: [],
        tests: [],
        administrators: [],
        description: config.desc,
        //_config: config //debug
    };
    
    //set meshconfig admins
    config.admins.forEach(function(admin) {
        mc.administrators.push({name: admin.fullname, email: admin.email});
    });

    //convert services to sites/hosts entries
    //let's put all sites under a single organization - since I currently don't handle the concept of organization
    var org = {
        sites: [],
        administrators: [],
        //description: "",
    };
    mc.organizations.push(org);

    var hosts = {}; //to keep up with already defined host (we can't list the same host multiple time - even with different ip address / hostname)

    config.services.forEach(function(service) {
        var _address = services[service.uuid]._address;
        if(hosts[service.client_uuid]) {
            var host = hosts[service.client_uuid];
            if(!~host.addresses.indexOf(_address)) host.addresses.push(_address);
            host.description += " / "+service.name;
        } else {
            var host = {
                //administrators: [], //TODO host admins
                addresses: [ _address ], 
                //measurement_archives: [],  //do I need to define this?
                description: service.name
            };
            hosts[service.client_uuid] = host;

            var site = {
                hosts: [ host ],
                //administrators: [], //TODO site admins (not needed?)
                location: service.location,
                description: service.sitename
            };
            org.sites.push(site);
        }
    });

    //now the most interesting part..
    config.Tests.forEach(function(test) {
        var members = {
            type: test.mesh_type
        };
        switch(test.mesh_type) { 
        case "disjoint":
            members.a_members = generate_members(test.HostGroupA, services);
            members.b_members = generate_members(test.HostGroupB, services);
            break;
        case "mesh":
            members.members = generate_members(test.HostGroupA, services);
            break;
        case "star":
            members.members = generate_members(test.HostGroupA, services);
            if(test.center_address) members.center_address = services[test.center_address]._address;
            break;
        case "ordered_mesh": 
            members.members = generate_members(test.HostGroupA, services);
            break;
        }
        if(test.HostGroupNA) {
            members.no_agent = generate_members(test.HostGroupNA, services);
        }

        //testspec should never be null.. but
        if(test.Testspec) {
            var parameters = test.Testspec.specs;
            switch(test.service_type) {
            case "bwctl":
                parameters.type = "perfsonarbuoy/bwctl"; break;
            case "owamp":
                parameters.type = "perfsonarbuoy/owamp"; break;
            case "traceroute":
                parameters.type = "traceroute"; break;
            }
            mc.tests.push({
                members: members,
                parameters: parameters,
                description: test.desc,
            });
        }
    });

    //mc.debug = config;
    return mc;
}

//router.use('/host', require('./controllers/host'));

module.exports = router;

