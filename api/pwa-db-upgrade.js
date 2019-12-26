#!/usr/bin/node
'use strict';

const fs = require('fs');
const winston = require('winston');
const mongoose = require('mongoose');
const async = require('async');
const request = require('request');
const assert = require('assert');
const urlLib = require('url');

//mine
const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');
///const common = require('./common');
var collections = {};
var exports = {};

logger.debug("CONFIG", JSON.stringify(config.datasource, null, 4));

const minRevision = 1;

/*
db.init(function(err) {
    if(err) throw err;
    logger.info("connected to db");
    startProcessing(); //this starts the loop
});

function startProcessing() {
    exports.run();
}
*/

// connect to mongo and check collections
const conn = mongoose.createConnection(config.mongodb, {useNewUrlParser: true
        , useUnifiedTopology: true
        , useCreateIndex: true});

conn.on('open', function () {
    conn.db.listCollections().toArray(function (err, collectionArr) {
        if (err) {
            console.log(err);
            return;
        }
        collections = arrayToObject(collectionArr, "name");
        console.log(collections);
        checkCollections(collections);
        exports.get_current_schema_revision();
        conn.close();
    });
});

const checkCollections = function( collections ) {
    if ( "archives" in collections ) {
        logger.warn("archives collection exists");
    } else {
        logger.warn("archives collection does not exist");
    }

    if ( "schema_revisions" in collections ) {
        logger.warn("schema_revisions collection exists");

    } else {
        logger.warn("schema_revisions collection does not exist; assuming schema rev " + minRevision);

    }

}

exports.get_current_schema_revision = function() {
    var currentRev;
    var schemas = db.schema_revisions.find();
    logger.warn("schemas", schemas);
};

exports.get_min_schema_revision = function() {
    var minRev;


};

const arrayToObject = (array, key) =>
    array.reduce((obj, item) => {
        obj[item[key]] = item
        return obj
    },
{});

/*
exports.run = function run() {
    logger.debug("in RUN()");
    db.listCollections();

};
*/
