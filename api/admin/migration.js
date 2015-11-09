
//contrib
var winston = require('winston');
var async = require('async');
var Promise = require('promise');
var Sequelize = require('sequelize');

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
        next();
    },
    function(qi, next) {
        logger.debug("adding ma key");
        /*
        qi.showAllTables().then(function(names) {
            console.dir(names);
        });
        */
        qi.addColumn('Services', 'ma', Sequelize.INTEGER).then(function(someting) {
            next();
        });
    },
    function(qi, next) {
        next();
    },
    function(qi, next) {
        logger.info("adding ip column and renaming name to sitename");
        qi.addColumn('Hosts', 'ip', Sequelize.STRING).then(function(someting) {
            qi.renameColumn('Hosts', 'name', 'sitename').then(function() { 
                next();
            });
        });
    },
];

exports.run = function(cb) {
    logger.debug("running migration");
    return new Promise(function(resolve, reject) {
        db.Migration.findOne({}).then(function(info) {
            //logger.debug(info);
            if(!info) {
                //assume brand new - skip everything
                return db.Migration.create({version: migrations.length}).then(resolve);
            } else {
                info.version = migrations.length;
                var ms = migrations.splice(info.version);
                qi = db.sequelize.getQueryInterface();
                async.eachSeries(ms, function(m, next) {
                    m(qi, next); 
                }, function(err) {
                    if(err) reject(err);
                    else { 
                        info.save().then(function() {
                            resolve("migration complete");
                        });
                    }
                });
            }
        });
    });
}
