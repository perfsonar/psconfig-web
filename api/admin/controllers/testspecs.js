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
var profile = require('../../common').profile;

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    db.Testspec.findAll().then(function(testspecs) {
        //convert to normal javascript object so that I can add stuff to it (why can't I for sequelize object?)
        profile.getall(function(err, profiles) {
            var json = JSON.stringify(testspecs);
            testspecs = JSON.parse(json);
            testspecs.forEach(function(testspec) {
                testspec.canedit = false;
                if(req.user) {
                    if(~req.user.scopes.common.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
                        testspec.canedit = true;
                    }
                }
                testspec.admins = profile.select(profiles, testspec.admins);
            });
            res.json(testspecs);
        });
    }); 
});

/* deprecated?
//all test specs are open to public for read access
router.get('/:id', function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Testspec.findOne({where: {id: id}}).then(function(testspec) {
        testspec.admins = profile.load_admins(testspec.admins);
        res.json(testspec);
    }); 
});
*/

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var id = parseInt(req.params.id);
    db.Testspec.findOne({where: {id: id}}).then(function(testspec) {
        if(!testspec) return next(new Error("can't find a testspec with id:"+id));
        //only superadmin or admin of this test spec can update
        if(~req.user.scopes.common.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
            testspec.destroy().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var id = parseInt(req.params.id);
    //console.log("updating "+id);
    db.Testspec.findOne({where: {id: id}}).then(function(testspec) {
        if(!testspec) return next(new Error("can't find a testspec with id:"+id));
        //only superadmin or admin of this test spec can update
        if(~req.user.scopes.common.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
            //TODO - should validate?
            testspec.desc = req.body.desc;
            testspec.specs = req.body.specs;
            var admins = [];
            req.body.admins.forEach(function(admin) {
                admins.push(admin.sub);
            });
            testspec.admins = admins;
            testspec.save().then(function() {
                var canedit = false;
                if(~req.user.scopes.common.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
                    var canedit = true;
                }
                res.json({status: "ok", canedit: canedit});
            }).catch(function(err) {
                next(err);
            });
        } else return res.status(401).end();
    }); 
});

router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!~req.user.scopes.common.indexOf('user')) return res.status(401).end();
    //console.log(JSON.stringify(req.body, null, 4));

    //convert admin objects to list of subs
    var admins = [];
    req.body.admins.forEach(function(admin) {
        admins.push(admin.sub);
    });
    req.body.admins = admins;
    //console.dir(req.body);

    db.Testspec.create(req.body).then(function(testspec) {
        var canedit = false;
        if(~req.user.scopes.common.indexOf('admin') || ~testspec.admins.indexOf(req.user.sub)) {
            var canedit = true;
        }
        res.json({status: "ok", canedit: canedit, id: testspec.id});
    });
});

module.exports = router;

