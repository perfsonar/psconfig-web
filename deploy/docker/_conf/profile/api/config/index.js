//var def = require('./default_config');
//var _ = require('underscore');
//exports.config = _.extend(def.config, {

var fs = require('fs');
//var morgan = require('morgan');
var winston = require('winston');

exports.profile = {
    //page for main login form
    login_url: '/meshconfig/auth',
}

exports.db = {
    dialect: 'sqlite',
    storage: '/var/lib/mca/profile.sqlite',
    logging: false,
}

exports.express = {
    //web server port
    port: 12402,
    //host: "0.0.0.0",

    jwt: {
        pub: fs.readFileSync('/opt/mca/auth/api/config/auth.pub'),
    }
};

/*
exports.logger = {
    express: require('morgan')('combined'),
    api: 'log/api.log',
    exception: 'log/exception.log',
    //express_error_handler: {dumpExceptions: true, showStack: true},
}
*/

exports.logger = {
    winston: {
        transports: [
            //display all logs to console
            new winston.transports.Console({
                timestamp: function() {
                    var d = new Date();
                    return d.toString(); //show timestamp
                },
                level: 'debug',
                colorize: true
            }),
            
            /*
            //store all warnings / errors in error.log
            new (winston.transports.File)({ 
                filename: 'error.log',
                level: 'warn'
            })
            */
        ]
    },
    
    /*
    //logfile to store all requests (and its results) in json
    request: {
        transports: [
            new (winston.transports.File)({ 
                filename: 'request.log',
                json: true
            })
            new (winston.transports.Logstash)({
                port: 28777,
                node_name: 'isdp-soichi-dev',
                host: 'soichi7.ppa.iu.edu'
            })
        ]
    }
    */
}


