
//contrib
var winston = require('winston');
var async = require('async');
var Promise = require('promise');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

var migrations = [
    function(qi, next) {
        logger.debug("running db migrate 1");
        next();
    },
    function(qi, next) {
        logger.debug("running db migrate 2");
        logger.debug(qi);
        next();
    }
];

exports.run = function(cb) {
    return new Promise(function(resolve, reject) {
        db.Migration.findOne({}).then(function(info) {
            //logger.debug(info);
            if(!info) {
                //assume brand new - skip everything
                return db.Migration.create({version: migrations.length}).then(resolve);
            } else {
                var ms = migrations.splice(info.version);
                qi = db.sequelize.getQueryInterface();
                async.eachSeries(ms, function(m, next) {
                    m(qi, next); 
                }, function(err) {
                    if(err) reject(err);
                    else resolve("all done");
                });
            }
        });
    });
}
