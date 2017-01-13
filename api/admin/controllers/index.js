'use strict';

//contrib
const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
//const _ = require('underscore');

const config = require('../../config');
const db = require('../../models');

/**
 * @apiGroup System
 * @api {get} /health Get API status
 * @apiDescription Get current API status
 * @apiName GetHealth
 *
 * @apiSuccess {String} status 'ok' or 'failed'
 */
router.get('/health', function(req, res) {
   //make sure I can query from db
    db.Host.findOne({}).exec(function(err, host) {
        if(err) {
            res.json({status: 'failed', message: err});
        } else {
            res.json({status: 'ok'});
        }
    });
});

router.get('/config', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res) {
    var conf = {
        service_types: config.meshconfig.service_types,
        mesh_types: config.meshconfig.mesh_types,
        defaults: config.meshconfig.defaults,
        //menu: get_menu(req.user),
    };
    res.json(conf);
});

router.use('/configs', require('./configs'));
router.use('/testspecs', require('./testspecs'));
router.use('/services', require('./services'));
router.use('/hosts', require('./hosts'));
router.use('/hostgroups', require('./hostgroups'));

module.exports = router;

