'use strict';

//contrib
var Sequelize = require('sequelize');
var winston = require('winston');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);

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

    //holds "cache" of sls service records
    return sequelize.define('Service', {
        /////////////////////////////////////////////////////////////////////////////////////////..
        //key
        uuid: Sequelize.STRING, //client-uuid + service-type

        /////////////////////////////////////////////////////////////////////////////////////////..
        //props
        name: Sequelize.STRING, //from service-name
        type: Sequelize.STRING, //like "owamp", "bwctl", etc.
        locator: Sequelize.STRING, // like "tcp://ps-latency.atlas.unimelb.edu.au:861" (used to pull hostname)
        lsid: Sequelize.STRING,  //source LS instance

        client_uuid: Sequelize.STRING, //used as host id

        sitename: Sequelize.STRING, //from location-sitename
        location: {
            type: Sequelize.TEXT,
            get: function () {
                return JSON.parse(this.getDataValue('location'));
            },
            set: function (location) {
                return this.setDataValue('location', JSON.stringify(location));
            }
        },
    
        //from service-administrators (pretty much TODO)
        admins: {
            type: Sequelize.TEXT,
            defaultValue: '[]',
            get: function () {
                return JSON.parse(this.getDataValue('admins'));
            },
            set: function (admins) {
                return this.setDataValue('admins', JSON.stringify(admins));
            }
        },

        count: Sequelize.INTEGER, //number of time this record was touched (needed to force sequelize update the updateAt time)
        
        /*      
        //array of host ids (client-uuid in sLS)
        rec: {
            type: Sequelize.TEXT,
            defaultValue: '{}',
            get: function () { 
                return JSON.parse(this.getDataValue('rec'));
            },
            set: function (hosts) {
                return this.setDataValue('rec', JSON.stringify(hosts));
            }
        },
        */
    }, {
        classMethods: {
        },
        instanceMethods: {
        }
    });
}

