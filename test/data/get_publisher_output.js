#!/usr/bin/node

//mine
var config = require('../etc/config');
const winston = require('winston');

const logger = new winston.Logger(config.logger.winston);
//logger.transports.forEach((t) => (t.silent = true));
var publisher = require('../../api/pub/meshconfig');
//const async = require('async');
//fs = require('fs');

let configName = "throughput3";

let opts = {
    "format": "psconfig"
};

function formatlog( obj ) {
    var out = JSON.stringify( obj, null, 3 );
    return out;
}
function cleanup() {
    publisher.dbTest.disconnect();

}

var dbCB = function( err, results ) {
                    //console.log("CALLBACK err, results", err, "\n");
                    //console.log(results);
                    //console.log("RESULTS !!!!\n", formatlog( results ) );
                    //console.log("RESULTS !!!!\n", JSON.stringify(results, null, 3) );
                    //console.log("RESULTS !!!!\n", JSON.stringify(results));
                    console.log(JSON.stringify(results));
                    //console.log("ERRRR !!!!\n", err );
                    cleanup();

};

publisher.get_config( configName, opts, dbCB, config );
