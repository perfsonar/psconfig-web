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

function canedit(user, archive) {
    if(user) {
        if(user.scopes.pwa && ~user.scopes.pwa.indexOf('admin')) return true; 
        if(~archive.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

/**
 * @api {get} /archives         Query Archives
 * @apiGroup                    Archives
 * @apiDescription              Query archives registered by users
 
 * @apiParam {Object} [find]    Mongo find query JSON.stringify & encodeURIComponent-ed - defaults to {}
 *                              To pass regex, you need to use {$regex: "...."} format instead of js: /.../ 
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to return (admins will always be added). Multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * @apiHeader {String}          Authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         hosts: List of archives objects(archives:), count: total number of archives (for paging)
 */
router.get('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);
    
    //we need to select admins , or can't get _canedit set
    var select = req.query.select;
    if(select && !~select.indexOf("admins")) select += " admins";

    db.Archive.find(find)
    .select(select)
    .limit(parseInt(req.query.limit) || 100)
    .skip(parseInt(req.query.skip) || 0)
    .sort(req.query.sort || '_id')
    .lean() //so that I can add _canedit later
    .exec(function(err, archives) {
        if(err) return next(err);
        db.Archive.count(find).exec(function(err, count) { 
            if(err) return next(err);
            //set _canedit flag for each specs
            archives.forEach(function(archive) {
                archive._canedit = canedit(req.user, archive);
            });
            res.json({archives: archives, count: count});
        });
    }); 
});

/**
 * @api {post} /archives        New archive
 * @apiGroup                    Archives
 * @apiDescription              Register new archive
 *
 * @apiParam {String} name      Name
 * @apiParam {String} [desc]    Description
 * @apiParam {String} archiver  Archiver URL (https://example.com)
 * @apiParam {Object} data      Archiver details (key/value pairs)
 * @apiParam {String[]} [admins] Array of admin IDs
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Archive registered
 */
router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.pwa || !~req.user.scopes.pwa.indexOf('user')) return res.status(401).end();
    db.Archive.create(req.body, function(err, archive) {
        if(err) return next(err);
        archive = JSON.parse(JSON.stringify(archive));
        archive._canedit = canedit(req.user, archive);
        res.json(archive);
    });
});

/**
 * @api {put} /archives/:id     Update archive
 * @apiGroup                    Archives
 * @apiDescription              Update archive information (archiver can be change)
 *
 * @apiParam {String} [name]      Name
 * @apiParam {String} [desc]      Description
 * @apiParam {String} [archiver]  Archiver URL (https://example.com)
 * @apiParam {Object} [data]      Archiver details (key/value pairs)
 * @apiParam {String[]} [admins]  Array of admin IDs
*
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Archive updated
 */
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Archive.findById(req.params.id, function(err, archive) {
        if(err) return next(err);
        if(!archive) return next(new Error("can't find a archive with id:"+req.params.id));
        if(!canedit(req.user, archive)) return res.status(401).end();

        if(req.body.archiver == archive.archiver) update();
        else {
            //check to make sure if it's not used by a test
            db.Config.find({"tests.archive": archive._id}, function(err, tests) {
                if(err) return next(err);
                if(tests.length == 0) update();
                else {
                    var names = "";
                    tests.forEach(function(test) { names+=test.name+", "; });
                    next("You can not change service_type for this archive. It is currently used by "+names);
                }
            }); 
        } 

        function update() {
            //not used by anyone .. update (field no set won't be updated - unless it's set to undefined explicitly)
            archive.name = req.body.name;
            archive.desc = req.body.desc;
            archive.archiver = req.body.archiver;
            archive.data = req.body.data;
            archive.admins = req.body.admins;
            archive.update_date = new Date();
            archive.save(function(err) {
                if(err) return next(err);
                archive = JSON.parse(JSON.stringify(archive));
                archive._canedit = canedit(req.user, archive);
                res.json(archive);
            }).catch(function(err) {
                next(err);
            });
        } 
    }); 
});

/**
 * @api {delete} /archives/:id  Remove archive
 * @apiGroup                    Archives
 * @apiDescription              Remove archive URL
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "status": "ok"
 *     }
 */
router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Archive.findById(req.params.id, function(err, archive) {
        if(err) return next(err);
        if(!archive) return next(new Error("can't find a archive with id:"+req.params.id));

        async.series([
            //check access 
            function(cb) {
                if(canedit(req.user, archive)) {
                    cb();
                } else {
                    cb("You don't have access to remove this archive");
                }
            },
            
            //check foreign key dependencies on test
            function(cb) {
                db.Config.find({"tests.archive": archive._id}, function(err, tests) {
                    if(err) return cb(err);
                    var names = "";
                    tests.forEach(function(test) {
                        names+=test.name+", ";
                    });
                    if(names == "") {
                        cb();
                    } else {
                        cb("You can not remove this archive. It is currently used by "+names);
                    }
                }); 
            }

        ], function(err) {
            if(err) return next(err);
            //all good.. remove
            archive.remove().then(function() {
                res.json({status: "ok"});
            }); 
        });
    });
});

module.exports = router;

