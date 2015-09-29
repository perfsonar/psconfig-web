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
        service_type: Sequelize.STRING, 
        mesh_type: Sequelize.STRING, 
        enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
        desc: Sequelize.STRING,
    }, {
        classMethods: {
        },
        instanceMethods: {
        }
    });
}

