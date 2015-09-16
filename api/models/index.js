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
db.Hostgroup.hasMany(db.Admin);
db.Testspec.hasMany(db.Admin);
db.Test.hasMany(db.Hostgroup);
db.Test.hasOne(db.Testspec);
db.Config.hasMany(db.Admin);
db.Config.hasMany(db.Test);
db.Test.hasOne(db.Testspec, {as: 'agroup'}); //Test.getAgroup, Test.setAgroup
db.Test.hasOne(db.Testspec, {as: 'bgroup'}); //Test.getBgroup, Test.setBgroup

module.exports = db;
