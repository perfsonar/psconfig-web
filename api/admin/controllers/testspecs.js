'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const async = require('async');

//mine
const config = require('../../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../../models');

function canedit(user, testspec) {
    if(user) {
        if(user.scopes.pwa && ~user.scopes.pwa.indexOf('admin')) return true; 
        if(~testspec.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

/**
 * @api {get} /testspecs        Query Testspecs
 * @apiGroup                    Testspecs
 * @apiDescription              Query testspecs registered by users
 
 * @apiParam {Object} [find]    Mongo find query JSON.stringify & encodeURIComponent-ed - defaults to {}
 *                              To pass regex, you need to use {$regex: "...."} format instead of js: /.../ 
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to return (admins will always be added). Multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * @apiHeader {String}          Authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         hosts: List of testspecs objects(testspecs:), count: total number of testspecs (for paging)
 */
router.get('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);
    
    //we need to select admins , or can't get _canedit set
    var select = req.query.select;
    if(select && !~select.indexOf("admins")) select += " admins";

    db.Testspec.find(find)
    .select(select)
    .limit(parseInt(req.query.limit) || 100)
    .skip(parseInt(req.query.skip) || 0)
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

/**
 * @api {post} /testspecs       New testspec
 * @apiGroup                    Testspecs
 * @apiDescription              Register new testspec
 *
 * @apiParam {String} service_type Service Type (bwctl, owamp, traceroute, ping, etc..)
 * @apiParam {String} name      Name
 * @apiParam {String} [desc]    Description
 * @apiParam {Object} specs     Spec details (key/value pairs)
 * @apiParam {String[]} [admins] Array of admin IDs
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Testspec registered
 */
router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.pwa || !~req.user.scopes.pwa.indexOf('user')) return res.status(401).end();
    db.Testspec.create(req.body, function(err, testspec) {
        if(err) return next(err);
        testspec = JSON.parse(JSON.stringify(testspec));
        testspec._canedit = canedit(req.user, testspec);
        res.json(testspec);
    });
});

/**
 * @api {put} /testspecs/:id    Update testspec
 * @apiGroup                    Testspecs
 * @apiDescription              Update testspec information (service_type can be changed if it's not used by any test)
 *
 * @apiParam {String} [service_type] Service Type (bwctl, owamp, traceroute, ping, etc..)
 * @apiParam {String} [name]      Name
 * @apiParam {String} [desc]    Description
 * @apiParam {Object} [specs]     Spec details (key/value pairs)
 * @apiParam {String[]} [admins] Array of admin IDs
*
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Testspec updated
 */
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Testspec.findById(req.params.id, function(err, testspec) {
        if(err) return next(err);
        if(!testspec) return next(new Error("can't find a testspec with id:"+req.params.id));
        if(!canedit(req.user, testspec)) return res.status(401).end();

        if(req.body.service_type == testspec.service_type) update();
        else {
            //check to make sure if it's not used by a test
            db.Config.find({"tests.testspec": testspec._id}, function(err, tests) {
                if(err) return next(err);
                if(tests.length == 0) update();
                else {
                    var names = "";
                    tests.forEach(function(test) { names+=test.name+", "; });
                    next("You can not change service_type for this testspec. It is currently used by "+names);
                }
            }); 
        } 

        function update() {
            //not used by anyone .. update (field no set won't be updated - unless it's set to undefined explicitly)
            testspec.service_type = req.body.service_type;
            testspec.name = req.body.name;
            testspec.desc = req.body.desc;
            testspec.specs = req.body.specs;
            testspec.schedule_type = req.body.schedule_type;
            testspec.admins = req.body.admins;
            testspec.update_date = new Date();
            testspec.save(function(err) {
                if(err) return next(err);
                testspec = JSON.parse(JSON.stringify(testspec));
                testspec._canedit = canedit(req.user, testspec);
                res.json(testspec);
            }).catch(function(err) {
                next(err);
            });
        } 
    }); 
});

/**
 * @api {delete} /testspecs/:id   Remove testspec
 * @apiGroup                    Testspecs
 * @apiDescription              Remove testspec registration - if it's not used by any test
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "status": "ok"
 *     }
 */
router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Testspec.findById(req.params.id, function(err, testspec) {
        if(err) return next(err);
        if(!testspec) return next(new Error("can't find a testspec with id:"+req.params.id));

        async.series([
            //check access 
            function(cb) {
                if(canedit(req.user, testspec)) {
                    cb();
                } else {
                    cb("You don't have access to remove this testspec");
                }
            },
            
            //check foreign key dependencies on test
            function(cb) {
                db.Config.find({"tests.testspec": testspec._id}, function(err, tests) {
                    if(err) return cb(err);
                    var names = "";
                    tests.forEach(function(test) {
                        names+=test.name+", ";
                    });
                    if(names == "") {
                        cb();
                    } else {
                        cb("You can not remove this testspec. It is currently used by "+names);
                    }
                }); 
            }

        ], function(err) {
            if(err) return next(err);
            //all good.. remove
            testspec.remove().then(function() {
                res.json({status: "ok"});
            }); 
        });
    });
});

module.exports = router;

