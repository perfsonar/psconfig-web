#!/usr/bin/node
'use strict';

//var winston = require('winston');
var server = require('./admin/server');
server.start(function(err) {
    if(err) throw err;
    console.log("waiting for incoming connections...");
});

