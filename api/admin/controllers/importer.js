'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const async = require('async');
const request = require('request');

//mine
const config = require('../../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../../models');

function get_service_type(mc_type) {
    switch(mc_type) {
    case "perfsonarbuoy/bwctl": return "bwctl";
    case "perfsonarbuoy/owamp": return "owamp";
    case "traceroute": return "traceroute";
    case "pinger": return "ping";
    default: 
        logger.error("unknown meshconfig service type", mc_type);
    }
    return null;
}

function resolve_hosts(hostnames, cb) {
    db.Host.find({hostname: {$in: hostnames}}, function(err, hosts) {
        if(err) return cb(err);
        var ids = hosts.map(host=>host._id);
        cb(null, ids);
    });
}

//make sure all hosts exist
function ensure_hosts(hosts_info, cb) {
    async.eachSeries(hosts_info, function(host, next_host) {
        db.Host.findOne({hostname: host.hostname}, function(err, _host) {
            if(err) return next_host(err);

            if(_host) {
                logger.debug("host already exists", host.hostname);
                if(_host.lsid) next_host();
                else {
                    //for adhoc host, make sure we have all services listed
                    host.services.forEach(function(service) {
                        //look for the service
                        var found = false;
                        _host.services.forEach(function(_service) {
                            if(_service.type == service.type) found = true;
                        });
                        if(!found) {
                            logger.debug("adding service", service);
                            _host.services.push(service);
                        }
                    });
                    logger.debug("updating services");
                    _host.save(next_host);
                }
            } else {
                logger.debug("missing host found - inserting");
                db.Host.create(host, function(err, _host) {
                    if(err) next_host(err);
                    logger.debug("created host");
                    logger.debug(JSON.stringify(_host, null, 4));
                    next_host()
                });
            }
        });
    }, cb);
}

//make sure all hostgroups exist
function ensure_hostgroups(hostgroups, cb) {
    async.eachSeries(hostgroups, function(hostgroup, next_hostgroup) {
        //crude, but let's key by name for now..
        db.Hostgroup.findOne({name: hostgroup.name}, function(err, _hostgroup) {
            if(err) return next_hostgroup(err);

            if(_hostgroup) {
                logger.debug("hostgroup seems to already exists");
                hostgroup._id = _hostgroup._id;
                return next_hostgroup(); 
            } else {
                logger.debug("need to create hostgroup resolving hosts..", hostgroup._hosts);
                resolve_hosts(hostgroup._hosts, function(err, hosts) {
                    if(err) return next_hostgroup(err);
                    hostgroup.hosts = hosts;
                    logger.debug("creating hostgroup");
                    db.Hostgroup.create(hostgroup, function(err, _hostgroup) {
                        if(err) return next_hostgroup(err);
                        hostgroup._id = _hostgroup._id;
                        logger.debug(JSON.stringify(_hostgroup, null, 4));       
                        next_hostgroup();
                    });
                });
            }
        });
    }, cb);
}

//make sure all testspecs exist
function ensure_testspecs(testspecs, cb) {
    async.eachSeries(testspecs, function(testspec, next_testspec) {
        //crude, but let's key by name for now..
        db.Testspec.findOne({name: testspec.name}, function(err, _testspec) {
            if(err) return next_testspec(err);

            if(_testspec) {
                logger.debug("testspec seems to already exists");
                testspec._id = _testspec._id;
                return next_testspec(); 
            } else {
                logger.debug("creating testspec");
                db.Testspec.create(testspec, function(err, _testspec) {
                    if(err) return next_testspec(err);
                    testspec._id = _testspec._id;
                    logger.debug(JSON.stringify(_testspec, null, 4));       
                    next_testspec();
                });
            }
        });
    }, cb);
}

exports.import = function(url, sub, cb) {
    logger.debug("config importer");
    
    //load requested json
    request.get({url:url, json:true}, function(err, r, meshconfig) {
        if(err) return next(err);

        var meshconfig_desc = meshconfig.description;

        //process hosts
        var hosts_info = [];
        meshconfig.organizations.forEach(function(org) {
            org.sites.forEach(function(site) {
                site.hosts.forEach(function(host) {
                    var services = [];
                    host.measurement_archives.forEach(function(ma) {
                        var read_url = ma.read_url; //TODO
                        services.push({type: get_service_type(ma.type)});
                    });

                    var host_info = {
                        services: services,
                        no_agent: false,
                        hostname: host.addresses[0], 
                        sitename: host.description,
                        info: {},
                        communities: [],
                        admins: [sub.toString()],
                    };
                    if(host.toolkit_url && host.toolkit_url != "auto") host_info.toolkit_url = host.toolkit_url;
                    hosts_info.push(host_info);
                });
            });
        });

        //process hostgroups / testspecs
        var hostgroups = [];
        var testspecs = [];
        var tests = [];
        meshconfig.tests.forEach(function(test) {
            var member_type = test.members.type;
            if(member_type != "mesh") return next("only mesh type is supported currently");

            var type = get_service_type(test.parameters.type);
            var hostgroup = {
                name: test.description+" Group",
                desc: "Imported by MCA importer",
                type: "static",
                service_type: type,
                admins: [sub.toString()],
                _hosts: test.members.members, //hostnames that needs to be converted to host id
            };
            hostgroups.push(hostgroup);

            var testspec = {
                name: test.description+" Testspecs",
                desc: "Imported by MCA importer",
                service_type: type,
                admins: [sub.toString()],
                specs: test.parameters,
            };
            testspecs.push(testspec);

            tests.push({
                name: test.description,
                //desc: "imported", //I don't think this is used anymore
                service_type: get_service_type(test.parameters.type),
                mesh_type: "mesh", 
                enabled: true,
                nahosts: [],
                _agroup: hostgroup, //
                _testspec: testspec //tmp
            });
        });


        //now do update (TODO - should I let caller handle this?)
        ensure_hosts(hosts_info, function(err) {
            ensure_hostgroups(hostgroups, function(err) {
                ensure_testspecs(testspecs, function(err) {
                    //add correct db references
                    tests.forEach(function(test) {
                        test.agroup = test._agroup._id;
                        test.testspec = test._testspec._id;
                    });
                    cb(null, tests);
                });
            });
        });

    }); //loading meshconfig json
}

