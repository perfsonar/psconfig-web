'use strict';

//contrib
var express = require('express');
var router = express.Router();
var winston = require('winston');
var jwt = require('express-jwt');
var async = require('async');
var _ = require('underscore');

//mine
var config = require('../../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../../models');

//just a plain list of configs
router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    db.Config.findAll({
        include: [ {
            model: db.Test,
            //include: [db.Testspec],
        } ],
        //raw: true, //return raw object instead of sequelize objec that I can't modify..
    }).then(function(configs) {
        configs = JSON.parse(JSON.stringify(configs)); //convert to raw object so that I can add properties
        configs.forEach(function(config) {
            config.canedit = false;
            if(req.user) {
                if(~req.user.scopes.common.indexOf('admin') || ~config.admins.indexOf(req.user.sub)) {
                    config.canedit = true;
                }
            }
        });
        res.json(configs);
    }); 
});

//config detail
router.get('/:id', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var id = parseInt(req.params.id);
    logger.debug("retrieving "+id);
    db.Config.findOne({
        where: {id: id},
        include: [ db.Test ],
    }).then(function(config) {
        config = JSON.parse(JSON.stringify(config)); //convert to raw object so that I can add properties
        //console.dir(config);
        config.canedit = false;
        if(req.user) {
            if(~req.user.scopes.common.indexOf('admin') || ~config.admins.indexOf(req.user.sub)) {
                config.canedit = true;
            }
        }
        res.json(config);
    }); 
});

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Config.findOne({
        where: {id: id}
    }).then(function(config) {
        if(!config) return next(new Error("can't find the config with id:"+id));
        //only superadmin or admin of this config can update
        if(~req.user.scopes.common.indexOf('admin') || ~config.admins.indexOf(req.user.sub)) {
            config.destroy().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

//update config
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var id = parseInt(req.params.id);  
    db.Config.findOne({
        where: {id: id}
    }).then(function(config) {
        if(!config) return next(new Error("can't find a config with id:"+id));
        //only superadmin or admin of this test spec can update
        if(~req.user.scopes.common.indexOf('admin') || ~config.admins.indexOf(req.user.sub)) {
            config.desc = req.body.desc;
            config.url = req.body.url;
            config.admins = req.body.admins;
            config.save().then(function() {
                //upsert tests
                var tests = [];
                async.eachSeries(req.body.Tests, function(test, next) {
                    if(test.id) {
                        logger.debug("updating test with following--------------");
                        logger.debug(test);
                        db.Test.update(test, {where: {id: test.id}}).then(function() {
                            tests.push(test.id); //TODO will this work?
                            next();
                        });
                    } else {
                        db.Test.create(test).then(function(_test) {
                            tests.push(_test);
                            next();
                        });
                    }
                }, function(err) {
                    if(err) return next(err);
                    config.setTests(tests).then(function() {
                        res.json({status: "ok"});
                    }, next); //TODO - not sure if this is correct way to handle err for sequelize?
                });
            }).catch(function(err) {
                next(err);
            });    
            
        } else return res.status(401).end();
    }); 
});

//new config (TODO)
router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!~req.user.scopes.common.indexOf('user')) return res.status(401).end();
    db.Config.create(req.body).then(function(config) {
        //create tests
        var tests = [];
        async.eachSeries(req.body.Tests, function(test, next) {
            db.Test.create(test).then(function(_test) {
                tests.push(_test);
                next();
            });
        }, function(err) {
            //then 
            config.setTests(tests).then(function() {
                res.json({status: "ok"});
            }, next); //TODO - not sure if this is correct way to handle err for sequelize?
        });
    });
});

module.exports = router;

