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
var profile = require('../../common').profile;

function canedit(user, config) {
    if(user) {
        if(~user.scopes.mca.indexOf('admin')) {
            return true;
        }
        if(~config.admins.indexOf(user.sub)) {
            return true;
        }
    }
    return false;
}

//just a plain list of configs
router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    db.Config.find(find)
    .select(req.query.select)
    .limit(req.query.limit || 100)
    .skip(req.query.skip || 0)
    .sort(req.query.sort || '_id')
    .lean() //so that I can add _canedit later
    .exec(function(err, configs) {
        if(err) return next(err);
        db.Config.count(find).exec(function(err, count) { 
            if(err) return next(err);
            configs.forEach(function(config) {
                config._canedit = canedit(req.user, config);
            });
            res.json({configs: configs, count: count});
        });
    }); 

    /*
    db.Config.findAll({
        include: [ {
            model: db.Test,
            //include: [db.Testspec],
        } ],
        //raw: true, //return raw object instead of sequelize objec that I can't modify..
    }).then(function(configs) {
        profile.getall(function(err, profiles) {
            configs = JSON.parse(JSON.stringify(configs)); //convert to raw object so that I can add properties
            configs.forEach(function(config) {
                config.canedit = false;
                if(req.user) {
                    if(~req.user.scopes.mca.indexOf('admin') || ~config.admins.indexOf(req.user.sub)) {
                        config.canedit = true;
                    }
                }
                config.admins = profile.select(profiles, config.admins);
            });
            res.json(configs);
        });
    }); 
    */
});

/*
//config detail
router.get('/:id', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var id = parseInt(req.params.id);
    //logger.debug("retrieving "+id);
    db.Config.findOne({
        where: {id: id},
        include: [ db.Test ],
    }).then(function(config) {
        profile.getall(function(err, profiles) {
            config = JSON.parse(JSON.stringify(config)); //convert to raw object so that I can add properties
            //console.dir(config);
            config.canedit = false;
            if(req.user) {
                if(~req.user.scopes.mca.indexOf('admin') || ~config.admins.indexOf(req.user.sub)) {
                    config.canedit = true;
                }
            }
            config.admins = profile.select(profiles, config.admins);
            res.json(config);
        });
    }); 
});
*/

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Config.findById(req.params.id, function(err, config) {
        if(err) return next(err);
        if(!config) return next(new Error("can't find the config with id:"+req.params.id));
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, config)) {
            config.remove().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });

    /*
    var id = parseInt(req.params.id);
    db.Config.findOne({
        where: {id: id}
    }).then(function(config) {
        if(!config) return next(new Error("can't find the config with id:"+id));
        //only superadmin or admin of this config can update
        if(~req.user.scopes.mca.indexOf('admin') || ~config.admins.indexOf(req.user.sub)) {
            config.destroy().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
    */
});

//update config
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Config.findById(req.params.id, function(err, config) {
        if(err) return next(err);
        if(!config) return next(new Error("can't find a config with id:"+req.params.id));
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, config)) {
            config.url = req.body.url;            
            config.desc = req.body.desc;            
            config.tests = req.body.tests;            
            config.admins = req.body.admins;            
            config.update_date = new Date();
            config.save(function(err) {
                if(err) return next(err);
                config = JSON.parse(JSON.stringify(config));
                config._canedit = canedit(req.user, config);
                res.json(config);
            }).catch(function(err) {
                next(err);
            });
        } else return res.status(401).end();
        /*
        //make sure specified url doesn't conflict with other config
        check_duplicate_url(req.body.url, config.id, function(err) {
            if(err) return next(err);
            console.log("ok");
            //only superadmin or admin of this test spec can update
            if(~req.user.scopes.mca.indexOf('admin') || ~config.admins.indexOf(req.user.sub)) {
                config.desc = req.body.desc;
                config.url = req.body.url;
                var admins = [];
                req.body.admins.forEach(function(admin) {
                    admins.push(admin.id);
                });
                config.admins = admins;
                config.save().then(function() {
                    //upsert tests
                    var tests = [];
                    async.eachSeries(req.body.Tests, function(test, next) {
                        if(test.id) {
                            //logger.debug("updating test with following--------------");
                            //logger.debug(test);
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
        */
    }); 
});

/*
function check_duplicate_url(url, ownid, cb) {
    db.Config.findOne({where: { url: url } }).then(function(rec) {
        if(rec && rec.id != ownid) return cb("The URL specified is already used by another config. Please choose a different URL.");
        cb(null);
    });
}
*/

//new config
router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    db.Config.create(req.body, function(err, config) {
        if(err) return next(err);
        config = JSON.parse(JSON.stringify(config));
        config._canedit = canedit(req.user, config);
        res.json(config);
    });
    /*
    //if(!~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    //convert admin objects to list of subs
    var admins = [];
    req.body.admins.forEach(function(admin) {
        admins.push(admin.id);
    });
    req.body.admins = admins;

    //make sure specified url doesn't conflict with other config
    check_duplicate_url(req.body.url, null, function(err) {
        if(err) return next(err);
        
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
        }).catch(function(err) {
            next(err);      
        });
    });
    */
});

module.exports = router;

