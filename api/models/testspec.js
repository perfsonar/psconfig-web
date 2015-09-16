'use strict';

//this is just a sample

//contrib
var Sequelize = require('sequelize');
var winston = require('winston');

//mine
var config = require('../config/config');
var logger = new winston.Logger(config.logger.winston);

//for field types
//http://docs.sequelizejs.com/en/latest/api/datatypes/

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Testspec', {
        service_type: Sequelize.STRING, 
        
        //array of host ids (client-uuid in sLS)
        specs: {
            type: Sequelize.TEXT,
            defaultValue: '{}',
            get: function () { 
                return JSON.parse(this.getDataValue('specs'));
            },
            set: function (specs) {
                return this.setDataValue('specs', JSON.stringify(specs));
            }
        },
    }, {
        classMethods: {
        },
        instanceMethods: {
        }
    });
}

