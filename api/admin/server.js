#!/usr/bin/node

//node
var fs = require('fs');
var path = require('path');

//contrib
var express = require('express');
var bodyParser = require('body-parser');
var winston = require('winston');
var expressWinston = require('express-winston');
var compression = require('compression');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');
var migration = require('./migration');
//var slscache = require('./slscache');
var common = require('../common');

//init express
var app = express();
app.use(compression());
app.use(bodyParser.json()); //parse application/json
app.use(expressWinston.logger(config.logger.winston));

//setup routes
app.use('/', require('./router'));

//error handling
app.use(expressWinston.errorLogger(config.logger.winston)); 
app.use(function(err, req, res, next) {
    logger.error(err);
    logger.error(err.stack);
    res.status(err.status || 500);
    res.json({message: err.message, /*stack: err.stack*/}); //let's hide callstack for now
});

process.on('uncaughtException', function (err) {
    //TODO report this to somewhere!
    logger.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    logger.error(err.stack)
});

exports.app = app;
exports.start = function(cb) {
    logger.info("initializing");
    db.sequelize
    .sync(/*{force: true}*/) //create missing tables - if it doesn't exist
    .then(migration.run)
    .then(function() {
        var port = process.env.PORT || config.admin.port || '8080';
        var host = process.env.HOST || config.admin.host || 'localhost';
        app.listen(port, host, function() {
            logger.info("meshconfig admin/api service running on %s:%d in %s mode", host, port, app.settings.env);
            setInterval(common.profile.cache, 1000*300); //5 minutes?
            common.profile.cache(cb);
        });
    });
}

