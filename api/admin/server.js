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
app.use('/', require('./controllers'));

//error handling
app.use(expressWinston.errorLogger(config.logger.winston)); 
app.use(function(err, req, res, next) {
    logger.error(err);
    if(err.stack) {
        logger.error(err.stack);
        err.stack = "hidden"; //hide for ui
    }
    res.status(err.status || 500);
    res.json(err);
});

process.on('uncaughtException', function (err) {
    //TODO report this to somewhere!
    logger.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    logger.error(err.stack)
});

exports.app = app;
exports.start = function(cb) {
    //TODO - should mcadin remove old readyfile, or let startup script do that?
    //fs.unlinkSync(config.admin.readyfile);
    
    //logger.info("initializing");
    db.sequelize
    .sync(/*{force: true}*/) //create missing tables - if it doesn't exist
    .then(migration.run)
    .then(function() {
        var port = process.env.PORT || config.admin.port || '8081';
        var host = process.env.HOST || config.admin.host || 'localhost';
        app.listen(port, host, function() {
            logger.info("meshconfig admin/api service running on %s:%d in %s mode", host, port, app.settings.env);
            fs.writeFileSync(config.admin.readyfile, "ready");
        });
    });
}

