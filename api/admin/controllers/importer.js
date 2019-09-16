'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const async = require('async');
const request = require('request');
const _ = require('underscore');

//mine
const config = require('../../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../../models');
const shared = require('../../sharedFunctions');

const pSConfigKeys = [
    "archives",
    "addresses",
    "groups",
    //"tests",
    "schedules",
    "tasks",
    "_meta",
    "hosts",
    "err",
    "config_param"
];

const meshConfigKeys = [
    "organizations",
    //"tests",
    "description",
    "measurement_archives",
    "administrators",
];

function get_service_type(mc_type) {
    switch(mc_type) {
        case "perfsonarbuoy/bwctl": return "bwctl";
        case "perfsonarbuoy/owamp": return "owamp";
        case "traceroute": return "traceroute";
        case "pinger": return "ping";
        default: 
           logger.error("unknown importedConfig service type", mc_type);
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
function ensure_hosts(hosts_info, tests, cb) {
    var service_types = [];
    /*
    tests.forEach( function( test ) {
        service_types.push( test.service_type );
        //service_types[ test.service_type ] = 1;

    });
    */


    //console.log("HOSTS_INFO", hosts_info, "HOSTS_INFO");

    async.eachSeries(hosts_info, function(host, next_host) {
        db.Host.findOne({hostname: host.hostname}, function(err, _host) {
            if(err) return next_host(err);

            if(_host) {
                //console.log("_HOST", _host);
                console.log("_HOST._ID", _host._id);
                logger.debug("host already exists", host.hostname);
                host._id = _host._id;
                if(_host.lsid) {
                    if ( "sitename" in host ) {
                        var sitename = host.sitename;
                        if ( typeof sitename != "undefined" ) {
                            _host.desc = sitename;
                            _host.save();
                        }
                    }
                    return next_host();
                } else {
                    //for adhoc host, make sure we have all services listed
                    if ( "services" in host ) {
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
                    }
                        _host.save(next_host);
                }
            } else {
                logger.debug("missing host found - inserting " + host.hostname, _host);
                //var types = {};
                service_types.forEach(function(service) {
                    host.services.push({ "type": service });
                });
                db.Host.create(host, function(err, _host) {
                    if(err) return next_host(err);
                    logger.debug("created host");
                    logger.debug(JSON.stringify(_host, null, 4));
                    return next_host()
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
        console.log("testspec in ensure_testspec", testspec);
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

// remove extraneous test parameters
function remove_extraneous_test_parameters( spec ) {

    if ( typeof spec == "undefined" ) return spec;

    delete spec.session_count;
    delete spec.loss_threshold;
    delete spec.type;
    delete spec.force_bidirectional;

    return spec;
}

exports.import = function(url, sub, cb) {
    logger.debug("config importer", url);

    //load requested json
    request.get({url:url, json:true, timeout: 3000}, function(err, r, importedConfig) {
        if(err) return cb(err);
        if(r.statusCode != 200) return cb("non-200 response from "+url);
        exports._process_imported_config( importedConfig, sub, cb );


    }); //loading config json
}

exports._detect_config_type = function( config ) {
    var format;
    if ( config !== null 
            && ( typeof( config ) != "undefined" ) 
            && !_.isEmpty( config ) 
            && _.isObject( config ) ) {

       var keys = _.keys( config );
       /*(
       console.log("KEYS", keys);
       */
       console.log("pSConfigKeys", pSConfigKeys);
       console.log("meshConfigKeys", meshConfigKeys);
       /*
       console.log("intersection meshconfig",  _.intersection( keys, meshConfigKeys ));
       console.log("intersection meshconfig LENGTH",  _.intersection( keys, meshConfigKeys ).length);
       */
       if ( _.intersection( keys, pSConfigKeys ).length > 0 ) {
           //console.log("format:", "psconfig");
           format = "psconfig";
       } else if ( _.intersection( keys, meshConfigKeys ).length > 0  ) {
           //console.log("format:", "meshconfig");
           format = "meshconfig";
       }


   } 
   return format;

};

exports._process_imported_config = function ( importedConfig, sub, cb, disable_ensure_hosts) {

    var config_format = exports._detect_config_type( importedConfig );

    // Main config object
    var mainConfig = {};
    mainConfig.tests = [];
    mainConfig.testspecs = [];
    mainConfig.hostgroups = [];

    var tests = mainConfig.tests;
    var testspecs = mainConfig.testspecs;
    var hostgroups = mainConfig.hostgroups;

    console.log("hostgroups", hostgroups);

    //var out = importedConfig;
    //out = JSON.stringify( out, null, "\t" );

    //console.log("importedConfig", importedConfig);
    //console.log("OUT", out);
    sub = sub.toString();

    // config_params holds parameters to pass back to the callback
    var config_params = {};

    var hosts_info;
    if ( config_format == "meshconfig" ) {
        hosts_info = exports._process_meshconfig( importedConfig, sub, config_params, mainConfig, cb );
    } else if ( config_format == "psconfig" ) {
        hosts_info = exports._process_psconfig( importedConfig, sub, config_params, mainConfig, cb );
        hostgroups = exports._extract_psconfig_hostgroups( importedConfig, sub, mainConfig );
        testspecs = exports._extract_psconfig_tests( importedConfig, sub, mainConfig );
        console.log("testspecs", testspecs);
    }

    //if ( config_format == "psconfig" ) {
        //console.log("IMPORTED CONFIG!!!!\n");
        //console.log( JSON.stringify( importedConfig));

        console.log("MAINCONFIG INTERMEDIATE", config_format, "\n");
        console.log( JSON.stringify( mainConfig, null, 3 ));

        console.log("CONFIG_PARAMS INTERMEDIATE", config_format, "\n");
        console.log( JSON.stringify( config_params, null, 3 ));

    //}


    //now do update (TODO - should I let caller handle this?)
    if (! disable_ensure_hosts ) {
        ensure_hosts(hosts_info, tests, function(err) {
            ensure_hostgroups(hostgroups, function(err) {
                ensure_testspecs(testspecs, function(err) {
                    //add correct db references
                    tests.forEach(function(test) {
                        console.log("TEST", test);
                        test.agroup = test._agroup._id;
                        //test.testspec = test._testspec._id;
                    });
                    cb(null, tests, config_params);
                });
            });
        });
    } else {
        cb(null, tests, config_params);

    }

};

exports._process_meshconfig = function ( importedConfig, sub, config_params, mainConfig, cb ) {
    var tests = mainConfig.tests;
    var hostgroups = mainConfig.hostgroups;
    var testspecs = mainConfig.testspecs;

    var config_desc = importedConfig.description;
    if ( config_desc ) {
        config_params.description = config_desc;
    }


    // process central MAs
    var ma_url_obj = {};
    if ( "measurement_archives" in importedConfig ) {
        importedConfig.measurement_archives.forEach(function(ma) {
            if ( ! ( "archives" in config_params ) ) config_params.archives = [];
            ma_url_obj[ ma.write_url ] = 1;
        });
    }

    var ma_urls = Object.keys( ma_url_obj );
    config_params.archives = ma_urls;
    //importedConfig.ma_urls = ma_urls;
    //importedConfig.config_params = config_params;

    //console.log("IMPORTER ma_urls", ma_urls);
    //console.log("config_params", config_params);


    //process hosts
    var hosts_info = [];
    importedConfig.organizations.forEach(function(org) {
        org.sites.forEach(function(site) {
            if ( !( "hosts" in site ) ) return;
            site.hosts.forEach(function(host) {
                var services = [];

                if ( "measurement_archives" in host ) {
                    host.measurement_archives.forEach(function(ma) {
                        services.push({type: get_service_type(ma.type)});
                    });
                }

                var addr_array = [];
                for(var i in host.addresses) {
                    var addr = host.addresses[i];
                    addr_array.push( {
                        address: addr
                    } );

                }

                var host_info = {
                    services: services,
                    no_agent: false,
                    hostname: host.addresses[0],
                    sitename: host.description,
                    addresses: addr_array,
                    info: {},
                    communities: [],
                    admins: [sub.toString()]
                };
                if(host.toolkit_url && host.toolkit_url != "auto") host_info.toolkit_url = host.toolkit_url;
                hosts_info.push(host_info);
            });
        });
    });


    //process hostgroups / testspecs
    //var hostgroups = [];
    //var testspecs = [];
    //var tests = [];


    var hosts_service_types = {};
    importedConfig.tests.forEach(function(test) {
        var member_type = test.members.type;
        if(member_type != "mesh") return cb("only mesh type is supported currently");

        var type = get_service_type(test.parameters.type);
        var hostgroup = {
            name: test.description+" Group",
            desc: "Imported by PWA importer",
            type: "static",
            service_type: type,
            admins: [sub.toString()],
            _hosts: test.members.members, //hostnames that needs to be converted to host id
        };
        hostgroups.push(hostgroup);

        test.parameters = remove_extraneous_test_parameters( test.parameters );

        var testspec = {
            name: test.description+" Testspecs",
            desc: "Imported by PWA importer",
            service_type: type,
            admins: [sub.toString()],
            specs: test.parameters
        };
        testspecs.push(testspec);

        var hosts_obj = {};
        hostgroup._hosts.forEach( function( host )  {
            if (! ( host in hosts_service_types ) ) {
                hosts_service_types[ host ] = {};
            }
            hosts_service_types[ host ][ type ] = 1;
        });

        tests.push({
            name: test.description,
            //desc: "imported", //I don't think this is used anymore
            service_type: type ,
            mesh_type: "mesh", // TODO: allow other mesh_types
            enabled: true,
            nahosts: [],
            _agroup: hostgroup, //
            _testspec: testspec //tmp
        });
    });

    console.log("MESHCONFIG hosts_service_types", hosts_service_types);


    hosts_info.forEach( function( host ) {
        var hostname = host.hostname;        
        var host_types = hosts_service_types[ hostname ];
        if ( typeof host_types == "undefined" ) return;
        var types = Object.keys( host_types );
        types.forEach( function( type ) {            
            host.services.push( { "type": type } );
        });

    });

    console.log("MESHCONFIG INTERIM CONFIG", mainConfig);
    console.log("MESHCONFIG INTERM CONFIG PARAMS", config_params);

};

exports._process_psconfig = function ( importedConfig, sub, config_params, mainConfig, cb ) {
    var tests = mainConfig.tests;
    var hostGroups = mainConfig.hostgroups;
    var testspecs = mainConfig.testspecs;

    var config_desc = importedConfig._meta["display-name"];
    if ( config_desc ) {
        config_params.description = config_desc;
    }

    var archive_obj = exports._extract_psconfig_mas( importedConfig , config_params );

    console.log("archive_obj", archive_obj);

    config_params.archives = archive_obj.central;


    var hosts_info = exports._extract_psconfig_hosts( importedConfig, config_params, sub );
    
    hostGroups = exports._extract_psconfig_hostgroups( importedConfig, sub, mainConfig );
    //config_params.hosts = hosts_obj.hosts;
    console.log("hosts_info", hosts_info);
    config_params.addresses = hosts_info.addresses;

    testspecs = exports._extract_psconfig_tests( importedConfig, sub, mainConfig );
    

    console.log("config_params psconfig", config_params);


    return hosts_info;
};

exports._extract_psconfig_tests = function( importedConfig, sub, mainConfig ) {
    var hostgroups = mainConfig.hostgroups;
    var importedTests = importedConfig.tests;
    var tests = mainConfig.tests;
    var testspecs = [];
    _.each( importedTests, function( testObj, testName ) {
        testObj.name = testName;

        delete testObj.spec.source;
        delete testObj.spec.dest;

        if ( testObj.type == "latencybg" ) {
            testObj.schedule_type = "continuous";
        } else {
            testObj.schedule_type = "interval";
        }
        var type = shared.convert_service_type( testObj.type );
        if ( importedConfig.tasks[ testName ].tools ) {
            var tool = importedConfig.tasks[ testName ].tools[0];
            tool = tool.replace("bwctl", "");
            if ( tool ) {
                testObj.spec.tool= shared.convert_tool( tool, true );

            }
        }
        if ("duration" in testObj.spec && isNaN(testObj.spec.duration)) {
            testObj.spec.duration = shared.iso8601_to_seconds( testObj.spec.duration );
        }
        // TODO: review - hostgroups not required when creating testspecs
        console.log("BEFORE ADDING HOSTGROUPS testObj", testObj);
        var groups = importedConfig.groups;
        var tasksObj = importedConfig.tasks;



        var hosts = [];
        _.each( tasksObj, function( taskObj, taskName ) {
            if ( taskObj.test == testName ) {
                var thisTask = taskObj;
                var groupName = thisTask.group;
                //var tools = thisTask.tools;
                //testObj.spec.tool = tools;
                //hosts = importedConfig.tests[ thisTask.test ].type; 
                hosts = _.map(groups[ groupName ].addresses, function(obj, index) {return obj.name;});
                var scheduleName = thisTask.schedule;
                if ( scheduleName in importedConfig.schedules ) {
                    var scheduleObj = importedConfig.schedules[ scheduleName ];
                    var interval = shared.iso8601_to_seconds( scheduleObj.repeat );
                    testObj.spec.interval = interval;
                }
            }

        });
       console.log("hosts", hosts); 
        var hostgroup = {
            name: testName+" Group",
            desc: "Imported by PWA importer",
            type: "static",
            service_type: type,
            admins: [sub.toString()],
            _hosts: hosts, //hostnames that needs to be converted to host id
        };
        
        shared.rename_dashes_to_underscores( testObj.spec );

        var testspec = {
            service_type: type,
            admins: [sub.toString()],
            specs: testObj.spec,
        };

        tests.push({
            name: testName+" Testspec",
            desc: "Imported by PWA pSConfig importer",
            //desc: "imported", //I don't think this is used anymore
            service_type: type ,
            mesh_type: "mesh", // TODO: allow other mesh_types
            enabled: true,
            nahosts: [],
            _agroup: hostgroup, 
            //specs: testspec //tmp
            specs: testObj.spec

        });


        console.log("testObj", testObj);
    });
    console.log("tests", tests);

    return tests;

};

exports._extract_psconfig_hostgroups = function( importedConfig, sub, mainConfig ) {
    var groups = importedConfig.groups;
    var hostgroups = mainConfig.hostgroups;
    var testspecs = mainConfig.testspecs;

    console.log("groups", JSON.stringify(groups, null, 4) );
    //var hostgroups = [];

    _.each( groups, function( groupObj, groupName ) {
        //var serviceType = 
        var tasks = importedConfig.tasks;
        console.log("tasks", JSON.stringify(tasks, null, 4) );

        var serviceType;
        _.each( tasks, function( taskObj, taskName ) {
            if ( taskObj.group == groupName ) {
                serviceType = importedConfig.tests[ taskObj.test ].type; 
            }

        });

        var group = {
            name: groupName,
            type: "static",
            //service_type: serviceType,
            admins: [sub.toString()],
            desc: "Imported by PWA pSConfig importer",
            _hosts: _.map(groupObj.addresses, function(obj, index) {return obj.name;}),
        };
        if ( serviceType ) {
            group.service_type = shared.convert_service_type( serviceType );

        }
        hostgroups.push( group );

    });

    console.log("HOSTgroups array", JSON.stringify(hostgroups, null, 4) );
    return hostgroups;

};

exports._extract_psconfig_hosts = function( importedConfig, config_params, sub ) {
    var hosts_obj = {};

    // Retrieve host info from importedConfig
    /*
     *   "name": "iperf3 TCP Test Between Testbeds Group",
         "desc": "Imported by PWA importer",
         "type": "static",
         "service_type": "bwctl",
         "admins": [
            "1"
         ],
         "_hosts": [
     * */
    //console.log("config_params", config_params);
    console.log("importedConfig", JSON.stringify(importedConfig, null, "\t"));
    var hosts_info = [];
    var addrs = importedConfig.addresses;
    var hostsImported = importedConfig.hosts;
    _.each( addrs, function(hostInfo, hostname) {
        console.log("hostname ", hostname);
        console.log("hostInfo", hostInfo);
        var desc = hostInfo._meta["display-name"];
        var toolkitURL = hostInfo._meta["display-url"];
        var address = hostInfo.address;
        var archives = hostsImported[address].archives;
        var ma_urls = [];
        var local_ma = false;

        if ( archives ) {
            _.each( archives, function( archiveName ) {
                var currentURL = importedConfig.archives[ archiveName ].data.url;
                if ( currentURL.includes( hostname ) ) {
                    local_ma = true;
                } else {
                    // TODO: eventually add support for archivers other than Esmond
                    ma_urls.push( currentURL );
                }


            });
            //local_ma = ma_urls.length > 0;
        }

        /*var row = {};
        row.desc = desc;
        row.toolkit_url = toolkitURL;
        row.address = address;
        */

        hosts_obj[ hostname ] = {};
        hosts_obj[ hostname ].desc = desc;
        hosts_obj[ hostname ].toolkit_url = toolkitURL;
        hosts_obj[ hostname ].address = hostInfo.address;


                var host_info = {
                    //services: services,
                    no_agent: false,
                    hostname: hostname,
                    sitename: desc,
                    local_ma: local_ma,
                    ma_urls: ma_urls,

                    //addresses: addr_array, // TODO: ADD MULTIPLE ADDRESSES
                    info: {},
                    communities: [],
                    admins: [sub],
                    _meta: {
                        "display-name": desc,
                        "display-url": toolkitURL
                    }
                };


                //console.log("host_info", host_info);
                if(host_info.toolkit_url && host_info.toolkit_url != "auto") host_info.toolkit_url = host_info.toolkit_url;
                hosts_info.push(host_info);
       
       /* hosts_service_types example from meshconfig format
        *
        * hosts_service_types { 'perfsonar-dev5.grnoc.iu.edu': { bwctl: 1, traceroute: 1, owamp: 1 }},
  'ps-dev-deb8-1.es.net': { bwctl: 1, traceroute: 1, owamp: 1 },
  'ps-dev-el6-1.es.net': { bwctl: 1, traceroute: 1, owamp: 1, ping: 1 },
        *
        * 
       */ 


    });

    //config_params.hosts = hosts_info;
    //hosts_obj.addresses = hosts_obj;


    console.log("hosts_info before returning", hosts_info);
    return hosts_info;
};

exports._extract_psconfig_mas = function( importedConfig, config_params ) {
    // Use a hash, keyed on archive type, to return the MA info
    // i.e. archives.central = []
    // archives.host = [] // Local MAs for testpoints
    var archives = {};
    archives.central = [];
    archives.host = [];

    // process central MAs
    var ma_url_obj = {};
    if ( "archives" in importedConfig ) {
        //console.log("ARCHIVES");
        Object.keys( importedConfig.archives ).forEach(function(ma_name) {
            var ma = importedConfig.archives[ ma_name ];
            if ( ! ( "archives" in config_params ) ) config_params.archives = [];
            var ma_url = importedConfig.archives[ ma_name ].data.url;
            ma_url_obj[ ma_url ] = 1;

            if ( "tasks" in importedConfig ) {
                var num_ma_instances = 0;
                _.each( importedConfig.tasks, function( task, taskName ) {
                    if ( _.indexOf( task.archives, ma_name ) > -1 ) {
                        num_ma_instances++;
                    }
                });
                // If the MA appears in all task specs, we consider it a central MA
                if ( num_ma_instances == Object.keys( importedConfig.tasks).length) {
                    archives.central.push( ma_url );
                } else {
                    // Otherwise, it is a host MA
                    archives.host.push( ma_url );

                }
            };
            //console.log("IMPORTED", JSON.stringify(importedConfig, null, "\t"));
            //console.log("archives", JSON.stringify( archives, null, "\t"));
            //console.log("ma_url_obj", JSON.stringify( ma_url_obj, null, "\t"));
            var ma_urls = Object.keys( ma_url_obj );

        });

    }

    return archives;

};
