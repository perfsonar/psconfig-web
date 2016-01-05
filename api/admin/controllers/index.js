'use strict';

//contrib
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var _ = require('underscore');

//mine
var config = require('../../config');

router.get('/health', function(req, res) {
    res.json({status: 'ok'});
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
router.use('/cache', require('./cache'));
router.use('/hostgroups', require('./hostgroups'));

module.exports = router;

