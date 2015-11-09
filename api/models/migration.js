'use strict';

//this table holds current migration version 
//TODO - maybe I should rename this to "Info" or "Config" or such?

//contrib
var Sequelize = require('sequelize');
var winston = require('winston');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);

//for field types
//http://docs.sequelizejs.com/en/latest/api/datatypes/

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Migration', {
        version: Sequelize.INTEGER
    });
}

