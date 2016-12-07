'use strict';

//contrib
var express = require('express');
var router = express.Router();
var winston = require('winston');
var jwt = require('express-jwt');
var async = require('async');

//mine
var config = require('../../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../../models');
//var profile = require('../../common').profile;

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    db.Testspec.find({}, function(err, testspecs) {
        if(err) return next(err);
            
        //convert to normal javascript object so that I can add stuff to it (why can't I for sequelize object?)
        var json = JSON.stringify(testspecs);
        testspecs = JSON.parse(json);
        
        //TODO - I should deprecate profile and let client do this .. like onere UI?
        //profile.getall(function(err, profiles) {

        //set _canedit flag for each specs
        testspecs.forEach(function(testspec) {
            testspec.canedit = false;
            if(req.user) {
                if(~req.user.scopes.mca.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
                    testspec._canedit = true;
                }
            }
            //testspec.admins = profile.select(profiles, testspec.admins);
        });
        res.json(testspecs);
        //});
    }); 
});

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    //var id = parseInt(req.params.id);
    db.Testspec.findById(req.params.id, function(err, testspec) {
        if(err) return next(err);
        if(!testspec) return next(new Error("can't find a testspec with id:"+id));
        //only superadmin or admin of this test spec can update
        if(~req.user.scopes.mca.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
            testspec.remove().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

//update
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    //var id = parseInt(req.params.id);
    db.Testspec.findById(req.params.id, function(err, testspec) {
        if(err) return next(err);
        if(!testspec) return next(new Error("can't find a testspec with id:"+id));
        //only superadmin or admin of this test spec can update
        if(~req.user.scopes.mca.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {

            //do update fields
            testspec.desc = req.body.desc;
            testspec.specs = req.body.specs;
            var admins = [];
            req.body.admins.forEach(function(admin) {
                admins.push(admin.id);
            });
            testspec.admins = admins;
            testspec.save(function(err) {
                if(err) return next(err);

                var canedit = false;
                if(~req.user.scopes.mca.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
                    var canedit = true;
                }
                res.json({status: "ok", canedit: canedit});
            });
        } else return res.status(401).end();
    }); 
});

router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    
    //convert admin objects to list of subs
    var admins = [];
    req.body.admins.forEach(function(admin) {
        admins.push(admin.id);
    });
    req.body.admins = admins;

    db.Testspec.create(req.body, function(err, testspec) {
        if(err) return next(err);

        var canedit = false;
        if(~req.user.scopes.mca.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
            var canedit = true;
        }
        res.json({status: "ok", canedit: canedit, id: testspec.id});
    });
});

module.exports = router;

