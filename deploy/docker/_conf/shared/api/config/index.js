'use strict';

var fs = require('fs');
var winston = require('winston');
var winstonExpress = require('express-winston');

/*
exports.express = {
    //web server port
    port: 12348,

    //specify jwt config if you want to access control via jwt (applied to all routes.. for now)
    jwt: {
        pub: fs.readFileSync('./config/auth.pub'),
    }
}
*/

exports.logger = {
    winston: {
        transports: [
            //display all logs to console
            new winston.transports.Console({
                timestamp: function() {
                    return Date.now(); //show time in unix timestamp
                },
                colorize: true,
                level: 'debug'
            }),
            
            //store all warnings / errors in error.log
            new (winston.transports.File)({ 
                filename: 'error.log',
                level: 'warn'
            })
        ]
    },
    
    //not used
    //logfile to store all requests (and its results) in json
    request: {
        transports: [
            new (winston.transports.File)({ 
                filename: 'request.log',
                json: true
            })
            /* (not sure how to get this working)
            new (winston.transports.Logstash)({
                port: 28777,
                node_name: 'isdp-soichi-dev',
                host: 'soichi7.ppa.iu.edu'
            })
            */
        ]
    }
}


