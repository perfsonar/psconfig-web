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
        server: { auto_reconnect: true, reconnectTries: Number.MAX_VALUE}
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
});

//workflow instance
var hostSchema = mongoose.Schema({
   
    /////////////////////////////////////////////////////////////////////////////////////////..
    //key
    hostname: {type: String, index: true}, 

    uuid: String,
    sitename: String,
    
    //stores ip address resolved from the hostname using dns.resolve
    addresses: [
        mongoose.Schema({
            family: Number, //4 or 6
            address: String, //ip address
        })
    ], 

    toolkit_url: {type: String, default: "auto"},
    no_agent: {type: Boolean, default: false},

    //host info (pshost-toolkitversion, host-hardware-memory, host-os-version, host-hadeware-processorspeed, host-hadware-processorcount)
    info: mongoose.Schema.Types.Mixed,

    //(location-state, location-city, location-country, etc..)
    location: mongoose.Schema.Types.Mixed,
    
    //(location-state, location-city, location-country, etc..)
    communities: mongoose.Schema.Types.Mixed,

    services: [ serviceSchema ],

    admins: [ String ], //from host-administrators (TODO not used yet - will be auth sub)

    //debug 
    lsid: String,  //source LS instance (mainly to help ui)
    url: String, //source ls url

    create_date: {type: Date, default: Date.now},
    update_date: {type: Date, default: Date.now},
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
    create_date: {type: Date, default: Date.now},
    update_date: {type: Date, default: Date.now},
});
//hostgroupSchema.index({name: 'text', desc: 'text'});
exports.Hostgroup = mongoose.model('Hostgroup', hostgroupSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

var testspecSchema = mongoose.Schema({
    service_type: String,
    desc: String,
    specs: mongoose.Schema.Types.Mixed,

    admins: [ String ], //array of user ids (sub string in auth service)
    create_date: {type: Date, default: Date.now},
    update_date: {type: Date, default: Date.now},
});
exports.Testspec = mongoose.model('Testspec', testspecSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

//test is now part of config
var testSchema = mongoose.Schema({
    service_type: String,
    desc: String,

    mesh_type: String,
    agroup: {type: mongoose.Schema.Types.ObjectId, ref: 'Hostgroup'}, 
    bgroup: {type: mongoose.Schema.Types.ObjectId, ref: 'Hostgroup'}, 

    center: {type: mongoose.Schema.Types.ObjectId, ref: 'Host'}, //only used for mesh_type == star
    nahosts: [ {type: mongoose.Schema.Types.ObjectId, ref: 'Host'} ], //let's not use hostgroup for this..

    testspec: {type: mongoose.Schema.Types.ObjectId, ref: 'Testspec'}, 

    enabled: {type: Boolean, default: true }, //should I keep this?
});

var configSchema = mongoose.Schema({
    url: { type: String, unique: true }, //url used by publish config
    desc: String,

    tests: [ testSchema ],

    admins: [ String ], //array of user ids (sub string in auth service)
    create_date: {type: Date, default: Date.now},
    update_date: {type: Date, default: Date.now},

});
exports.Config = mongoose.model('Config', configSchema);

