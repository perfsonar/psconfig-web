'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.json')[env];
var sequelize = new Sequelize(config.database, config.username, config.password, config);
var db        = {};

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

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

//relationships
/*
db.Hostgroup.belongsToMany(db.Admin, {through: 'AdminHostgroup'});
db.Admin.belongsToMany(db.Hostgroup, {through: 'AdminHostgroup'});

db.Testspec.belongsToMany(db.Admin, {through: 'AdminTestspec'});
db.Admin.belongsToMany(db.Testspec, {through: 'AdminTestspec'});
*/
/*
db.Test.belongsToMany(db.Hostgroup, {through: 'HostgroupToTest'});
db.Hostgroup.belongsToMany(db.Test, {through: 'HostgroupToTest'});
*/

/*
db.Config.belongsToMany(db.Admin, {through: 'AdminConfig'});
db.Admin.belongsToMany(db.Config, {through: 'AdminConfig'});
*/
db.Config.hasMany(db.Test);
db.Testspec.hasMany(db.Test);
db.Hostgroup.hasMany(db.Test, {foreignKey: 'agroup'}); //Test.getAgroup, Test.setAgroup
db.Hostgroup.hasMany(db.Test, {foreignKey: 'bgroup'}); //Test.getBgroup, Test.setBgroup

module.exports = db;
