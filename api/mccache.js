#!/usr/bin/node
'use strict';

var fs = require('fs');
var dns = require('dns');
var net = require('net');
var winston = require('winston');
var async = require('async');
var request = require('request');

//mine
var config = require('./config');
var logger = new winston.Logger(config.logger.winston);
var db = require('./models');
var common = require('./common');

db.init(function(err) {
    if(err) throw err;
    logger.info("connected to db");
    //wait_for_mcadmin();
    start(function(err) {
        if(err) throw err;
        console.log("started cache services");
    });
});

/*
//don't start caching before mcadmin has time to sync db and migrate
function wait_for_mcadmin() {
    fs.stat(config.admin.readyfile, function(err, stats) {
        if(err || !stats.isFile()) {
            console.log("waiting for mcadmin to start on "+config.admin.readyfile);
            setTimeout(wait_for_mcadmin, 5000);
        } else {
            logger.info("mcadmin is ready");
            start(function(err) {
                if(err) throw err;
                console.log("started cache services");
            });
        }
    });
}
*/

/*
function upsert_host(rec, cb) {
    //logger.info(rec.uuid);
    //if(!rec.count) rec.count = 0;
    //rec.count++;
    db.Host.findOneAndUpdate({uuid: rec.uuid}, rec, {upsert: true}, cb);
}
*/

//resolve ip or hostname into cb(err, hostname, addresses)
function lookup_addresses(address, cb) {
    var hostname = null;
    if(net.isIP(address)) {
        //lookup hostname first
        var ip = address;
        dns.reverse(ip, function(err, _hostnames) {
            if(err) {
                return cb("couldn't reverse lookup ip: "+ip);
            } 
            if(_hostnames.length > 1) logger.warn("reverse lookup of "+ip+" resulted in multiple hostname - picking first one:"+JSON.stringify(_hostnames));
            hostname = _hostnames[0]; 
           
            //then do lookup all IP addresses
            dns.lookup(hostname, {all: true}, function(err, addresses) {
                if(err) return cb("couldn't lookup "+address);
                cb(null, hostname, addresses);
            });
        }); 
    } else {
        hostname = address;
        dns.lookup(hostname, {all: true}, function(err, addresses) {
            if(err) return cb("couldn't lookup "+address);
            cb(null, hostname, addresses);
        });
    }
}

function create_hostrec(service, uri, cb) {
    //truncate the last 2 path (/lookup/record) which is already part of service-host
    var pathname_tokens = uri.pathname.split("/");
    pathname_tokens.splice(-3);
    var pathname = pathname_tokens.join("/");

    //reconstruct the url for the host record
    var url = uri.protocol+"//"+uri.host+pathname+'/'+service['service-host'][0];
    request({url: url, timeout: 1000*10, json: true}, function(err, res, host) {
        if(err) return cb(err);
        if(res.statusCode != 200) return cb(new Error("failed to cache host from:"+url+" statusCode:"+res.statusCode));
        var rec = {
            uuid: host['client-uuid'][0],
            sitename: host['location-sitename'][0],
            info: get_hostinfo(host),
            location: get_location(host),
            communities: host['group-communities']||[],

            url: url,

            services: [],

            //TODO - I need to query the real admin records from the cache (gocdb2sls service already genenrates contact records)
            //admins: host['host-administrators'], //I just have to store them in our table (lookup service could store empty string for 'host-administrators'..)
            admins: [],

            update_date: new Date(),
            //$inc: { count: 1 }, //number of times updated (exists to allow updateTime update)
        };
        var address = host['host-name'][0]; //could be ip or hostname
        lookup_addresses(address, function(err, hostname, addresses) {
            if(err) return cb(err); 
            rec.hostname = hostname;
            rec.addresses = addresses;
            cb(null, rec);
        });
    });
}

function get_location(service) {
    return {
        longitude: (service['location-longitude']?service['location-longitude'][0]:null),
        latitude: (service['location-latitude']?service['location-latitude'][0]:null), 
        city: (service['location-city']?service['location-city'][0]:null),
        state: (service['location-state']?service['location-state'][0]:null),
        postal_code: (service['location-code']?service['location-code'][0]:null),
        country: (service['location-country']?service['location-country'][0]:null),
    };
}

function get_hostinfo(host) {
    var info = {};
    for(var key in host) {
        var v = host[key];

        if(key == "host-administrators") continue;
        if(key == "host-net-interfaces") continue;
        if(key == "host-name") continue;
        
        ["host-", "pshost-"].forEach(function(prefix) {
            var p = key.indexOf(prefix);
            if(p === 0) {
                //var ikey = key.substr(prefix.length);
                //ikey = ikey.replace(/-/g, '_');
                info[key] = v[0];
            }
        });
    }
    return info;
}

function cache_ls(ls, lsid, cb) {
    logger.debug("caching ls:"+lsid+" from "+ls.url);
    request({url: ls.url, timeout: 1000*10, json: true}, function(err, res, services) {
        if(err) return cb(err);
        if(res.statusCode != 200) return cb(new Error("failed to cahce service from:"+ls.url+" statusCode:"+res.statusCode));

        var hosts = {};  //keyed by uuid
        function get_host(uuid, service, _cb) {
            if(hosts[uuid] !== undefined) return _cb(null, hosts[uuid]);              
            logger.debug("creating hostrecord for uuid"+uuid);
            create_hostrec(service, res.request.uri, function(err, host) {
                if(err) {
                    hosts[uuid] = null; //make it null to signal we failed to create hostrec for this
                    return _cb(err);
                }
                host.lsid = lsid;
                hosts[uuid] = host;
                //logger.debug("adding "+uuid+" -----------------------------------------------------------------------");
                _cb(null, host);
            });
        }

        //populate hosts
        async.eachSeries(services, function(service, next) {
            //ignore record with no client-uuid (probably old toolkit instance?)
            if(service['client-uuid'] === undefined) {
                logger.error("client-uuid not set (old toolkit instance?) - skipping");
                logger.error(service);
                return next();//continue to next service
            }
            var uuid = service['client-uuid'][0]; 
            //logger.debug("caching service:"+service['service-locator'][0] + " on "+uuid);

            get_host(uuid, service, function(err, host) {
                if(err) {
                    logger.error(err);
                    return next(); //continue
                }
                if(!host) return next(); //continue... failed to create host rec.. ignore all services for that host

                //host information may come from more than 1 datasource (or duplicate within the single source..)
                //we need to make sure we don't register more than 1 service for each type per host
                var exist = false;
                var type = service['service-type'][0];
                host.services.forEach(function(_service) {
                    if(_service.type == type) exist = true;
                });
                if(exist) {
                    logger.error("duplicate service for type:"+type+" uuid:"+uuid);
                    return next();
                }
                
                //construct service record
                host.services.push({
                    //client_uuid: uuid,
                    //uuid: uuid+'.'+service['service-type'][0],
                    type: type,
                    name: service['service-name'][0],
                    locator: service['service-locator'][0], //locator is now a critical information needed to generate the config
                    //lsid: lsid, //make it easier for ui

                    sitename: service['location-sitename'][0],
                    //location: get_location(service),
                    
                    //TODO - I need to query the real admin records from the cache (gocdb2sls service already genenrates contact records)
                    //I just have to store them in our table
                    //admins: service['service-administrators'],
                    //$inc: { count: 1 }, //number of times updated (exists to allow updateTime update)
                });



                next();
            });
        }, function(err) {
            if(err) return cb(err);
            //console.log(JSON.stringify(hosts, null, 4));
            async.eachOfSeries(hosts, function(host, uuid, next) {
                if(!host) return next(); //ignore null host
                db.Host.findOneAndUpdate({uuid: uuid}, {$set: host}, {upsert: true, setDefaultsOnInsert: true}, function() {
                    next();
                });
            }, function(err) {
                logger.info("updated "+services.length+" services for "+ls.label+" from "+ls.url + " hosts:"+hosts.length);
                cb();
            });
        });
    })
}

function cache_global_ls(service, id, cb) {
    //load activehosts.json
    request(service.activehosts_url, {timeout: 1000*5}, function(err, res, body) {
        if(err) return cb(err);
        if(res.statusCode != 200) return cb(new Error("failed to download activehosts.json from:"+service.activehosts_url+" statusCode:"+res.statusCode));
        try {
            var activehosts = JSON.parse(body);
            //load from all activehosts
            async.eachSeries(activehosts.hosts, function(host, next) {
                if(host.status != "alive") {
                    logger.warn("skipping "+host.locator+" with status:"+host.status);
                    return next();
                }
                //massage the service url so that I can use cache_ls to do the rest
                service.url = host.locator+service.query;
                cache_ls(service, id, next);
            }, cb); 
        } catch (e) {
            //couldn't parse activehosts json..
            return cb(e);
        }
    }); 
}

function update_dynamic_hostgroup(cb) {
    logger.debug("update_dynamic_hostgroup");
    db.Hostgroup.find({type: 'dynamic'}, function(err, groups) {
        if(err) return cb(err); //TODO -- or should I just lot and continue;
        async.eachSeries(groups, function(group, next) {
            common.filter.resolveHostGroup(group.host_filter, group.service_type, function(err, hosts) {
                if(err) return next(err);
                group.hosts = hosts.recs;
                group.save().then(function() {
                    logger.debug(group.host_filter);
                    logger.debug("... resolved to ...");
                    logger.debug(hosts);
                    next();
                });
            });
        }, function(err) {
            if(err) logger.error(err);
            if(cb) cb();
        });
    });
}

function start(cb) {
    logger.info("starting slscache------------------------------------------------------------------------------");
    async.forEachOf(config.datasource.services, function(service, id, next) {
        function run_cache_ls(_next) {
            cache_ls(service, id, function(err) {
                if(err) logger.error(err);
                logger.debug("done processing private ls");
                update_dynamic_hostgroup(_next);
            }); 
        }

        function run_cache_global_ls(_next) {
            cache_global_ls(service, id, function(err) {
                if(err) logger.error(err);
                logger.debug("done processing global ls");
                update_dynamic_hostgroup(_next);
            }); 
        }

        var timeout = service.cache || 60*30*1000; //default to 30 minutes
        switch(service.type) {
        case "sls":
            setInterval(run_cache_ls, timeout);
            run_cache_ls(next); //first time
            break;
        case "global-sls":
            setInterval(run_cache_global_ls, timeout);
            run_cache_global_ls(next); //first time
            break;
        default:
            logger.error("unknown datasource/service type:"+service.type);
        }

    }, cb);
}


