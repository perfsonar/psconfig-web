'use strict';

//contrib
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var winston = require('winston');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');
var profile = require('../profile');

router.get('/health', function(req, res) {
    res.json({status: 'ok'});
});

router.use('/config', require('./controllers/config'));
router.use('/auto', require('./controllers/auto'));

module.exports = router;

