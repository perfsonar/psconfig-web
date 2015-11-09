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
var profile = require('../profile');

//construct meshconfig
router.get('/:url', function(req, res, next) {
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
        db.Service.findAll({
            where: {uuid: {$in: service_ids}},
            include: [ 
                { model: db.Service, as: "MA" },
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
                res.json(generate_meshconfig(config));
            });
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
        var _address = service._address;

        if(!service.MA) {
            //MA not specified.. find local MA
            config.mas.forEach(function(ma) {
                if(ma.client_uuid == service.client_uuid) {
                    service.MA = ma;
                }
            });
        }
        //console.dir(service.MA);

        if(hosts[service.client_uuid]) {
            var host = hosts[service.client_uuid];
            if(!~host.addresses.indexOf(_address)) host.addresses.push(_address);
            if(service.MA) host.measurement_archives.push(generate_mainfo(service));
            host.description += "/"+service.type; //service.name;
        } else {
            var host = {
                //administrators: [], //TODO host admins
                addresses: [ _address ], 
                measurement_archives: [ ], 
                //description: service.name,
                description: service.sitename+' '+service.type,
                toolkit_url: "auto",
            };
            if(service.MA) host.measurement_archives.push(generate_mainfo(service));
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
            parameters.type = get_type(test.service_type);
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

function get_type(service_type) {
    switch(service_type) {
    case "bwctl": 
    case "owamp": 
        return "perfsonarbuoy/"+service_type;
    }
    return service_type; //no change
}

function generate_mainfo(service) {
    
    return {
        //ma: service.MA,
        read_url: service.MA.locator,
        write_url: service.MA.locator,
        type: "perfsonarbuoy/"+service.type, //get_type(service.type)
    };
}

module.exports = router;

