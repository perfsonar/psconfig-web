'use strict';

//contrib
var express = require('express');
var router = express.Router();
var winston = require('winston');
var jwt = require('express-jwt');
var async = require('async');
var request = require('request');

//mine
var config = require('../config/config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

//cache sls content .. loaded every now and then
//grouped by ls/service_type/service
var sls_cache = {};
function request_data(lsid, ls, service_type, cb) {
    request(ls.service_types[service_type].url, {timeout: 1000*5}, function(err, res, body) {
        if(err) return cb(err);
        if(res.statusCode != 200) return cb(new Error("failed to sLS cahce from:"+ls.url+" statusCode:"+res.statusCode));
        try {
            var services = JSON.parse(body);
            if(sls_cache[lsid] === undefined) sls_cache[lsid] = {};
            if(sls_cache[lsid][service_type] === undefined) sls_cache[lsid][service_type] = [];
            if(services.length == 0 && sls_cache[lsid][service_type] !== undefined) return cb("got 0 services from "+ls.url+" (keeping the most recent data)");
            sls_cache[lsid][service_type] = []; //reset all
            services.forEach(function(service) {
                //TODO apply exclusion

                //ignore record with no client-uuid (probably old toolkit instance?)
                if(service['client-uuid'] === undefined) {
                    logger.error("client-uuid not set - skipping");
                    logger.error(service);
                    return;//continue to next service
                }

                sls_cache[lsid][service_type].push({
                    id: service['client-uuid'][0],
                    name: service['service-name'][0],
                    locator: (service['service-locator']&&service['service-locator'][0])?service['service-locator'][0] : null,
                    lsid: lsid, //make it easier for ui
                });
            });
            logger.info("loaded "+services.length+" services for "+ls.label+" from "+ls.service_types[service_type].url);
            cb();
        } catch (e) {
            cb(e);
        }
    }).on('error', function(e) {
        cb(e);
    });
}

function cache_sls(cb) {
    async.forEachOf(config.lookup_services, function(ls, lsid, next_ls) {
        async.forEachOf(ls.service_types, function(end, service_type, next) {
            logger.debug("caching sLS content (service type:"+service_type+"):"+end.url);
            request_data(lsid, ls, service_type, function(err) {
                if(err) logger.error(err);//continue
                logger.debug("caching sLS content done:"+end.url);
                next(); 
            });
        }, next_ls);
        /*
        for(var service_type in ls.service_types) {
            logger.info("caching sLS content (service type:"+service_type+"):"+ls.url);
            request_data(lsid, ls, service_type, function(err) {
                if(err) logger.error(err);
            });
        }
        */
    }, cb);
}

setInterval(sls_cache, 1000*60*10); //reload every 10 minutes
cache_sls(); //first time

//return the whole thing.. until this becomes an issue
//router.get('/', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
router.get('/', function(req, res, next) {
    //merge records from different lses
    var services = {};
    for(var lsid in sls_cache) {
        for(var service_type in sls_cache[lsid]) {
            if(services[service_type] === undefined) services[service_type] = [];
            sls_cache[lsid][service_type].forEach(function(service) {
                services[service_type].push(service);
            });
        }
    };
    res.json({recs: services, lss: config.lookup_services});    
    //res.json(services);
    //res.json({hello: "there"});
});

//update service cache immediately
//TODO - not used by anything at the moment
router.post('/cache', function(req, res, next) {
    cache_sls(function(err) {
        if(err) return next(err);
        res.json({status: "ok"});
    });
});

/*
router.get('/query', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
    if(!req.query.q) return res.json([]); //empty query yeilds empty result
    var q = req.query.q.toLowerCase();
    var matches = [];

    //just do substring search for now (in the future, we could do string distance calculation?)
    config.lookup_services.forEach(function(ls) {
        sls_cache[ls.id].forEach(function(service) {
            logger.info(service['service-name']);
            var name = service['service-name'][0].toLowerCase();

            //sometimes locator is missing! 
            var has_locator = false;
            if(service['service-locator'] && service['service-locator'].length > 0) has_locator = true;

            var locator = "";
            if(has_locator) locator = service['service-locator'][0].toLowerCase();
            if(~name.indexOf(q) || ~locator.indexOf(q)) {
                //TODO - should I use [0]?
                var locator = null;
                if(has_locator) locator = service['service-locator'][0]
                matches.push({id: service['client-uuid'], ls_label: ls.label, name: service['service-name'][0], locator: locator});
            }
        });
    });
    res.json(matches);
});
*/

/*
//just to make sure mocha supertest is functioning properly
router.get('/check', function(req, res, next) {
    res.json({test: 'hello'});
});
*/

module.exports = router;

