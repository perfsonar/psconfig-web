'use strict';

//contrib
var winston = require('winston');
var Sequelize = require('sequelize');

//mine
var config = require('./config/config');
var logger = new winston.Logger(config.logger.winston);

var sequelize = new Sequelize('database', 'username', 'password', config.db);

var Profile = sequelize.define('Profile', {
    user_id: Sequelize.INTEGER, //for auth service user id
    
    //public profile (settings that user don't mind publishing to public) stored as JSON
    public: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
        get: function () { 
            return JSON.parse(this.getDataValue('public'));
        },
        set: function (value) {
            return this.setDataValue('public', JSON.stringify(value));
        }
    },

    //private profile
    private: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
        get: function () { 
            return JSON.parse(this.getDataValue('public'));
        },
        set: function (value) {
            return this.setDataValue('public', JSON.stringify(value));
        }
    },
    
    /*
    fullname: Sequelize.STRING,
    bio: Sequelize.TEXT
    */
}, {
    classMethods: {
        /*
        //why is this here?
        createToken: function(user) {
            var today = Math.round(Date.now()/1000);
            var expiration = today+3600*24*7; //7days

            //http://self-issued.info/docs/draft-ietf-oauth-json-web-token.html#RegisteredClaimName
            var token = {
                iss: "http://trident.iu.edu", //issuer
                exp: expiration,
                scopes: []
            };
            if(user) {
                token.sub = user._id;
                //token.name = user.fullname;
                token.scopes = user.scopes;
            }
            return token;
        }
        */

    },
    instanceMethods: {
        /*
        setPassword: function (password, cb) {
            var rec = this;
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, salt, null, function(err, hash) {
                    if(err) return cb(err);
                    //console.log("hash: "+hash);
                    rec.password_hash = hash;
                    cb(null);
                });
            });
        },
        isPassword: function(password) {
            return bcrypt.compareSync(password, this.password_hash);
        }
        */
    }
});

exports.sequelize = sequelize;
exports.Profile = Profile;
