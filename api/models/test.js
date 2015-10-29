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
    return sequelize.define('Test', {
        desc: Sequelize.STRING,
        service_type: Sequelize.STRING, 
        mesh_type: Sequelize.STRING, 
        center_address: Sequelize.STRING, //only used for mesh_type == star
        enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
    }, {
        classMethods: {
        },
        instanceMethods: {
        }
    });
}

