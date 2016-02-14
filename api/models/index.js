'use strict';

//node
var fs        = require('fs');
var path      = require('path');

//contrib
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var winston = require('winston');

//mine
var config    = require('../config');
var logger = new winston.Logger(config.logger.winston);

if(typeof config.db === 'string') {
    var sequelize = new Sequelize(config.db, {
        /*
        logging: function(str) {
            //ignore for now..
        }
        */
        //logging: logger.debug
        logging: false
    });
} else {
    //assume object
    var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, config.db);
}
var db = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename);
  })
  .forEach(function(file) {
    if (file.slice(-3) !== '.js') return;
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

//I am not sure what this is for, but it's from the sequelize doc
Object.keys(db).forEach(function(modelName) {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

//relationships
db.Config.hasMany(db.Test, {
    hooks: true,
    onDelete: 'cascade'
});

db.Testspec.hasMany(db.Test);

db.Test.belongsTo(db.Testspec);
db.Test.belongsTo(db.Hostgroup, {foreignKey: 'agroup', as: 'HostGroupA'});
db.Test.belongsTo(db.Hostgroup, {foreignKey: 'bgroup', as: 'HostGroupB'});
db.Test.belongsTo(db.Hostgroup, {foreignKey: 'nagroup', as: 'HostGroupNA'});

db.Hostgroup.hasMany(db.Test, {foreignKey: 'agroup'});
db.Hostgroup.hasMany(db.Test, {foreignKey: 'bgroup'});
db.Hostgroup.hasMany(db.Test, {foreignKey: 'nagroup'});

db.Service.belongsTo(db.Service, {foreignKey: 'ma', as: 'MA'});
db.Service.hasMany(db.Service, {foreignKey: 'ma'});

db.Service.belongsTo(db.Host, {foreignKey: 'client_uuid', targetKey: 'uuid'});
//db.Host.hasMany(db.Service, {foreignKey: 'client_uuid', targetKey: 'uuid'});

module.exports = db;

