'use strict';

//contrib
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var winston = require('winston');
var async = require('async');

//mine
var config = require('../../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../../models');
var profile = require('../../common').profile;
var meshconfig = require('../meshconfig');

//construct meshconfig
router.get('/:url', function(req, res, next) {
    var ma_override = req.query.ma_override;
    db.Config.findOne({url: req.params.url}).lean().exec(function(err, config) {
        if(err) return next(err);
        if(!config) return res.status(404).text("Couldn't find config with URL:"+req.params.url);
        meshconfig.generate(config, function(err, m) {
            if(err) return next(err);
            res.json(m);
        });
        /*
        //list all service ids referenced in various places
        var service_ids = [];
        function add_service_id(id) {
            if(!~service_ids.indexOf(id)) service_ids.push(id);
        }
        */

        /*
        //load services for each ids
        db.Service.findAll({
            where: {uuid: {$in: service_ids}},
            include: [ 
                { model: db.Service, as: "MA" },
                { model: db.Host },
            ]
        }).then(function(services) {
            config.services = services;

            //override MA endpoint
            if(ma_override) {
                services.forEach(function(service) {
                    service.MA = {locator: ma_override};
                });
            }

            //load all mas involved
            var uuids = [];
            services.forEach(function(service) {
                if(service.MA) {
                    if(!~uuids.indexOf(service.MA.client_uuid)) uuids.push(service.MA.client_uuid);
                } else {
                    if(!~uuids.indexOf(service.client_uuid)) uuids.push(service.client_uuid);
                } 
            });
            db.Service.findAll({
                where: {client_uuid: {$in: uuids}, type: "ma" },
            }).then(function(mas) {
                config.mas = mas;
                console.dir(config);

                //finally.. construct meshconfig
                res.json(meshconfig.generate(config));
            });
        });
        */
    });
});

module.exports = router;

