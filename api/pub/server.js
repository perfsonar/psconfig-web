'use strict';

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
var profile = require('./profile');

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
    db.sequelize
    //TODO - maybe pub shouldn't do this?
    .sync(/*{force: true}*/)
    .then(function() {
        profile.start(function(err) {
            if(err) return cb(err);
            //start server
            var port = process.env.PORT || config.pub.port || '8080';
            var host = process.env.HOST || config.pub.host || 'localhost';
            app.listen(port, host, function() {
                logger.info("meshconfig pub service running on %s:%d in %s mode", host, port, app.settings.env);
                cb(null);
            });
        });
    });
}

