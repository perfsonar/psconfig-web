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
    //return profiles 
    //cb(null, profiles);
    request.get({
        url: config.common.profile_api+"/users",
        json: true,
        headers: { 'Authorization': 'Bearer '+config.common.profile_jwt }
    }, function (err, res, profiles) {
        if(err) return cb(err);
        if (res.statusCode != 200) {
            return cb({message: "couldn't load user profiles from profile service:", code: res.statusCode});
        }
        //convert to array of objecdt keyed by subs
        var ps = {};
        profiles.forEach(function(p) {
            p.public.sub = p.sub; //copy sub from key to inside the public profile
            ps[p.sub] = p.public;
        });
        cb(null, ps);
    });
};

//synchrnoous because user has to provide profiles array
exports.select = function(profiles, subs) {
    //console.log(JSON.stringify(profiles, null, 4));
    var ps = [];
    subs.forEach(function(sub) {
        if(profiles[sub] === undefined) {
            logger.warn("couldn't find user with sub:"+sub+" in profiles cache");
        } else {
            var p = profiles[sub];
            ps.push(p);
        } 
    });
    //console.log(JSON.stringify(ps, null, 4));
    return ps;
}

