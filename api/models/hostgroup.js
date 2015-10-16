'use strict';

//contrib
var Sequelize = require('sequelize');
var winston = require('winston');

//mine
var config = require('../config/config');
var logger = new winston.Logger(config.logger.winston);

//for field types
//http://docs.sequelizejs.com/en/latest/api/datatypes/

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Hostgroup', {
        service_type: Sequelize.STRING, 
        desc: Sequelize.STRING,
        
        //array of host ids (client-uuid in sLS)
        hosts: {
            type: Sequelize.TEXT,
            defaultValue: '[]',
            get: function () { 
                return JSON.parse(this.getDataValue('hosts'));
            },
            set: function (hosts) {
                return this.setDataValue('hosts', JSON.stringify(hosts));
            }
        },
        admins: {
            type: Sequelize.TEXT,
            get: function () { 
                return JSON.parse(this.getDataValue('admins'));
            },
            set: function (admins) {
                return this.setDataValue('admins', JSON.stringify(admins));
            }
        },
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
}

