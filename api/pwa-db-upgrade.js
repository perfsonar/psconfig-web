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
//const common = require('./common');
var collections = {};
var schemasObj = [];
//var exports = {};

logger.debug("CONFIG", JSON.stringify(config.datasource));

const minRevision = 1;
/*
db.init(function(err) {
    if(err) throw err;
    logger.info("connected to mongoose!");
    startProcessing(); //this starts the loop
});
*/
function startProcessing() {
    exports.runMongoose();
}

// connect to mongo and check collections
const conn = mongoose.createConnection(config.mongodb, {useNewUrlParser: true
        , useUnifiedTopology: true
        , useCreateIndex: true});

conn.on('open', function () {
    conn.db.listCollections().toArray(function (err, collectionArr) {
        if (err) {
            console.error("ERROR!!!", err);
            return;
        }
        collections = arrayToObject(collectionArr, "name");
        logger.debug("Connection open\n" + JSON.stringify(collections));
        console.log(collections);
        checkCollections(collections);

        //get_current_schema_revision(cb);
        /*
        var options = {};
    var res = db.Config.find( options ).exec(function (err, schemaArr) {
        console.log("configERR", err);
    });
    */
/*
        async.series([ get_current_schema_revision ], function(err) {
            if (err) {
                logger.error("ERROR: FAILED GETTING SCHEMA REVS", err);
                return err;
            }
            logger.debug("now in async series getting revision");
            schemasObj.push(schemas);
            logger.debug("schemas", JSON.stringify(schemas));
            //if (err) return err;
            //next();


        });
        */
        //get_current_schema_revision();
        //conn.close();
    });
        //get_current_schema_revision();
        async.series([ get_current_schema_revision ], function(err) {
            if (err) {
                logger.error("ERROR: FAILED GETTING SCHEMA REVS", err);
                return err;
            }
            logger.debug("now in async series getting revision");
            schemasObj.push(schemas);
            logger.debug("schemas", JSON.stringify(schemas));
            //if (err) return err;
            //next();


        });
});

function checkCollections( collections ) {
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


exports.runMongoose = function( cb ) {
    //get_current_schema_revision( cb );
};
function get_current_schema_revision( cb ) {
    var currentRev;
    var options = {};
    console.log("in get schema rev");
    console.log("db", db);
    console.log("cb", cb);
    //console.log("db.SchemaRevision", db.SchemaRevision.find());
    //db.Config.find( options ).exec( function (err, schemaArr) {
    
    //TODO: figure out why this isn't happening
    db.SchemaRevision.find( options ).exec( function (err, schemaArr) {
        console.log("in find");
        logger.debug("ERR\n\nERR", err);
        console.log("schemaArr", schemaArr);
        logger.error("gettign schema rev");
        if (err) {
            logger.error("SCHEMA DB ERROR:", err);
            return cb(err);
        } else {
            logger.warn("schemas", schemaArr);
            logger.debug("CB()");
        //async.setImmediate(function() {
            cb();
        //});
        }
    });
    /*
    var res2 = res.exec(function(err, docs) {
        console.log("docs", docs);
        console.log("err", err);
        cb();
    });
    */
    //console.log("res", res);
    //console.log("res2", res2);
        console.log("after find");
}

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
