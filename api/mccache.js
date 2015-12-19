#!/usr/bin/node
'use strict';

var fs = require('fs');

var config = require('./config');
var cache = require('./admin/cache');

//don't start caching before mcadmin has time to sync db and migrate
function wait_for_mcadmin() {
    fs.stat(config.admin.readyfile, function(err, stats) {
        if(err || !stats.isFile()) {
            console.log("waiting for mcadmin to start on "+config.admin.readyfile);
            setTimeout(wait_for_mcadmin, 5000);
        }
        cache.start(function(err) {
            if(err) throw err;
            console.log("started cache services");
        });
    });
}
wait_for_mcadmin();
