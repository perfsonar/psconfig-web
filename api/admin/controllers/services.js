'use strict';

//contrib
var express = require('express');
var router = express.Router();
var winston = require('winston');
var jwt = require('express-jwt');
var async = require('async');

//mine
var config = require('../../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../../models');

//return the whole thing.. until that becomes an issue
//open to public
router.get('/', function(req, res, next) {
    /*
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
    */
    var services = {};
    db.Service.findAll({raw: true}).then(function(recs) {
        //group into each service types
        recs.forEach(function(rec) {
            if(services[rec.type] === undefined) services[rec.type] = [];
            services[rec.type].push(rec);
        });
        res.json({recs: services, lss: config.datasource.services});    
    });
    //res.json(services);
    //res.json({hello: "there"});
});

//update service cache immediately
//TODO - only used for debug purpose right now.
//TODO - should restrict access from localhost?
var slscache = require('../slscache');
router.post('/cache', function(req, res, next) {
    slscache.cache(function(err) {
        if(err) return next(err);
        res.json({status: "ok"});
    });
});

module.exports = router;

