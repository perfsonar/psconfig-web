'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const async = require('async');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
const common = require('../common');

var profile_cache = null;
var profile_cache_date = null;
function load_profile(cb) {
    logger.info("reloading profiles");
    common.profile.getall(function(err, profiles) {
        if(err) return logger.error(err);
        profile_cache = profiles;
        profile_cache_date = Date.now();

    });
}
//load profile for the first time
load_profile();
setInterval(load_profile, 10*60*1000); //reload every 10 minutes

exports.health = function() {
    var status = "ok";
    var msg = null;
    if(!profile_cache) {
        status = "failed";
        msg = "profile cache not loaded yet?";
    } else {
        if(Date.now() - profile_cache_date > 3600*60*1000) {
            status = "failed";
            msg = "profile cache not loaded for more than an hour";
        }
        if(profile_cache.length == 0) {
            status = "failed";
            msg = "profile cache is empty";
        }
    }
    return {msg: msg, status: status};
}

//convert list of UIDs to list of profile objects
function resolve_users(uids) {
    if(!profile_cache) return null; //auth profile not loaded yet?
    var users = [];
    uids.forEach(function(uid) {
        users.push(profile_cache[uid]);  
    });
    return users;
}

function resolve_testspec(id, cb) {
    db.Testspec.findById(id).exec(cb);
}

//doesn't check if the ma host actually provides ma service
function resolve_ma(host, next) {
    //for each service, lookup ma host
    async.eachSeries(host.services, function(service, next_service) {
        if(!service.ma || service.ma == host._id) {
            //use host if not set or set to the host itself
            service.ma = host; 
            next_service();
        } else {
            //find the ma host
            resolve_host(service.ma, function(err, _host) {
                if(err) return next_service(err);
                service.ma = _host;
                next_service();
            });
        }
    }, function(err) {
        next(err, host);
    });
}
function resolve_host(id, cb) {
    db.Host.findById(id).exec(function(err, host) {
        if(err) return cb(err);
        resolve_ma(host, cb);
    });
}
function resolve_hosts(ids, cb) {
    db.Host.find({_id: {$in: ids}}).lean().exec(function(err, hosts) {
        if(err) return cb(err);
        async.eachSeries(hosts, resolve_ma, function(err) {
            cb(err, hosts);
        });
    });
}
function resolve_hostgroup(id, cb) {
    db.Hostgroup.findById(id).exec(function(err, hostgroup) {
        if(err) return cb(err);
        if(!hostgroup) return cb("can't find hostgroup:"+id);
        //hosts will contain hostid for both static and dynamic (cached by mccache)
        resolve_hosts(hostgroup.hosts, function(err, hosts) {
            if(err) return cb(err);
            cb(null, hosts);
        }); 
    });
}

function generate_members(hosts) {
    var members = [];
    hosts.forEach(function(host) {
        members.push(host.hostname);
    });
    return members;
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
    var locator = "http://"+service.ma.hostname+"/esmond/perfsonar/archive";

    var type = null;
    switch(service.type) {
    case "bwctl": type = "perfsonarbuoy/bwctl"; break;
    case "owamp": type = "perfsonarbuoy/owamp"; break;
    default:
        //pinger, traceroute
        type = service.type;
    }
    return {
        read_url: locator,
        write_url: locator,
        type: type,
    };
}

//synchronous function to construct meshconfig from admin config
exports.generate = function(_config, opts, cb) {
    //catalog of all hosts referenced in member groups keyed by _id
    var host_catalog = {}; 

    //resolve all db entries first
    _config.admins = resolve_users(_config.admins);
    async.eachSeries(_config.tests, function(test, next_test) {
        if(!test.enabled) return next_test();
        async.parallel([
            function(next) {
                //a group
                if(!test.agroup) return next();
                resolve_hostgroup(test.agroup, function(err, hosts) {
                    if(err) return next(err);
                    test.agroup = hosts;
                    hosts.forEach(function(host) { host_catalog[host._id] = host; });
                    next();
                });
            },
            function(next) {
                //b group
                if(!test.bgroup) return next();
                resolve_hostgroup(test.bgroup, function(err, res) {
                    if(err) return next(err);
                    resolve_hosts(res.recs, function(err, hosts) {
                        test.bgroup = hosts;
                        hosts.forEach(function(host) { host_catalog[host._id] = host; });
                        next();
                    });
                });
            },
            function(next) {
                if(!test.nahosts) return next();
                resolve_hosts(test.nahosts, function(err, hosts) {
                    if(err) return next(err);
                    test.nahosts = hosts;
                    hosts.forEach(function(host) { host_catalog[host._id] = host; });
                    next();
                });
            },
            function(next) {
                //star center
                if(!test.center) return next();
                resolve_host(test.center, function(err, host) {
                    if(err) return next(err);
                    test.ceneter = host;
                    host_catalog[host._id] = host;
                    next();
                });
            },
            function(next) {
                //testspec
                if(!test.testspec) return next();
                resolve_testspec(test.testspec, function(err, testspec) {
                    if(err) return next(err);
                    test.testspec = testspec;

                    //suppress testspecs that does't meet min host version
                    if(!_config._host_version) return next();
                    var hostv = parseInt(_config._host_version[0]);
                    var minver = config.meshconfig.minver[test.service_type];
                    for(var k in test.testspec.specs) {
                        //if minver is set for this testspec, make sure host version meets it
                        if(minver[k]) {
                            if(hostv < minver[k]) delete test.testspec.specs[k]; 
                        }
                    }
                    next();
                });
            },
        ], next_test);
    }, function(err) {
        if(err) return logger.error(err);

        //meshconfig root template
        var mc = {
            organizations: [],
            tests: [],
            administrators: [],
            description: _config.name,
            //_debug: config //debug
        };
        if(_config.desc) mc.description += " / " + _config.desc;
        if(_config._host_version) mc.description += " (v"+_config._host_version+")";
     
        //set meshconfig admins
        if(_config.admins) _config.admins.forEach(function(admin) {
            mc.administrators.push({name: admin.fullname, email: admin.email});
        });
    
        //convert services to sites/hosts entries
        //mca currently doesn't handle the concept of organization
        var org = {
            sites: [],
            //administrators: [], //not required (http://docs.perfsonar.net/config_mesh.html#config-mesh-administrator)
            //description: "",
        };

        //register sites(hosts)
        for(var id in host_catalog) {
            var _host = host_catalog[id];
            var host = {
                //administrators: [], //maybe I can populate this?
                addresses: [ _host.hostname ], 
                measurement_archives: [ ], 
                description: _host.sitename,
                toolkit_url: _host.toolkit_url||"auto",
            };
            if(_host.no_agent) host.no_agent = 1;

            //create ma entry for each service
            _host.services.forEach(function(service) {
                if(service.type == "mp-bwctl") return;
                if(service.type == "ma") return;
                if(service.type == "mp-owamp") return;
                if(opts.ma_override) service.ma = { hostname: opts.ma_override }

                //service.ma is already resolved.. (local vs. remote)
                if(service.ma) {
                    //adhoc host might not have locator specified.. in that, case fake it..
                    //if(!service.ma.locator) service.ma.locator = "http://"+_host.hostname+'/esmond/perfsonar/archive';
                    //TODO - should this be configurable?
                    host.measurement_archives.push(generate_mainfo(service));
                } else {
                    logger.error("NO MA service running on ..");
                    logger.debug(service);
                }
            });

            var site = {
                hosts: [ host ],
                location: {}
            };

            /*
            //set all location- info we know
            //-- this includes location-sitename which breaks generate_configuration
            for(var k in _host.info) {
                if(k.indexOf("location-") == 0) {
                    var subk = k.substring("location-".length);
                    site.location[subk] = _host.info[k];
                }
            }
            */
            //pull location info (some location- info that comes with sLS isn't allowed for meshconfig
            //so I have to list all that's allowed (v4 host may be ok?)
            ['country', 'street_address', 'city', 'state', 'latitude', 'longitude'].forEach((k)=>{
                site.location[k] = _host.info['location-'+k];
            });
            if(_host.info['location-code']) site.location['postal_code'] = _host.info['location-code'];//odd one
            org.sites.push(site);
        }
        mc.organizations.push(org);

        //now the most interesting part..
        _config.tests.forEach(function(test) {
            if(!test.enabled) return;
            var members = {
                type: test.mesh_type
            };
            switch(test.mesh_type) { 
            case "disjoint":
                members.a_members = generate_members(test.agroup);
                members.b_members = generate_members(test.bgroup);
                break;
            case "mesh":
                members.members = generate_members(test.agroup);
                break;
            case "star":
                members.members = generate_members(test.agroup);
                if(test.center) members.center_address = test.center.hostname; // || test.center.ip;
                break;
            case "ordered_mesh": 
                members.members = generate_members(test.agroup);
                break;
            }
            if(test.nahosts && test.nahosts.length > 0) {
                members.no_agents = generate_members(test.nahosts);
            }

            var parameters = test.testspec.specs;
            parameters.type = get_type(test.service_type);
            mc.tests.push({
                members: members,
                parameters: parameters,
                description: test.name,
            });
        });

        //all done
        cb(null, mc);
    });
}

