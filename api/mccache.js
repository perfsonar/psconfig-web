#!/usr/bin/node
'use strict';

var cache = require('./admin/cache');
cache.start(function(err) {
    if(err) throw err;
    console.log("starting cache services");
});

