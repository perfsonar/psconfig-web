#!/usr/bin/node
"use strict";
var server = require("./pub/server");
server.start(function (err) {
    if (err) throw err;
    console.log("waiting for incoming connections...");
});
