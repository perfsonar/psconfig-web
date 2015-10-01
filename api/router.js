'use strict';

//contrib
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');

//mine
var config = require('./config/config');
var testspecs = require('./controllers/testspecs');

router.get('/health', function(req, res) {
    res.json({status: 'ok'});
});
router.get('/config', function(req, res) {
    var conf = {};
    conf.service_types = config.meshconfig.service_types;
    res.json(conf);
});
router.use('/testspecs', testspecs);

module.exports = router;

