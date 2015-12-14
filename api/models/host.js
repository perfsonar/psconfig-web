'use strict';

//contrib
var Sequelize = require('sequelize');
var winston = require('winston');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);

//for field types
//http://docs.sequelizejs.com/en/latest/api/datatypes/

/* sample host record
{
    location-state: [
    "Leningrad district"
    ],
    host-administrators: [
    "lookup/person/9428b6e9-15b1-4eb0-8b0d-9856c5d7abd4"
    ],
    location-city: [
    "Gatchina"
    ],
    expires: "2015-11-08T16:50:57.152Z",
    location-code: [
    "188300"
    ],
    host-hardware-processorcount: [
    "1"
    ],
    group-communities: [
    "WLCG"
    ],
    host-name: [
    "212.193.96.29"
    ],
    type: [
    "host"
    ],
    uri: "lookup/host/22840bea-39d3-4125-94ff-245a39aa9960",
    host-hardware-processorspeed: [
    "2800.205 MHz"
    ],
    host-os-version: [
    "CentOS 6.7 (Final)"
    ],
    location-country: [
    "RU"
    ],
    location-longitude: [
    "30.1114"
    ],
    location-latitude: [
    "59.5961"
    ],
    location-sitename: [
    "ru-PNPI"
    ],
    client-uuid: [
    "7539G0"
    ],
    state: "registered",
    host-hardware-memory: [
    "3072 MB"
    ],
    pshost-toolkitversion: [
    "3.5.0.6-1.pSPS"
    ]
},
*/

module.exports = function(sequelize, DataTypes) {

    return sequelize.define('Host', {
        /////////////////////////////////////////////////////////////////////////////////////////..
        //key
        uuid: Sequelize.STRING, //client-uuid

        /////////////////////////////////////////////////////////////////////////////////////////..
        //props
        sitename: Sequelize.STRING, //from host-name (could be just IP)
        ip: Sequelize.STRING, //from host-name (always just ip?)
        hostname: Sequelize.STRING, //resolved from the IP

        toolkit_url: {
            type: Sequelize.STRING,
            defaultValue: "auto", 
        },
        no_agent: { type: Sequelize.BOOLEAN, defaultValue: false },

        //host info (pshost-toolkitversion, host-hardware-memory, host-os-version, host-hadeware-processorspeed, host-hadware-processorcount)
        info: {
            type: Sequelize.TEXT,
            get: function () {
                var v = this.getDataValue('info');
                if(!v) return null;
                return JSON.parse(v);
            },
            set: function (v) {
                return this.setDataValue('info', JSON.stringify(v));
            }
        },

        //(location-state, location-city, location-country, etc..)
        location: {
            type: Sequelize.TEXT,
            get: function () {
                var v = this.getDataValue('location');
                if(!v) return null;
                return JSON.parse(v);
            },
            set: function (v) {
                return this.setDataValue('location', JSON.stringify(v));
            }
        },
        
        //(location-state, location-city, location-country, etc..)
        communities: {
            type: Sequelize.TEXT,
            get: function () {
                var v = this.getDataValue('communities');
                if(!v) return null;
                return JSON.parse(v);
            },
            set: function (v) {
                return this.setDataValue('communities', JSON.stringify(v));
            }
        },
    
        //from host-administrators (TODO not used yet)
        admins: {
            type: Sequelize.TEXT,
            defaultValue: '[]',
            get: function () {
                var v = this.getDataValue('admins');
                if(!v) return null;
                return JSON.parse(v);
            },
            set: function (v) {
                return this.setDataValue('admins', JSON.stringify(v));
            }
        },

        count: Sequelize.INTEGER, //number of time this record was touched (needed to force sequelize update the updateAt time)
    });
}

