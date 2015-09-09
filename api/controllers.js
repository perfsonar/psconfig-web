'use strict';

//contrib
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');

//mine
var config = require('./config/config');
var models = require('./models');

//for retrieving public profile
//since it's *public* profile, no access control is performend on this
router.get('/public/:id', /*jwt({secret: config.express.jwt.public_key}),*/ function(req, res, next) {
    /*
    if(req.user.scopes.common.indexOf("user") === -1) {
        return res.send(401, {message: "Unauthorized"});
    }
    */
    
    models.Profile.findOne({where: {user_id: /*req.user.sub*/req.params.id}}).then(function(profile) {
        if(profile) {
            res.json(profile.public);
        } else {
            //maybe user hasn't created his profile yet - it's ok to return empty in that case
            res.json({}); 
        }
    });
})

//for updating public profile
router.put('/public/:id', jwt({secret: config.express.jwt.public_key}), function(req, res, next) {

    //needs to have user scope
    if(req.user.scopes.common.indexOf("user") == -1) {
        return res.send(401, {message: "Unauthorized"});
    }
    //admin or the owner can edit it
    if(req.user.scopes.common.indexOf("admin") == -1) {
        if(req.params.id != req.user.sub) return res.send(401, {message: "Unauthorized"});
    }

    models.Profile.findOrCreate({where: {user_id: req.params.id}, default: {}}).spread(function(profile, created) {
        if(created) {
            console.log("Created new profile for user id:"+req.user.sub);
        }
        profile.public = req.body;

        profile.save().then(function() {
            res.json({message: "Public profile updated!"});
        });
    });
});

//retreieve private profile
router.get('/private/:id', jwt({secret: config.express.jwt.public_key}), function(req, res, next) {

    //needs to have user scope
    if(req.user.scopes.common.indexOf("user") == -1) {
        return res.send(401, {message: "Unauthorized"});
    }
    //admin or the owner can retrieve it
    if(req.user.scopes.common.indexOf("admin") == -1) {
        if(req.params.id != req.user.sub) return res.send(401, {message: "Unauthorized"});
    }
    
    models.Profile.findOne({where: {user_id: /*req.user.sub*/req.params.id}}).then(function(profile) {
        if(profile) {
            res.json(profile.private);
        } else {
            //maybe user hasn't created his profile yet - it's ok to return empty in that case
            res.json({}); 
        }
    });
})

//for updating private profile
router.put('/public/:id', jwt({secret: config.express.jwt.public_key}), function(req, res, next) {

    //needs to have user scope
    if(req.user.scopes.common.indexOf("user") == -1) {
        return res.send(401, {message: "Unauthorized"});
    }
    //admin or the owner can edit it
    if(req.user.scopes.common.indexOf("admin") == -1) {
        if(req.params.id != req.user.sub) return res.send(401, {message: "Unauthorized"});
    }

    models.Profile.findOrCreate({where: {user_id: req.params.id}, default: {}}).spread(function(profile, created) {
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
