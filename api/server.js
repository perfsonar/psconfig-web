#!/usr/bin/node

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var fs = require('fs');

var Sequelize = require('sequelize');

var config = require('./config/config');

var models = require('./models');

var app = express();

app.use(config.logger.express);
app.use(bodyParser.json()); //parse application/json
app.use(bodyParser.urlencoded({extended: false})); //parse application/x-www-form-urlencoded
app.use(cookieParser());

//app.use(jwtTokenParser());

app.use('/', require('./router'));

app.get('/health', function(req, res) {
    res.json({status: 'ok'});
});

app.use(function(req, res, next) {
    // catch 404 and forward to error handler
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    console.dir(err);
    res.status(err.status || 500);
    res.json({message: err.message});
});

function start() {
    models.sequelize.sync(/*{force: true}*/).then(function() {
        var port = process.env.PORT || '8080';
        app.listen(port);
        console.log("Express server listening on port %d in %s mode", port, app.settings.env);
    });
}

exports.start = start;
exports.app = app;

