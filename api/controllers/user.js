var fs = require('fs');

var express = require('express');
var jwt = require('express-jwt');
var router = express.Router();
//var _ = require('underscore');

var config = require('../config/config').config;
//var jwt_helper = require('../jwt_helper');
var Profile = require('../models').Profile;

//TODO - express-jwt doesn't check for scope .. submitted this https://github.com/auth0/express-jwt/issues/85
router.get('/profile', jwt({secret: config.public_key}), function(req, res, next) {
    if(req.user.scopes.common.indexOf("user") == -1) {
        return res.send(401, {message: "Unauthorized"});
    }
    Profile.findOne({where: {user_id: req.user.sub}}).then(function(profile) {
        if(profile) {
            res.json({fullname: profile.fullname, bio: profile.bio});
        } else {
            //maybe user hasn't created his profile yet - it's ok to return empty in that case
            res.json({}); 
        }
    });
    /*
        if (!profile) {
            //throw new Error("can't find user id:"+req.user.sub);
            //maybe this is the first time we see this user's profile.
            //let's create an empty record
            Profile.create({}).then(function(profile) {
                res.json({fullname: profile.fullname, bio: profile.bio});
            });
        }
    });
    */
})

//TODO - check scope
router.put('/profile', jwt({secret: config.public_key}), function(req, res, next) {
    if(req.user.scopes.common.indexOf("user") == -1) {
        return res.send(401, {message: "Unauthorized"});
    }
    //Profile.findOne({where: {user_id: req.user.sub}}).then(function(profile) {
    Profile.findOrCreate({where: {user_id: req.user.sub}, default: {}}).spread(function(profile, created) {
        if(created) {
            console.log("Created new profile for user id:"+req.user.sub);
        }
        //if (!profile) throw new Error("can't find user id:"+req.user.sub);
        //console.dir(user.profile);
        //console.dir(req.body);
        
        /*
        //email address updated?
        if(req.body.email != user.local.email) {
            console.log("user changed email address to "+req.body.email);
            //TODO - check for uniqueness (enforced via db)
            user.local.email = req.body.email;
            user.local.email_confirmed = false;
        }
        */

        profile.fullname = req.body.fullname;
        profile.bio = req.body.bio;

        profile.save().then(function() {
            res.json({message: "Updated!"});
        //}).error(function(err) {;
        //    res.send(500, {message: "Failed to update: "+err});
        });
    });
});

module.exports = router;
