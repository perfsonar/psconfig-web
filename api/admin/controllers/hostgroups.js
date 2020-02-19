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
const common = require('../../common');

function canedit(user, hostgroup) {
    if(user) {
        if(user.scopes.pwa && ~user.scopes.pwa.indexOf('admin')) return true;
        if(~hostgroup.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

/**
 * @api {get} /hostgroups       Query Hostgroups
 * @apiGroup                    Hostgroups
 * @apiDescription              Query hostgroups registered by users
 *
 * @apiParam {Object} [find]    Mongo find query JSON.stringify & encodeURIComponent-ed - defaults to {}
 *                              To pass regex, you need to use {$regex: "...."} format instead of js: /.../ 
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to return (admins will always be added). Multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * @apiSuccess {Object} [hostgroups]         hostgroups: list of hostgroups, and count: total number of hostgroup (for paging)
 * @apiHeader {String}          Authorization A valid JWT token "Bearer: xxxxx"
 *
 */
router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    //we need to select admins , or can't get _canedit set
    var select = req.query.select;
    if(select && !~select.indexOf("admins")) select += " admins";

    db.Hostgroup.find(find)
    .select(select)
    .limit(parseInt(req.query.limit) || 100)
    .skip(parseInt(req.query.skip) || 0)
    .sort(req.query.sort || '_id')
    .lean() //so that I can add _canedit later
    .exec(function(err, hostgroups) {
        if(err) return next(err);
        db.Hostgroup.countDocuments(find).exec(function(err, count) { 
            if(err) return next(err);
            hostgroups.forEach(function(hostgroup) {
                hostgroup._canedit = canedit(req.user, hostgroup);
            });
            res.json({hostgroups: hostgroups, count: count});
        });
    }); 
});

/**
 * @api {post} /hostgroups      New Hostgroup
 * @apiGroup                    Hostgroups
 * @apiDescription              Register New Hostgroup 
 *
 * @apiParam {String} service_type 
 *                              Service Type (bwctl, owamp, traceroute, ping, etc..)
 * @apiParam {String} name      Name
 * @apiParam {String} [desc]    Description
 * @apiParam {String} type      Host group type (static, or dynamic)
 * @apiParam {String[]} [hosts] Array of host IDs for static host group.
 *                              (For dynamic host, this field is used to store *currently* resolved hosts (auto-updated periodically)
 * @apiParam {String} [host_filter] Dynamic hostgroup script (only for dynamic host group)
 * @apiParam {String[]} [admins] Array of admin IDs
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Hostgroup created
 */
router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.pwa || !~req.user.scopes.pwa.indexOf('user')) return res.status(401).end();
    db.Hostgroup.create(req.body, function(err, hostgroup) {
        if(err) return next(err);
        hostgroup = JSON.parse(JSON.stringify(hostgroup));
        hostgroup._canedit = canedit(req.user, hostgroup);
        res.json(hostgroup);
    });
});

/**
 * @api {put} /hostgroups/:id   Update Hostgroup
 * @apiGroup                    Hostgroups
 * @apiDescription              Update registered hostgroup
 *
 * @apiParam {String} [service_type]]
 *                              Service Type (bwctl, owamp, traceroute, ping, etc..) You can only change this if this
 *                              hostgroup is not used by any config
 * @apiParam {String} [name]      Name
 * @apiParam {String} [desc]    Description
 * @apiParam {String} [type]      Host group type (static, or dynamic)
 * @apiParam {String[]} [hosts] Array of host IDs for static host group.
 *                              (For dynamic host, this field is used to store *currently* resolved hosts (auto-updated periodically)
 * @apiParam {String} [host_filter] Dynamic hostgroup script (only for dynamic host group)
 * @apiParam {String[]} [admins] Array of admin IDs
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Hostgroup updated
 */
router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Hostgroup.findById(req.params.id, function(err, hostgroup) {
        if(err) return next(err);
        if(!hostgroup) return next(new Error("can't find a hostgroup with id:"+req.params.id));
        if(!canedit(req.user, hostgroup)) return res.status(401).end();

        if(req.body.service_type == hostgroup.service_type) update();
        else {
            //check to make sure if it's not used by any config
             db.Config.find({$or: [
                    {"tests.agroup": hostgroup._id},
                    {"tests.bgroup": hostgroup._id},
                ]}, function(err, tests) {
                if(err) return cb(err);
                if(tests.length == 0) update();
                else {
                    var names = "";
                    tests.forEach(function(test) { names+=test.name+", "; });
                    next("You can not change service_type for this hostgroup. It is currently used by "+names);
                }
            }); 
        }
        
        function update() {
            hostgroup.service_type = req.body.service_type;
            hostgroup.name = req.body.name;
            hostgroup.desc = req.body.desc;
            hostgroup.type = req.body.type; 
            hostgroup.hosts = req.body.hosts;
            hostgroup.host_filter = req.body.host_filter;
            hostgroup.admins = req.body.admins;
            hostgroup.update_date = new Date();
            hostgroup.save(function(err) {
                if(err) return next(err);
                hostgroup = JSON.parse(JSON.stringify(hostgroup));
                hostgroup._canedit = canedit(req.user, hostgroup);
                res.json(hostgroup);
            });
        }
    }); 
});

//let's keep this undocumented for now
router.get('/dynamic', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    common.dynamic.resolve(req.query.js, req.query.type, function(err, resp) {
        if(err) return next(err);
        res.json(resp);
    });
});

/**
 * @api {delete} /hostgroups/:id    Remove Hostgroup
 * @apiGroup                        Hostgroups
 * @apiDescription                  Remove a Hostgroup registration - if it's not used by any test
 * @apiHeader {String} authorization 
 *                                  A valid JWT token "Bearer: xxxxx"
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "status": "ok"
 *     }
 */
router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Hostgroup.findById(req.params.id, function(err, hostgroup) {
        if(err) return next(err);
        if(!hostgroup) return next(new Error("can't find the hostgroup with id:"+req.params.id));
        
        async.series([
            
            //check access 
            function(cb) {
                if(canedit(req.user, hostgroup)) {
                    cb();
                } else {
                    cb("You don't have access to remove this hostgroup");
                }
            },
            
            //check foreign key dependencies
            function(cb) {
                db.Config.find({$or: [
                        {"tests.agroup": hostgroup._id},
                        {"tests.bgroup": hostgroup._id},
                    ]}, function(err, tests) {
                    if(err) return cb(err);
                    var names = "";
                    tests.forEach(function(test) { names+=test.name+", "; });
                    if(names == "") {
                        cb();
                    } else {
                        cb("You can not remove this hostgroup. It is currently used by "+names);
                    }
                }); 
            }

        ], function(err) {
            if(err) return next(err);
            //all good.. remove
            hostgroup.remove().then(function() {
                res.json({status: "ok"});
            }); 
        });

    });
});

module.exports = router;

