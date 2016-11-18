#!/usr/bin/node

//node
const fs = require('fs');
const path = require('path');

//contrib
const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const expressWinston = require('express-winston');
const compression = require('compression');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
const migration = require('./migration');
const common = require('../common');

//init express
const app = express();
app.use(compression());
app.use(bodyParser.json()); //parse application/json
app.use(expressWinston.logger(config.logger.winston));

//setup routes
app.use('/', require('./controllers'));

//error handling
app.use(expressWinston.errorLogger(config.logger.winston)); 
app.use(function(err, req, res, next) {
    if(typeof err == "string") err = {message: err};

    //log this error
    logger.info(err);
    if(err.name) switch(err.name) {
    case "UnauthorizedError":
        logger.info(req.headers); //dump headers for debugging purpose..
        break;
    }

    if(err.stack) err.stack = "hidden"; //don't sent call stack to UI - for security reason
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

