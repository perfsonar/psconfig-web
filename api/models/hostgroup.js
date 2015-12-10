'use strict';

//contrib
var Sequelize = require('sequelize');
var winston = require('winston');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('./index');

//for field types
//http://docs.sequelizejs.com/en/latest/api/datatypes/

/* sample service record
{
    "id": "4415G0.owamp",
    "name": "ps-latency.atlas.unimelb.edu.au owamp",
    "locator": "tcp://ps-latency.atlas.unimelb.edu.au:861",
    "lsid": "wlcg"
},
*/

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Hostgroup', {
        service_type: Sequelize.STRING, 
        desc: Sequelize.STRING,

        //hostgroup type (static, dynamic, etc..) - not service type
        type: {
            type: Sequelize.STRING,
            defaultValue: 'static',
        },
 
        //(static) array of host ids (client-uuid for service records in sLS)
        hosts: {
            type: Sequelize.TEXT,
            defaultValue: '[]',
            get: function () { 
                var v = this.getDataValue('hosts');
                if(!v) return null;
                return JSON.parse(v);
            },
            set: function (hosts) {
                return this.setDataValue('hosts', JSON.stringify(hosts));
            }
        },

        //(dynamic) javascript filter code to select services (takes precedence over static list)
        host_filter: Sequelize.STRING,

        //array of user ids (sub string in auth service)
        admins: {
            type: Sequelize.TEXT,
            defaultValue: '[]',
            get: function () { 
                var v = this.getDataValue('admins');
                if(!v) return null;
                return JSON.parse(v);
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
            getHosts: function(cb) {
                var rec = this;
                if(this.type == 'static') return cb(null, rec.hosts);
                if(this.type == 'dynamic') {
                    common.filter.resolveHostGroup(rec.host_filter, rec.type, cb);
                } 
            }
            */
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

