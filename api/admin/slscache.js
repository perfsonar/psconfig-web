'use strict';

//contrib
var winston = require('winston');
var async = require('async');
var request = require('request');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

//cache sls content .. loaded every now and then
//grouped by ls/service_type/service
//var sls_cache = {};
function docache_ls(lsid, ls, service_type, cb) {
    request(ls.service_types[service_type].url, {timeout: 1000*10}, function(err, res, body) {
        if(err) return cb(err);
        if(res.statusCode != 200) return cb(new Error("failed to sLS cahce from:"+ls.url+" statusCode:"+res.statusCode));
        var services = null;
        try {
            services = JSON.parse(body);
        } catch (e) {
            //couldn't parse sls response..
            return cb(e);
        }
         
        //if(sls_cache[lsid] === undefined) sls_cache[lsid] = {};
        //if(sls_cache[lsid][service_type] === undefined) sls_cache[lsid][service_type] = [];
        //if(services.length == 0 && sls_cache[lsid][service_type] !== undefined) return cb("got 0 services from "+ls.url+" (keeping the most recent data)");
        //sls_cache[lsid][service_type] = []; //reset all
        var count_new = 0;
        var count_update = 0;
        async.eachSeries(services, function(service, next) {
            //TODO apply exclusion
            //console.dir(service);

            //ignore record with no client-uuid (probably old toolkit instance?)
            if(service['client-uuid'] === undefined) {
                logger.error("client-uuid not set - skipping");
                logger.error(service);
                return next();//continue to next service
            }

            /*
            sls_cache[lsid][service_type].push({
                uuid: service['client-uuid'][0],
                name: service['service-name'][0],
                locator: (service['service-locator']&&service['service-locator'][0])?service['service-locator'][0] : null,
                lsid: lsid, //make it easier for ui
            });
            */
            var rec = {
                client_uuid: service['client-uuid'][0],
                uuid: service['client-uuid'][0]+'.'+service['service-type'][0],
                name: service['service-name'][0],
                type: service['service-type'][0],
                //locator is now a critical information needed to generate the config
                locator: service['service-locator'][0],
                //locator: (service['service-locator']&&service['service-locator'][0])?service['service-locator'][0] : null,
                lsid: lsid, //make it easier for ui

                sitename: service['location-sitename'][0],
                location: {
                    longitude: service['location-longitude'][0],
                    latitude: service['location-latitude'][0], 
                    city: service['location-city'][0],
                    state: service['location-state'][0],
                    postal_code: service['location-code'][0],
                    country: service['location-country'][0],
                },

                //TODO - I need to query the real admin records from the cache (gocdb2sls service already genenrates contact records)
                //I just have to store them in tour table
                admins: service['service-administrators'],

                count: 0, //number of times updated (exists to allow updateTime update)
            };
            db.Service.findOne({where: {uuid: rec.uuid}}).then(function(_service) {
                if(_service) {
                    //update updatedAt time
                    count_update++;
                    rec.count = _service.count+1; //force records to get updated
                    _service.update(rec).then(function() {
                        next();
                    });
                } else {
                    db.Service.create(rec).then(function(service) {
                        count_new++;
                        next();
                    });
                }
            });
            /*
            var uuid = service['client-uuid'][0];
            var locator = (service['service-locator']&&service['service-locator'][0])?service['service-locator'][0] : null;
            db.Service.findOrCreate({where: {uuid: uuid}, defaults: {
                name: service['service-name'][0],
                locator: locator,
                lsid: lsid, //make it easier for ui
            }})
            .spread(function(service, created) {
                if(created) count_new++;
                else count_update++;
                //update updatedAt time
                service.save().then(next);
            });
            */
        }, function(err) {
            logger.info("loaded "+services.length+" services for "+ls.label+" from "+ls.service_types[service_type].url + " updated:"+count_update+" new:"+count_new);
            cb();
        });
    })/*.on('error', function(e) {
        //failed to access sls..
        return cb(e);
    });*/
}

function cache_ls(ls, lsid, cb) {
    async.forEachOf(ls.service_types, function(end, service_type, next) {
        logger.debug("caching "+lsid+":"+service_type+" from "+end.url);
        docache_ls(lsid, ls, service_type, function(err) {
            if(err) {   
                logger.error("Failed to cache "+end.url);
                logger.error(err);//continue
            } else logger.debug("successfully cached sLS content done:"+end.url);
            next(); 
        });
    }, cb);
}

function cache_global_ls(service, id, cb) {
    //load activehosts.json
    request(service.activehosts_url, {timeout: 1000*5}, function(err, res, body) {
        if(err) return cb(err);
        if(res.statusCode != 200) return cb(new Error("failed to download activehosts.json from:"+service.activehosts_url+" statusCode:"+res.statusCode));
        try {
            var activehosts = JSON.parse(body);
            //load from all activehosts
            async.each(activehosts.hosts, function(host, next) {
                if(host.status != "alive") return next();
                //massage the service url so that I can use cache_ls to do the rest
                for(var type in service.service_types) {
                    var service_type = service.service_types[type];
                    service_type.url = host.locator+service_type.query;
                };
                cache_ls(service, id, next);
            }, cb); 
        } catch (e) {
            //couldn't parse activehosts json..
            return cb(e);
        }
    }); 
}

exports.start = function(cb) {
    //start caching
    async.forEachOf(config.datasource.services, function(service, id, next) {
        var timeout = service.cache || 60*30*1000; //default to 30 minutes
        switch(service.type) {
        case "sls":
            setInterval(function() { cache_ls(service, id); }, timeout);
            cache_ls(service, id, next);
            break;
        case "global-sls":
            setInterval(function() { cache_global_ls(service, id); }, timeout);
            cache_global_ls(service, id, next);
            break;
        default:
            logger.error("unknown datasource/service type:"+service.type);
        }
    }, cb);
}

