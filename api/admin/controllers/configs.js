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
        if(user.scopes.mca && ~user.scopes.mca.indexOf('admin')) {
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
    .limit(parseInt(req.query.limit) || 100)
    .skip(parseInt(req.query.skip) || 0)
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
});

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
});

//update config
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Config.findById(req.params.id, function(err, config) {
        if(err) return next(err);
        if(!config) return next(new Error("can't find a config with id:"+req.params.id));
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, config)) {
            config.url = req.body.url;            
            config.name = req.body.name;            
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
    }); 
});

//new config
router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.mca || !~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    db.Config.create(req.body, function(err, config) {
        if(err) return next(err);
        config = JSON.parse(JSON.stringify(config));
        config._canedit = canedit(req.user, config);
        res.json(config);
    });
});

module.exports = router;

