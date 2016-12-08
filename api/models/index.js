'use strict';

//contrib
const mongoose = require('mongoose');
const winston = require('winston');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);

//use native promise for mongoose
//without this, I will get Mongoose: mpromise (mongoose's default promise library) is deprecated
mongoose.Promise = global.Promise; 

exports.init = function(cb) {
    mongoose.connect(config.mongodb, {
        server: { auto_reconnect: true }
    }, function(err) {
        if(err) return cb(err);
        logger.info("connected to mongo");
        cb();
    });
}
exports.disconnect = function(cb) {
    mongoose.disconnect(cb);
}

///////////////////////////////////////////////////////////////////////////////////////////////////

//service is now part of host 
var serviceSchema = mongoose.Schema({
    type: String, //like "owamp", "bwctl", etc.
    name: String, //from service-name
    locator: String, // like "tcp://ps-latency.atlas.unimelb.edu.au:861" (used to pull hostname)

    //ma to send data to. if not set, it uses local ma
    ma: {type: mongoose.Schema.Types.ObjectId, ref: 'Host'},

    //client_uuid: String, //used as host id
    //sitename: String, //from location-sitename
    //location: mongoose.Schema.Types.Mixed,

    //admins: [ String ], //from service-administrators (TODO not used yet - will be auth sub)

    //count: Number, //number of time this record was touched (needed to force sequelize update the updateAt time)
    //create_date: {type: Date, default: Date.now },
    //update_date: {type: Date, default: Date.now },
});
//exports.Service = mongoose.model('Service', serviceSchema);

//workflow instance
var hostSchema = mongoose.Schema({
    /*
    workflow_id: String, //"sca-wf-life"

    name: String, //name of the workflow
    desc: String, //desc of the workflow

    //user that this workflow instance belongs to
    user_id: {type: String, index: true}, 

    config: mongoose.Schema.Types.Mixed,
    */
    /////////////////////////////////////////////////////////////////////////////////////////..
    //key
    uuid: {type: String, index: true }, //client-uuid

    sitename: String,

    hostname: String, //fqdn
    //stores ip address resolved from the hostname using dns.resolve
    addresses: [
        mongoose.Schema({
            family: Number, //4 or 6
            address: String, //ip address
        })
    ], 

    toolkit_url: { type: String, default: "auto" },
    no_agent: { type: Boolean, default: false },

    //host info (pshost-toolkitversion, host-hardware-memory, host-os-version, host-hadeware-processorspeed, host-hadware-processorcount)
    info: mongoose.Schema.Types.Mixed,

    //(location-state, location-city, location-country, etc..)
    location: mongoose.Schema.Types.Mixed,
    
    //(location-state, location-city, location-country, etc..)
    communities: mongoose.Schema.Types.Mixed,

    services: [ serviceSchema ],

    admins: [ String ], //from host-administrators (TODO not used yet - will be auth sub)

    //count: Number, //number of time this record was touched (needed to force sequelize update the updateAt time)
    
    //debug 
    lsid: String,  //source LS instance (mainly to help ui)
    url: String, //source ls url

    create_date: {type: Date, default: Date.now },
    update_date: {type: Date, default: Date.now },
});
/*
//mongoose's pre/post are just too fragile.. it gets call on some and not on others.. (like findOneAndUpdate)
//I prefer doing this manually anyway, because it will be more visible 
instanceSchema.pre('update', function(next) {
    this.update_date = new Date();
    next();
});
*/
exports.Host = mongoose.model('Host', hostSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

var hostgroupSchema = mongoose.Schema({
    service_type: String,
    desc: String,
    type: { type: String, default: 'static' },

    hosts:[ {type: mongoose.Schema.Types.ObjectId, ref: 'Host'} ],

    //(dynamic) javascript filter code to select services (takes precedence over static list)
    host_filter: String,

    admins: [ String ], //array of user ids (sub string in auth service)

    create_date: {type: Date, default: Date.now },
    update_date: {type: Date, default: Date.now },
});
//hostgroupSchema.index({name: 'text', desc: 'text'});
exports.Hostgroup = mongoose.model('Hostgroup', hostgroupSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

//used to comments on various *things*
var testspecSchema = mongoose.Schema({
    service_type: String,
    desc: String,
    specs: mongoose.Schema.Types.Mixed,

    admins: [ String ], //array of user ids (sub string in auth service)
    create_date: {type: Date, default: Date.now },
    update_date: {type: Date, default: Date.now },
});
exports.Testspec = mongoose.model('Testspec', testspecSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

//used to comments on various *things*
var configSchema = mongoose.Schema({
    url: { type: String, unique: true },
    desc: String,

    admins: [ String ], //array of user ids (sub string in auth service)
    create_date: {type: Date, default: Date.now },
    update_date: {type: Date, default: Date.now },
});
exports.Config = mongoose.model('Config', configSchema);


