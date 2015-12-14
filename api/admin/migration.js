
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
    /*
    function(qi, next) {
        logger.debug("running db migrate 1");
        next();
    },
    function(qi, next) {
        logger.debug("running db migrate 2");
        qi.addColumn('Services', 'ma', Sequelize.INTEGER).then(function(someting) {
            next();
        });
    },
    function(qi, next) {
        logger.debug("adding ma key");
        qi.showAllTables().then(function(names) {
            console.dir(names);
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
    function(qi, next) {
        qi.addColumn('Migrations', 'deleteme2', Sequelize.INTEGER).then(function() {
            next();
        });
    },
    function(qi, next) {
        qi.removeColumn('Migrations', 'deleteme', Sequelize.INTEGER).then(function() {
            next();
        });
    },
    function(qi, next) {
        qi.removeColumn('Migrations', 'deleteme2', Sequelize.INTEGER).then(function() {
            next();
        });
    },
    */
    function(qi, next) {
        logger.info("adding hostname field for host table");
        qi.addColumn('Hosts', 'hostname', Sequelize.STRING).then(function() {
            next();
        });
    },
    function(qi, next) {
        logger.info("adding toolkit_url fields");
        qi.addColumn('Hosts', 'toolkit_url', {
            type: Sequelize.STRING,
            defaultValue: "auto",
        }).then(function() {
            next();
        });
    },
    function(qi, next) {
        logger.info("adding no_agent fields");
        qi.addColumn('Hosts', 'no_agent', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        }).then(function() {
            next();
        });
    },
    function(qi, next) {
        logger.info("adding host_filter fields");
        qi.addColumn('Hostgroups', 'host_filter', {
            type: Sequelize.STRING,
        }).then(function() {
            next();
        });
    },
    function(qi, next) {
        logger.info("adding host_filter fields");
        qi.changeColumn('Hostgroups', 'host_filter', {
            type: Sequelize.TEXT,
        }).then(function() {
            next();
        });
    },
    function(qi, next) {
        logger.info("adding type fields");
        qi.addColumn('Hostgroups', 'type', {
            type: Sequelize.STRING,
            defaultValue: 'static',
        }).then(function() {
            next();
        });
    },
    function(qi, next) {
        logger.info("renaming host.host to host.info");
        qi.renameColumn('Hosts', 'host', 'info').then(function() { next(); });
    },
    function(qi, next) {
        logger.debug("adding communities field for host");
        qi.addColumn('Hosts', 'communities', Sequelize.TEXT).then(function(someting) {
            next();
        });
    },
];

exports.run = function() {
    logger.debug("running migration");
    return new Promise(function(resolve, reject) {
        db.Migration.findOne({}).then(function(info) {
            //logger.debug(info);
            if(!info) {
                //assume brand new - skip everything
                return db.Migration.create({version: migrations.length}).then(resolve);
            } else {
                var count = migrations.length;
                var ms = migrations.splice(info.version);
                qi = db.sequelize.getQueryInterface();
                async.eachSeries(ms, function(m, next) {
                    m(qi, next); 
                }, function(err) {
                    if(err) reject(err);
                    else { 
                        info.version = count; 
                        info.save().then(function() {
                            resolve("migration complete");
                        });
                    }
                });
            }
        });
    });
}
