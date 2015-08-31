'use strict';

//contrib
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');

//mine
var config = require('./config/config');
var models = require('./models');

router.get('/public', jwt({secret: config.express.jwt.public_key}), function(req, res, next) {
    if(req.user.scopes.common.indexOf("user") === -1) {
        return res.send(401, {message: "Unauthorized"});
    }
    models.Profile.findOne({where: {user_id: req.user.sub}}).then(function(profile) {
        if(profile) {
            res.json(profile.public);
        } else {
            //maybe user hasn't created his profile yet - it's ok to return empty in that case
            res.json({}); 
        }
    });
})

router.put('/public', jwt({secret: config.express.jwt.public_key}), function(req, res, next) {
    if(req.user.scopes.common.indexOf("user") == -1) {
        return res.send(401, {message: "Unauthorized"});
    }
    models.Profile.findOrCreate({where: {user_id: req.user.sub}, default: {}}).spread(function(profile, created) {
        if(created) {
            console.log("Created new profile for user id:"+req.user.sub);
        }
        profile.public = req.body;

        profile.save().then(function() {
            res.json({message: "Public profile updated!"});
        });
    });
});

module.exports = router;
