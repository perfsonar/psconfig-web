#!/usr/bin/node
'use strict';

//const fs = require('fs');
const winston = require('winston');
//const mongoose = require('mongoose');
const async = require('async');
const request = require('request');
const assert = require('assert');
const util = require('util');

//mine
const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
const dbRevisions = require('../api/db-revisions');
//const common = require('./common');
var collections = {};
var schemasObj = [];
//var exports = {};

logger.debug("CONFIG", JSON.stringify(config.datasource));

const minRevision = 10;
var newRev = 30;
var curRev;
var revDesc;
var colNames = [];

//newRev = minRevision;

revDesc = "4.2.3";

// connect to mongo and check collections
/*
const conn = mongoose.createConnection(config.mongodb, {useNewUrlParser: true
        , useUnifiedTopology: true
        , useCreateIndex: true});
*
*/
var conn;

db.init(function(err) {
    if(err) throw err;
    conn = db.conn;
    dbRevisions.init(db);
    logger.info("connected to db IN UPGS");
        //console.log("CONN", conn);
        //console.log("DB", db);
        //conn.on('open', function () {

            startProcessing();

        //});
//    startProcessing(); //this start loop
//console.log("db", JSON.stringify( db.conn, null, 2 ));
        // test
        var rev = {
            revision: 314,
            description: "desc",
            collection_name: "asdf"
        };

});

/*
db.then(function() {
var conn = db.conn;
});
*/


//conn.on('open', function () {
/*
conn.on('open', function () {

    startProcessing();

});
*/

//startProcessing();

function startProcessing() {
    run();
}

function run() {

    //console.log("conn INSPECT", util.inspect( conn ) );
    //console.log("db INSPECT", util.inspect( db ) );

        var callbacks = [ getCollections, get_current_schema_revision, createSchemaRevision ];
        //var callbacks = [ getCollections, getHost ];
        //var callbacks = [ getHost ];
        async.series(callbacks, function(err, results) {
            console.log("IN SERIES ASYNC WITH MULT FUNCTIONS!!!");
            if (err) {
                logger.error("ERROR: FAILED GETTING SCHEMA REVS", err);
                return err;
            }
            console.log("end of async series!");
            console.log("curRev", curRev);
            console.log("newRev", newRev);
            console.log("revDesc", revDesc);
            //var schemas = results;
            //console.log("schemas", schemas);
            //schemasObj.push(schemas);
            //logger.debug("schemas", JSON.stringify(schemas));
            //if (err) return err;
            //next();
            db.disconnect();

        }, function(err) { 
            console.log("ERROR RETRIEVING HOST ETC", err);
        });
        console.log("AFTER ASYNC SERIES");
};

function getCollections( cb ) {
    //console.log("conn", conn);
    //console.log("db", db);
    db.conn.db.listCollections().toArray(function (err, collectionArr) {
        if (err) {
            console.error("ERROR!!!", err);
            return cb(err);
        }

        collections = arrayToObject(collectionArr, "name");
        //logger.debug("Connection open\n" + JSON.stringify(collections));
        console.log("COLLECTIONS: ");
        console.log(collections);
        checkCollections(collections);
        colNames = Object.keys( collections );
        console.log("colNames", colNames);
        cb();



    });


}

function checkCollections( collections ) {
    if ( "archives" in collections ) {
        logger.warn("archives collection exists");
    } else {
        logger.warn("archives collection does not exist");
    }

    if ( "schemarevisions" in collections ) {
        logger.warn("schemarevisions collection exists");

    } else {
        logger.warn("schemarevisions collection does not exist; assuming schema rev " + minRevision);
        newRev = minRevision;
        revDesc = "4.2.1";

    }

}

function getHost( cb ) {
    console.log("getting host!");
    var filter = {'hostname': 'perfsonar-dev.grnoc.iu.edu'};
    //var filter = {"lsid" : "atlas"};
    db.Host.find(filter, function(err, hostsRes) {
        if ( err ) {
            console.log("get host err", err);
            return cb(err);

        } else {
            //console.log("hostsRes", hostsRes);
            //logger.debug("HOSTSRes FROM DB:", hostsRes);
            async.eachSeries( hostsRes, function( host, nextHost ) {
                console.log("HOST", host);
                nextHost();

            }, function(err){
                console.log("after hosts");
                return cb();
            });
            
        }

    });
    //cb();


}

function createSchemaRevision( cbSchemaRev ) {
    if ( newRev == curRev ) {
        //console.log("Nothing would change (new rev is same as current rev)");
        //return cb();

    }

        async.eachSeries( colNames, function( colName, next ) {
            var rev = {
                revision: newRev,
                description: revDesc,
                //collection_name: colName

            // Something like this
            //var rec = new db.Host(host);
            //            rec.save(next);

            };

            console.log("rev", rev);
            //conn.createCollection("SchemaRevision");
            //db.Schemarevision.createCollection().then(function(collection) {
            //      console.log('Collection is created!', collection);
            //});

            //var rec = new db.Schemarevision(rev);
            //rec.save(next)
            /*.then(function(err) {
                console.log("saved?");
                console.log("err", err);

            });
            */
            //db.Schemarevision.create(rev, function( err, record ) { });
            db.Schemarevision.create( rev, function( err, record ) {
            //db.Schemarevision.updateOne({revision: newRev}, rev, function( err, record ) {
                console.log("created", record);
                console.log("created err", record);
                next();

            });
            //console.log("rec", rec);
            /*
            rec.save().then(function(asdf) {
                console.log("asdf", asdf);
                next();
            })
            ;*/
            //return;
            //next();
        }, function(err) {
            if ( err ) { 
                console.log("error logging: ", err);
                return cbSchemaRev(err);
            }
            cbSchemaRev();

        });

}

function get_current_schema_revision( cb ) {
    var currentRev;
    var options = {};
    console.log("in get schema rev");
    //console.log("db", db);
   // console.log("cb", cb);
    //console.log("db.SchemaRevision", db.SchemaRevision.find());
    //db.Config.find( options ).exec( function (err, schemaArr) {
    
    //TODO: figure out why this isn't happening
    //console.log("options", options);
    //return cb("error TODO: remove this!  get schema rev not working!");
    db.Schemarevision.find( options, function (err, schemaArr) {
        console.log("in find");
        logger.debug("ERR\n\nERR", err);
        console.log("schemaArr", schemaArr);
        console.log("gettign schema rev");
        if (err) {
            logger.error("SCHEMA DB ERROR:", err);
            console.log("SCHEMA DB ERROR:", err);
            return cb(err);
        } else {
            //console.log("schemaArr22", schemaArr);
            console.log("schemas", schemaArr);
            //logger.debug("CB()");
            if ( schemaArr.length == 0 ) {
                console.log("0 schema revs found!");

            }
            var schemObj = {};
            async.eachSeries( schemaArr, function( schema, nextSchema ) {
                console.log("schema", schema);
                schemasObj.push( schema );
                if ( ! ( schema.revision in schemObj ) ){
                    schemObj[ schema.revision ] = [];
                }
                schemObj[ schema.revision ].push( schema );
                nextSchema();

            }, function(err) {
                if ( err ) {
                    console.log("SCHEMA ERR", err);
                    return cb(err);

                }
                console.log("SCHERMASOBJ", schemasObj);
                console.log("SCHERMOBJ", schemObj);
                if ( Object.keys( schemObj ).length > 0 ) {
                    curRev = Object.keys(schemObj).reverse()[0];
                }
                console.log("curRev", curRev);
                cb();
                
            });
        //async.setImmediate(function() {
            //cb();
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
    console.log("after find schema rev");
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
