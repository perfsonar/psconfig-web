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

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    db.Testspec.findAll(/*{include: [{
        model: db.Admin
    }]}*/).then(function(testspecs) {
        //convert to normal javascript object so that I can add stuff to it (why can't I for sequelize object?)
        var json = JSON.stringify(testspecs);
        testspecs = JSON.parse(json);
        testspecs.forEach(function(testspec) {
            testspec.canedit = false;
            if(req.user) {
                //if(~req.user.scopes.common.indexOf('admin') || db.Admin.isAdmin(testspec.Admins, req.user.sub)) {
                //console.dir(req.user);
                //console.dir(testspec.admins);
                if(~req.user.scopes.common.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
                    //logger.debug("can edit~!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                    testspec.canedit = true;
                }
            }
        });
        //console.log(JSON.stringify(testspecs, null, 4));
        res.json(testspecs);
    }); 
});

/*
//just to make sure mocha supertest is functioning properly
router.get('/check', function(req, res, next) {
    res.json({test: 'hello'});
});
*/

//all test specs are open to public for read access
router.get('/:id', function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Testspec.findOne({where: {id: id}/*, include: [{
        model: db.Admin
    }]*/}).then(function(testspec) {
        res.json(testspec);
    }); 
});

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Testspec.findOne({where: {id: id}/*, include: [{
        model: db.Admin
    }]*/}).then(function(testspec) {
        if(!testspec) return next(new Error("can't find a testspec with id:"+id));
        //only superadmin or admin of this test spec can update
        //if(~req.user.scopes.common.indexOf('admin') || db.Admin.isAdmin(testspec.Admins, req.user.sub)) {
        if(~req.user.scopes.common.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
            testspec.destroy().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var id = parseInt(req.params.id);
    console.log("updating "+id);
    db.Testspec.findOne({where: {id: id}/*, include: [{
        model: db.Admin
    }]*/}).then(function(testspec) {
        if(!testspec) return next(new Error("can't find a testspec with id:"+id));
        //only superadmin or admin of this test spec can update
        //if(~req.user.scopes.common.indexOf('admin') || db.Admin.isAdmin(testspec.Admins, req.user.sub)) {
        if(~req.user.scopes.common.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
            //TODO - should validate?
            testspec.desc = req.body.desc;
            testspec.specs = req.body.specs;
            testspec.admins = req.body.admins;
            console.dir(testspec);
            testspec.save().then(function() {
                /*
                //first I need to recreate all admin records
                var admins = [];
                async.eachSeries(req.body.admins, function(sub, cb) {
                    //TODO - should remove all current Admins first so that I don't get piles of unsed Admins
                    db.Admin.create({sub: sub}).then(function(admin) {
                        //logger.debug(JSON.stringify(admin, null, 4));
                        admins.push(admin);
                        cb(null);
                    });
                }, function(err) {
                    if(err) return next(err);
                    //console.dir(JSON.stringify(admins, null, 4));
                    //then reset all
                    testspec.setAdmins(admins).then(function() {
                        res.json({status: "ok"});
                    });
                });
                */
                res.json({status: "ok"});
            }).catch(function(err) {
                next(err);
            });
        } else return res.status(401).end();
    }); 
});

router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!~req.user.scopes.common.indexOf('user')) return res.status(401).end();
    console.log(JSON.stringify(req.body, null, 4));
    db.Testspec.create(req.body).then(function(testspec) {
        console.log(JSON.stringify(testspec, null, 4));
        /*
        //first I need to recreate all admin records
        var admins = [];
        async.eachSeries(req.body.admins, function(sub, cb) {
            //TODO - should remove all current Admins first so that I don't get piles of unsed Admins
            db.Admin.create({sub: sub}).then(function(admin) {
                //logger.debug(JSON.stringify(admin, null, 4));
                admins.push(admin);
                cb(null);
            });
        }, function(err) {
            if(err) return next(err);
            //console.dir(JSON.stringify(admins, null, 4));
            //then reset all
            testspec.setAdmins(admins).then(function() {
                res.json({status: "ok"});
            });
        });
        */
        res.json({status: "ok"});
    });
});

module.exports = router;

