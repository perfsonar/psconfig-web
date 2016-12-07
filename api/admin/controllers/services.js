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
var common = require('../../common');

//return the whole thing.. until that becomes an issue
//open to public
router.get('/', function(req, res, next) {
    var services = {};
    db.Service.findAll({
        raw: true,
        include: [
            //{ model: db.Service, as: "MA" }
        ],
    }).then(function(recs) {
        //group into each service types
        recs.forEach(function(rec) {
            if(services[rec.type] === undefined) services[rec.type] = [];
            services[rec.type].push(rec);
        });
        res.json({recs: services, lss: config.datasource.services});    
    });
});

//TODO - I may need to restrict access to dynamic-allowed scope
router.get('/dynamic', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    //need any validation?
    var js = req.query.js;
    var type = req.query.type;

    common.filter.resolveHostGroup(js, type, function(err, hosts) {
        if(err) return next(err);
        res.json(hosts);
    });
});

module.exports = router;

