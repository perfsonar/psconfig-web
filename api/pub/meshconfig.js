'use strict';

//contrib
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var winston = require('winston');

//mine
var config = require('../config');
//var logger = new winston.Logger(config.logger.winston);

function generate_members(group, services) {
    var members = [];
    group.hosts.forEach(function(_host) {
        var host = services[_host].Host;
        members.push(host.hostname || host.ip);
    });
    return members;
}

//synchronous function to construct meshconfig from admin config
function generate(config) {
    
    //create uuid service mapping
    var services = {};
    config.services.forEach(function(service) {
        services[service.uuid] = service;
    });

    //meshconfig root template
    var mc = {
        organizations: [],
        tests: [],
        administrators: [],
        description: config.desc,
        //_debug: config //debug
    };
    
    //set meshconfig admins
    if(config.admins) config.admins.forEach(function(admin) {
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
        //var _address = service._address;
        var _address = service.Host.hostname||service.Host.ip;

        if(!service.MA) {
            //MA not specified.. find local MA
            config.mas.forEach(function(ma) {
                if(ma.client_uuid == service.client_uuid) {
                    service.MA = ma;
                }
            });
        }

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
                toolkit_url: service.Host.toolkit_url,//"auto",
            };
            if(service.Host.no_agent) host.no_agent = 1;
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
            if(test.center_address) {
                var host = services[test.center_address].Host;
                members.center_address = host.hostname || host.ip;
            }
            break;
        case "ordered_mesh": 
            members.members = generate_members(test.HostGroupA, services);
            break;
        }
        if(test.HostGroupNA) {
            members.no_agent = generate_members(test.HostGroupNA, services);
            //TODO - not sure yet what to do with NA host group
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
    case "ping": 
        return "pinger";
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

exports.generate = generate;
