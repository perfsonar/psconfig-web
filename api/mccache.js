#!/usr/bin/node
'use strict';

const fs = require('fs');
const dns = require('dns');
const net = require('net');
const winston = require('winston');
const async = require('async');
const request = require('request');
const assert = require('assert');

//mine
const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');
const common = require('./common');

db.init(function(err) {
    if(err) throw err; 
    logger.info("connected to db");
    run(function(err) {
        if(err) logger.error(err);
        logger.info("finished caching .. sleeping for an hour");
        setTimeout(run, 1000*3600);
    });
});

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
            info: get_hostinfo(host),
            //location: get_location(host),
            communities: host['group-communities']||[],
            services: [],

            //TODO .. I am not sure what we can do with host-administrators
            //host['host-administrators'],
            //I need to query the real admin records from the cache (gocdb2sls service already genenrates contact records)

            update_date: new Date(),
        };

        if(!host['simulated']) rec.url = url;
        //else rec.url = null;

        //toolkit v<3.5 didn't have client-uuid
        if(host['client-uuid']) rec.uuid = host['client-uuid'][0];

        //some site doesn't have sitename configured in lsregistration.conf so I have to mock it.. if it doesn't exist
        if(host['location-sitename']) rec.sitename = host['location-sitename'][0];
        else {
            var mockname = service['service-name'][0];
            if(host['group-domains']) mockname += " at "+host['group-domains'][0];
            rec.sitename = "("+mockname+")";
            logger.error("location-sitename not set!! using mockup name."+mockname);
        }
        
        var ip = host['host-name'][0]; //usually ip address
        var hostname = host['host-name'][1]; //often undefined. if set, it's hostname (always?)
        if(hostname !== undefined) rec.hostname = hostname;
        lookup_addresses(ip, function(err, hostname, addresses) {
            if(err) return cb(err); 
            if(hostname) rec.hostname = hostname;
            rec.addresses = addresses;
            cb(null, rec);
        });
    });
}

/*
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
*/

function get_hostinfo(host) {
    var info = {};
    for(var key in host) {
        var v = host[key];

        //ignore some things
        if(key == "host-administrators") continue;
        if(key == "host-net-interfaces") continue;
        if(key == "host-name") continue;
        
        //store all (ps)hosts-, location things
        ["host-", "pshost-", "location-"].forEach(function(prefix) {
            var p = key.indexOf(prefix);
            if(p === 0)  info[key] = v[0];
        });
    }
    return info;
}

function cache_ls(hosts, ls, lsid, cb) {
    logger.debug("caching ls:"+lsid+" from "+ls.url);
    request({url: ls.url, timeout: 1000*10, json: true}, function(err, res, services) {
        if(err) return cb(err);
        if(res.statusCode != 200) return cb(new Error("failed to cahce service from:"+ls.url+" statusCode:"+res.statusCode));

        function get_host(uri, service, _cb) {
            if(hosts[uri] !== undefined) return _cb(null, hosts[uri]);              
            create_hostrec(service, res.request.uri, function(err, host) {
                if(err) {
                    logger.error("failed to create hostrecord from following service");
                    logger.error(service);
                    hosts[uri] = null; //make it null to signal we failed to create hostrec for this
                    return _cb(err);
                }
                logger.debug("creating hostrecord for uri:"+uri+" hostname:"+host.hostname);
                host.lsid = lsid;
                hosts[uri] = host;
                _cb(null, host);
            });
        }

        //go through each services
        async.eachSeries(services, function(service, next) {
            //pick client-uuid or service-host(for old version of toolkit) as host id
            var id;
            if(!service['client-uuid']) {
                if(!service['service-host']) {
                    logger.error("client-uuid nor service-host is set.. can't process this service");
                    logger.error(JSON.stringify(service, null, 4));
                    return next();
                } else id = service['service-host'][0];
            } else id = service['client-uuid'][0]; 
            get_host(id, service, function(err, host) {
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
                if(!exist) {
                    //pick the last service locator
                    //TODO - this could pick IPv6 address.
                    //service-locator: - [
                    //"http://192.12.15.111/services/MP/OWAMP",
                    //"http://[2620:0:210:1::111]/services/MP/OWAMP",
                    //"https://192.12.15.111/services/MP/OWAMP",
                    //"https://[2620:0:210:1::111]/services/MP/OWAMP"
                    //],
                    var len = service['service-locator'].length;
                    //var locator = service['service-locator'][len-1];
                    
                    //construct service record
                    host.services.push({
                        type: type,
                        //name: service['service-name'][0],
                        //locator: locator, //locator is now a critical information needed to generate the config
                        //lsid: lsid, //make it easier for ui
                        
                        //TODO - I need to query the real admin records from the cache (gocdb2sls service already genenrates contact records)
                        //I just have to store them in our table
                        //admins: service['service-administrators'],
                        //$inc: { count: 1 }, //number of times updated (exists to allow updateTime update)
                    });
                }
                next();
            });
        }, cb);
    })
}

function cache_global_ls(hosts, service, id, cb) {
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
                cache_ls(hosts, service, id, function(err) {
                    if(err) logger.error(err); //continue
                    next();
                });
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
            common.dynamic.resolve(group.host_filter, group.service_type, function(err, hosts) {
                if(err) return next(err);
                group.hosts = hosts.ids;
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

function run(cb) {

    //mca host records keyed by uri (hostname could duplicate)
    //hostname found first will take precedence
    //host.simulated will have less precedence
    var hosts = {}; 

    //go through each LS
    async.eachOfSeries(config.datasource.lses, function(service, id, next) {
        logger.info("processing datasource:"+id+"................................................................................");
        switch(service.type) {
        case "sls":
            cache_ls(hosts, service, id, next);
            break;
        case "global-sls":
            cache_global_ls(hosts, service, id, next);
            break;
        default:
            logger.error("unknown datasource/service type:"+service.type);
        }
    }, function(err) {
        if(err) logger.error(err); //continue

        async.eachOfSeries(hosts, function(host, id, next) {
            if(!host) return next(); //ignore null host
            if(host.url) {
                //real record.. update existing record
                db.Host.findOneAndUpdate({
                    hostname: host.hostname
                }, {$set: host}, {upsert: true, setDefaultsOnInsert: true}, function() {
                    next();
                });
            } else {
                //this is simulated record
                db.Host.findOne({
                    hostname: host.hostname, 
                }, function(err, _host) {
                    if(_host) {
                        //if existing record exits, only update if it's also simulated
                        if(!_host.url) db.Host.update({hostname: host.hostname}, {$set: host}, next);
                        else next(null); //real record already exists.. ignore this update
                    } else {
                        //insert new simulated record for the first time
                        var rec = new db.Host(host);
                        rec.save(next);
                    }
                });
            }
        }, function(err) {
            if(err) logger.error(err);
            var host_count = Object.keys(hosts).length;
            logger.info("updated "+host_count+" hosts");
        
            //one last thing.. update dynamic host
            update_dynamic_hostgroup(function(err) {
                if(err) logger.error(err);

                //report health status to mcadmin
                var mcadmin = "http://"+(config.admin.host||"localhost")+":"+config.admin.port;
                request.post({url: mcadmin+"/health/mccache", json: {hosts: host_count}}, function(err, res, body) {
                    if(err) logger.error(err);
                    cb();
                });
            });
        });
    });
}


