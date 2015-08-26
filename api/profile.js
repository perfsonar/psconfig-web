#!/usr/bin/node
'use strict';

//var winston = require('winston');
var server = require('./server');
server.start(function() {
    console.log("waiting for incoming connections...");
});

