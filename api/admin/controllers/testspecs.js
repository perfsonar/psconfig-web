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

function canedit(user, testspec) {
    if(user) {
        if(user.scopes.mca && ~user.scopes.mca.indexOf('admin')) {
            return true;
        }
        if(~testspec.admins.indexOf(user.sub)) {
            return true;
        }
    }
    return false;
}

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    db.Testspec.find(find)
    .select(req.query.select)
    .limit(req.query.limit || 100)
    .skip(req.query.skip || 0)
    .sort(req.query.sort || '_id')
    .lean() //so that I can add _canedit later
    .exec(function(err, testspecs) {
        if(err) return next(err);
        db.Testspec.count(find).exec(function(err, count) { 
            if(err) return next(err);
            //set _canedit flag for each specs
            testspecs.forEach(function(testspec) {
                testspec._canedit = canedit(req.user, testspec);
            });
            res.json({testspecs: testspecs, count: count});
        });
    }); 
});

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    //var id = parseInt(req.params.id);
    db.Testspec.findById(req.params.id, function(err, testspec) {
        if(err) return next(err);
        if(!testspec) return next(new Error("can't find a testspec with id:"+req.params.id));
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, testspec)) {
            testspec.remove().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

//update
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Testspec.findById(req.params.id, function(err, testspec) {
        if(err) return next(err);
        if(!testspec) return next(new Error("can't find a testspec with id:"+req.params.id));
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, testspec)) {
            //do update fields
            testspec.service_type = req.body.service_type;
            testspec.name = req.body.name;
            testspec.desc = req.body.desc;
            testspec.specs = req.body.specs;
            testspec.admins = req.body.admins;
            testspec.update_date = new Date();
            testspec.save(function(err) {
                if(err) return next(err);
                //res.json({status: "ok", _canedit: canedit(req.user, testspec)});
                testspec = JSON.parse(JSON.stringify(testspec));
                testspec._canedit = canedit(req.user, testspec);
                res.json(testspec);
            }).catch(function(err) {
                next(err);
            });
        } else return res.status(401).end();
    }); 
});

router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.mca || !~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    db.Testspec.create(req.body, function(err, testspec) {
        if(err) return next(err);
        testspec = JSON.parse(JSON.stringify(testspec));
        testspec._canedit = canedit(req.user, testspec);
        res.json(testspec);
    });
});

module.exports = router;

