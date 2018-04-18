'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const async = require('async');
const moment = require('moment');

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

function convert_tool( tool ) {
    var tool_conversions = {
        "bwctl/nuttcp": "nuttcp",
        "bwctl/iperf": "iperf",
        "bwctl/iperf3": "iperf3"

    };
    // update tool names
    if ( tool in tool_conversions ) {
        tool = tool_conversions[ tool ];
    }
    return tool;

}

function meshconfig_testspec_to_psconfig( testspec, name, psc_tests, psc_schedules ) {
    var spec = testspec.specs;
    var test = psc_tests[ name ];
    var testspec = psc_tests[ name ].spec;
    var service_types = {
        "bwctl": "throughput",
        "owamp": "latencybg",
        "ping": "rtt",
        "traceroute": "trace"

    };


    if ( test.type in service_types ) {
        test.type = service_types[ test.type ];

    }

    // change underscores to dashes in all field names in the "spec" stanza
    rename_underscores_to_dashes( spec );

    var interval_seconds = testspec.interval;
    if ( "test-interval" in testspec ) {
        interval_seconds = testspec["test-interval"];
    }

    // this array is a list of fields we will convert from seconds to iso8601
    var iso_fields = [
        "duration",
        "interval",
        "test-interval"
    ];

    for(var i in iso_fields) {
        var field = iso_fields[i];
        if ( testspec[ field ] ) {
            testspec[ field ] = seconds_to_iso8601(spec[ field ] );
        }

    }

    rename_field( spec, "test-interval", "interval" );
    rename_field( spec, "sample-count", "packet-count" );

    delete spec.tool;
    delete spec["force-bidirectional"];


    if ( "interval" in testspec ) {
        var interval = testspec[ "interval" ];
        var interval_name = "repeat-" + interval;
        psc_schedules[ interval_name ] = {
            "repeat": interval,
            "sliprand": true

        };

        // "slip"
        // convert slip from random_start_percentage
        if ( "random-start-percentage" in testspec && interval_seconds) {
            var slip = testspec["random-start-percentage"] * interval_seconds / 100;
            slip = seconds_to_iso8601( slip );
            psc_schedules[ interval_name ].slip = slip;

        }

        delete spec["random-start-percentage"];

        //delete testspec[ "test-interval" ];
    } else {
        //console.log("INTERVAL NOT FOUND", testspec);

    }


    // rename protocol: udp to udp: true
    if ( ( "protocol" in  testspec ) &&  testspec.protocol == "udp" ) {
        testspec.udp = true;
        delete testspec.protocol;
    }


    // handle newer "ipversion" format
    // old: ipv4-only, ipv6-only
    // new: ip-version: 4, 6
    if ("ipv4-only" in testspec ) {
        testspec["ip-version"] = 4;
        delete testspec["ipv4-only"];
    }
    if ("ipv6-only" in testspec ) {
        testspec["ip-version"] = 6;
        delete testspec["ipv6-only"];
    }

    delete spec.type;

}

function rename_underscores_to_dashes( obj ) {
    for(var key in obj ) {
        var newkey = key.replace(/_/g, "-");
        obj[ newkey ] = obj[ key ];
        if (key.match(/_/) ) delete obj[ key ];

    }

}

function rename_field( obj, oldname, newname ) {
    if ( oldname in obj ) {
        obj[ newname ] = obj[ oldname ];
        delete obj[ oldname ];
    }
    return obj;

}

function seconds_to_iso8601( seconds ) {
    return moment.duration(seconds, 'seconds').toISOString();
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
        //console.dir(host);
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

function generate_mainfo(service, format) {
    var locator = "http://"+service.ma.hostname+"/esmond/perfsonar/archive";

    if ( service.ma.local_ma_url ) {
        locator = service.ma.local_ma_url;
    }

    var type = null;
    switch(service.type) {
    case "bwctl": type = "perfsonarbuoy/bwctl"; break;
    case "owamp": type = "perfsonarbuoy/owamp"; break;
    default:
        //pinger, traceroute
        type = service.type;
    }

    //if ( typeof type == "undefined" ) console.log("NO TYPE; service, service");
    return generate_mainfo_url(locator, format, type);
}

function generate_mainfo_url(locator, format, type) {

    if ( format != "psconfig" ) {
        return {
            read_url: locator,
            write_url: locator,
            type: type,
        };
    } else {
        return {
            archiver: "esmond",
            data: {
                url: locator,
                "measurement_agent": "{% scheduled_by_address %}",
            }
        };

    }

}


function set_test_meta( test, key, value ) {
    if ( ! test._meta ) test._meta = {};
    test._meta[key] = value;

}

function generate_group_members( test, group, type, host_groups, host_catalog, next, addr_prefix ) {
    if ( ( typeof addr_prefix == "undefined" ) || ( type == "mesh" ) ) {
        addr_prefix = "";
    }
    var group_prefix = addr_prefix.replace("-", "");
    if ( group_prefix == "" ) group_prefix = "a";
    var group_field = group_prefix + "group";
    resolve_hostgroup(group, function(err, hosts) {
        var addr = addr_prefix + "addresses";
        if ( ! ( test.name in host_groups ) ) {
            host_groups[ test.name ] = {
                "type": type
            };
        }
        if ( ! ( addr in host_groups[ test.name ] ) ) {
            host_groups[ test.name ][ addr ] = [];
        }

        set_test_meta( test, "_hostgroup", test.name );
        set_test_meta( test, "_test", test.name );

        if ( ( "testspec" in test ) && ("specs" in test.testspec ) && ( "tool" in test.testspec.specs ) ) {
            set_test_meta( test, "_tool", convert_tool( test.testspec.specs.tool ));
        } 

        if(err) return next(err);
        test[ group_field ] = hosts;
        hosts.forEach(function(host) {
            host_catalog[host._id] = host;
            if ( host.hostname ) {
                host_groups[ test.name ][ addr ].push( 
                    { "name": host.hostname }
                    );
            } else {
                host.addresses.forEach( function( address ) {
                    host_groups[ test.name ][ addr ].push(
                        { "name": address.address }
                        );
                });
            }


        });
        next();
    });

}

//synchronous function to construct meshconfig from admin config
exports.generate = function(_config, opts, cb) {
    //catalog of all hosts referenced in member groups keyed by _id
    var host_catalog = {}; 
    var host_groups = {};

    var format = opts.format;

    //resolve all db entries first
    if(_config.admins) _config.admins = resolve_users(_config.admins);
    async.eachSeries(_config.tests, function(test, next_test) {
        var type = test.mesh_type;

        if(!test.enabled) return next_test();
        async.parallel([
            function(next) {
                //a group
                if(!test.agroup) return next();
                generate_group_members( test, test.agroup, type, host_groups, host_catalog, next, "a-" );
            },
            function(next) {
                //b group
                if(!test.bgroup) return next();
                generate_group_members( test, test.bgroup, type, host_groups, host_catalog, next, "b-" );
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
            description: _config.name,
        };

        //psconfig root template
        var psconfig = {
            archives: {},
            addresses: {},
            groups: {},
            tests: {},
            schedules: {},
            tasks: {},
            _meta: {
                "display-name": _config.name
            },

        }


        if(_config.desc) mc.description += ": " + _config.desc;
        if(_config._host_version) mc.description += " (v"+_config._host_version+")";

        //set meshconfig admins
        if(_config.admins) {
            mc.administrators = [];
            _config.admins.forEach(function(admin) {
                mc.administrators.push({name: admin.fullname, email: admin.email});
            });
        }

        //convert services to sites/hosts entries
        //mca currently doesn't handle the concept of organization
        var org = {
            sites: [],
        };

        var last_ma_number = 0;
        var maHash = {};
        var psc_addresses = {};
        var psc_groups = {};
        // make a list of the psconfig archives
        var psc_archives = {};
        var psc_tests = {};
        var psc_schedules = {};
        var psc_tasks = {};
        var psc_hosts = {};

        //register sites(hosts)
        for(var id in host_catalog) {
            var _host = host_catalog[id];
            var host = {
                addresses: [ _host.hostname ],
                measurement_archives: [ ],
                description: _host.desc||_host.sitename,
                toolkit_url: _host.toolkit_url||"auto",
            }
            if(_host.no_agent) host.no_agent = 1;
            //logger.warn(_host.hostname, _host.services.length);

            psc_addresses[ _host.hostname ] = {
                "address":  _host.hostname,
                "host": _host.hostname,
                "_meta": {
                    "display-name": _host.desc||_host.sitename
                    // TODO: add org?
                    //"organization": _host.org

                }
            };
            if ( ! ( _host.hostname in psc_hosts) ) psc_hosts[ _host.hostname ]  = {};

            //create ma entry for each service
            _host.services.forEach(function(service) {
                if(service.type == "mp-bwctl") return;
                if(service.type == "ma") return;
                if(service.type == "mp-owamp") return;
                if(opts.ma_override) service.ma = { hostname: opts.ma_override }
                if(!service.ma) {
                    logger.error("NO MA service running on ..");
                    logger.debug(service);
                    return;
                }

                if ( format == "psconfig" ) {
                    if ( !_host.local_ma && !_config.force_endpoint_mas ) {
                        return;
                    }
                    var maInfo = generate_mainfo(service, format);
                    var maName = "host-archive" + last_ma_number;
                    var url = maInfo.data.url;
                    if ( ! ( url in maHash ) ) {
                        psc_archives[ maName ] = maInfo;
                        if ( ! ( "_archive" in _host ) ) _host._archive = [];
                        _host._archive.push(maName);
                        if ( ! ( "archives" in psc_hosts[ _host.hostname ]) ) psc_hosts[ _host.hostname ].archives  = [];
                        psc_hosts[ _host.hostname ].archives.push( maName );
                        last_ma_number++;
                        maHash[url] = 1;
                    } else {

                    }
                } else {
                    host.measurement_archives.push(generate_mainfo(service, format));
                }

            });

                // TODO figure out how to have multiple tests of same type
                // (need unique hostgroup names)

            var site = {
                hosts: [ host ],
                location: {}
            };

            //pull location info (some location- info that comes with sLS isn't allowed for meshconfig
            //so I have to list all that's allowed (v4 host may be ok?)
            ['country', 'street_address', 'city', 'state', 'latitude', 'longitude'].forEach((k)=>{
                site.location[k] = _host.info['location-'+k];
            });
            if(_host.info['location-code']) site.location['postal_code'] = _host.info['location-code'];//odd one
            org.sites.push(site);
        }

        var ma_prefix = "test-archive";
        var last_test_ma_number = 0;
        var test_mas = [];
        if ( "ma_urls" in _config ) {
            _config.ma_urls.forEach(function(url) {
                var maName = "test-archive" + last_test_ma_number;
                test_mas.push( maName );
                var maInfo = generate_mainfo_url(url, "psconfig");
                psc_archives[ maName ] = maInfo;

                last_test_ma_number++;
            });
        }
        // Retrieve MA URLs from the _config object

        psconfig.archives = psc_archives;
        psconfig.addresses = psc_addresses;
        psconfig.groups = host_groups;
        //psconfig.groups = psc_groups;
        mc.organizations.push(org);


        //now the most interesting part..
        _config.tests.forEach(function(test) {

            function has_service(host_id) {
                var host = host_catalog[host_id];
                var found = false;
                host.services.forEach(function(service) {
                    if(service.type == test.service_type) found = true;
                });
                return found;
            }

            if(!test.enabled) return;
            var members = {
                type: test.mesh_type
            };
            switch(test.mesh_type) {
                case "disjoint":
                    members.a_members = generate_members(test.agroup.filter(host=>has_service(host._id)));
                    members.b_members = generate_members(test.bgroup.filter(host=>has_service(host._id)));
                    break;
                case "mesh":
                    members.members = generate_members(test.agroup.filter(host=>has_service(host._id)));
                    break;
            }
            if(test.nahosts && test.nahosts.length > 0) {
                members.no_agents = generate_members(test.nahosts.filter(host=>has_service(host._id)));
                members.no_agents.forEach( function( host ) {
                    psconfig.addresses[ host ][ "no-agent" ] = true;
                });
            }

            var name = test.name;
            var testspec = test.testspec;

            var config_archives = _config.ma_urls;


            psc_tests[ name ] = {
                "type": test.service_type,
                "spec": {
                    "source": "{% address[0] %}",
                    "dest": "{% address[1] %}"
                },
            };

            psc_tests[ name ].spec = testspec.specs;

            var spec = testspec.specs;

            if ( format == "psconfig" ) {
                meshconfig_testspec_to_psconfig( testspec, name, psc_tests, psc_schedules );
            }

            var interval = psc_tests[ name ].spec["interval"];

            psc_tasks[ name ] = {
                "group": test._meta._hostgroup,
                "test": test._meta._test,
                "archives": test_mas,
                "_meta": {
                    "display-name": name

                }
            };

            if ( interval ) {
                psc_tasks[ name ].schedule = "repeat-" +  interval;

            }

            delete psc_tests[ name ].spec["test-interval"];

            if ( ( "_tool" in test._meta ) &&  typeof test._meta._tool != "undefined" ) {
                psc_tasks[ name ].tools = [ test._meta._tool ];

            }

            var parameters = test.testspec.specs;
            if ( format != "psconfig" ) parameters.type = get_type(test.service_type);
            mc.tests.push({
                members: members,
                parameters: parameters,
                description: test.name,
            });
        });

        psconfig.tests = psc_tests;
        psconfig.schedules = psc_schedules;
        psconfig.tasks = psc_tasks;
        psconfig.hosts = psc_hosts;

        //all done
        if ( format == "psconfig" ) {
            cb(null, psconfig);
        } else {
            cb(null, mc);
        }
    });
}

