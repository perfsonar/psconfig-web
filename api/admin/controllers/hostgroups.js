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
        if(user.scopes.mca && ~user.scopes.mca.indexOf('admin')) {
            return true;
        }
        if(~hostgroup.admins.indexOf(user.sub)) {
            return true;
        }
    }
    return false;
}

router.get('/', jwt({secret: config.admin.jwt.pub, credentialsRequired: false}), function(req, res, next) {
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    db.Hostgroup.find(find)
    .select(req.query.select)
    .limit(req.query.limit || 100)
    .skip(req.query.skip || 0)
    .sort(req.query.sort || '_id')
    .lean() //so that I can add _canedit later
    .exec(function(err, hostgroups) {
        if(err) return next(err);
        db.Hostgroup.count(find).exec(function(err, count) { 
            if(err) return next(err);
            hostgroups.forEach(function(hostgroup) {
                hostgroup._canedit = canedit(req.user, hostgroup);
            });
            res.json({hostgroups: hostgroups, count: count});
        });
    }); 
});

router.delete('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Hostgroup.findById(req.params.id, function(err, hostgroup) {
        if(err) return next(err);
        if(!hostgroup) return next(new Error("can't find the hostgroup with id:"+req.params.id));
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, hostgroup)) {
            hostgroup.remove().then(function() {
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

/*
//remove null items from an array
function filter_null(a) {
    var ret = [];
    a.forEach(function(it) {
        if(it == null) return;
        ret.push(it);
    });
    return ret;
}
*/

router.put('/:id', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    db.Hostgroup.findById(req.params.id, function(err, hostgroup) {
        if(err) return next(err);
        if(!hostgroup) return next(new Error("can't find a hostgroup with id:"+req.params.id));
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, hostgroup)) {
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
            }).catch(function(err) {
                next(err);
            });
        } else return res.status(401).end();
    }); 
});

router.post('/', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    if(!req.user.scopes.mca || !~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    db.Hostgroup.create(req.body, function(err, hostgroup) {
        if(err) return next(err);
        hostgroup = JSON.parse(JSON.stringify(hostgroup));
        hostgroup._canedit = canedit(req.user, hostgroup);
        res.json(hostgroup);
    });
});

router.get('/dynamic', jwt({secret: config.admin.jwt.pub}), function(req, res, next) {
    //TODO - let's allow anyone who is logged in.. (should limit more?)
    //if(!req.user.scopes.mca || !~req.user.scopes.mca.indexOf('user')) return res.status(401).end();
    common.dynamic.resolve(req.query.js, req.query.type, function(err, resp) {
        if(err) return next(err);
        res.json(resp);
    });
});

module.exports = router;

