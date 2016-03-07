'use strict';

//contgib
var winston = require('winston');
var request = require('request');
var Promise = require('promise');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

/*
var profiles = {};
exports.cache = function(cb) {
    logger.debug("caching user public profiles");
    request({
        url: config.common.profile_api+"/users",
        json: true,
        headers: { 'Authorization': 'Bearer '+config.common.profile_jwt }
    }, function (err, res, body) {
        if(err) return cb(err);
        if (res.statusCode != 200) {
            return cb({message: "couldn't load user profiles from profile service:"+res.body, code: res.statusCode});
        }
        //update cache (let's assume user never disappears)
        body.forEach(function(user) {
            profiles[user.sub] = user.public;
            profiles[user.sub].sub = user.sub; 
        });
        logger.debug("cached "+body.length+" profiles");
        if(cb) cb(null);
    });
}
*/

//proxy for profile/users API
exports.getall = function(cb) { 
        //console.dir({ 'Authorization': 'Bearer '+config.common.auth_jwt });
    request.get({
        url: config.common.auth_api+"/profiles",
        json: true,
        headers: { 'Authorization': 'Bearer '+config.common.auth_jwt }
    }, function (err, res, profiles) {
        if(err) return cb(err);
        if (res.statusCode != 200) {
            return cb({message: "couldn't load user profiles from profile service:", code: res.statusCode});
        }
        //convert to array of objecdt keyed by user ids
        var ps = {};
        profiles.forEach(function(p) {
            //p.public.sub = p.id;
            ps[p.id] = p;
        });
        //console.dir(ps);
        cb(null, ps);
    });
};

//synchrnoous because user has to provide profiles array
exports.select = function(profiles, ids) {
    //console.log(JSON.stringify(profiles, null, 4));
    var ps = [];
    ids.forEach(function(id) {
        if(profiles[id] === undefined) {
            logger.warn("couldn't find user with id:"+id+" in profiles cache");
        } else {
            var p = profiles[id];
            ps.push(p);
        } 
    });
    //console.log(JSON.stringify(ps, null, 4));
    return ps;
}

