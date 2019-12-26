#!/usr/bin/node

'use strict';

const fs = require('fs');
const path = require('path');

//contrib
//const express = require('express');
//const bodyParser = require('body-parser');
const winston = require('winston');
const mongoose = require('mongoose');
//const expressWinston = require('express-winston');
//const compression = require('compression');

//mine
const config = require('../api/config'); // TODO: FIX!!!
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
//const common = require('../common');
const upgrade =  require('../api/pwa-db-upgrade');

//var collectionNames;
//var collections = {};

var has_archives_coll = false;

// connect to mongo and check collections
/*
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
        logger.warn("schema_revisions collection does not exist; assuming schema rev 10");

    }

}


const arrayToObject = (array, key) =>
   array.reduce((obj, item) => {
            obj[item[key]] = item
            return obj
          }, {});
*/
//db.init();
/*
db.init(function(err) {
            if(err) return cb(err);
console.log("db initialized", db);
});
console.log("db", db);
console.log("db.conn", db.conn);
*/

/*
db.conn.then( function( err, conn ) {
    conn.collectionNames( function( err2, names ) {
    logger.warn("names", names);

});
});
*/

/*
db.conn.listCollections()
    .next(function(err, collinfo) {
        if (collinfo) {
console.log("collinfo", collinfo);
            // The collection exists
        }
    });
*/

/*
db.collectionNames( function( err, names ) {
    logger.warn("names", names);

});
*/
