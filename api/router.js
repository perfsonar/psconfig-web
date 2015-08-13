'use strict';

var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');

var config = require('./config/config').config;

var models = require('./models');
var user = require('./controllers/user'); 
router.use('/user', user);

module.exports = router;
