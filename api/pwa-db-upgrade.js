#!/usr/bin/node
'use strict';

//const fs = require('fs');
const winston = require('winston');
//const mongoose = require('mongoose');
const async = require('async');
const request = require('request');
const assert = require('assert');
const urlLib = require('url');
const util = require('util');

//mine
const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
//const common = require('./common');
var collections = {};
var schemasObj = [];
//var exports = {};

logger.debug("CONFIG", JSON.stringify(config.datasource));

const minRevision = 10;
var newRev;
var curRev;
var revDesc;

// connect to mongo and check collections
/*
const conn = mongoose.createConnection(config.mongodb, {useNewUrlParser: true
        , useUnifiedTopology: true
        , useCreateIndex: true});
*
*/

db.init(function(err) {
    if(err) throw err;
    logger.info("connected to db IN UPGS");
    startProcessing(); //this start loop
//console.log("db", JSON.stringify( db.conn, null, 2 ));
        // test
        var rev = {
            revision: 314,
            description: "desc",
            collection_name: "asdf"
        };

/*
            var rec = new db.Schemarevision(rev);
            rec.save().then(function(err) {
                console.log("saved?");
                console.log("err", err);

            });
            db.Schemarevision.create(rev, function( err, record ) {
                console.log("created", record);
                console.log("created err", record);
                next();

            });
            */
       //return; 
        // end test
});


function startProcessing() {
    run();
}


//var conn = db.conn;



//conn.on('open', function () {

//startProcessing();

//});

function run() {

    //console.log("conn INSPECT", util.inspect( conn ) );
    console.log("db INSPECT", util.inspect( db ) );

    /*
    db.Host.find({'hostname': 'perfsonar-dev.grnoc.iu.edu'}, function( err, host ) {
        if ( err ) console.log("ERR", err);
        console.log("HOST", host);
    console.log("afterwards hmm");

    });
    */

   
  /*
    async.each( [ 
            function (cb) {
                console.log("TRYING FINDONE HOST");
                //console.log("db.Host.findOne", db.Host.findOne);
                db.Host.findOne({'hostname': 'perfsonar-dev.grnoc.iu.edu'}, function(err, host) {
                    console.log("err", err);
                    console.log("host", host);

                    if ( err ) {
                        console.log("Error retrieving hosts: ", err);
                        return cb(err);

                    }

                    cb();


                });

            }
        ], function(err) {
                console.log("ERRRRRRRRR", err);
                if ( err ) return err;

            });
            */
    //return; // TODO: REMOVE AFTER TESTING

        //get_current_schema_revision();
        async.series([ getCollections, get_current_schema_revision ], function(err, results) {
            if (err) {
                logger.error("ERROR: FAILED GETTING SCHEMA REVS", err);
                return err;
            }
            console.log("end of async series!");
            logger.debug("now in async series getting revision");
            schemasObj.push(schemas);
            logger.debug("schemas", JSON.stringify(schemas));
            //if (err) return err;
            //next();


        });
        //console.log("AFTER ASYNC SERIES");
};

function getCollections( cb ) {
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
        var colNames = Object.keys( collections );
        console.log("colNames", colNames);
        cb();


        if ( false ) {

        async.eachSeries( colNames, function( colName, next ) {
            var rev = {
                revision: newRev,
                description: revDesc,
                collection_name: colName

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
            db.Schemarevision.create(rev, function( err, record ) {
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
            if ( err ) console.log("error logging: ", err);
            
        });
        } // end IF false

    });


}

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
        newRev = minRevision;
        revDesc = "4.2.1";

    }

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
    return cb("error TODO: remove this!  get schema rev not working!");
    db.Schemarevision.find( options, function (err, schemaArr) {
        console.log("in find");
        logger.debug("ERR\n\nERR", err);
        console.log("schemaArr", schemaArr);
        logger.error("gettign schema rev");
        if (err) {
            logger.error("SCHEMA DB ERROR:", err);
            console.log("SCHEMA DB ERROR:", err);
            return cb(err);
        } else {
            console.log("schemaArr22", schemaArr);
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
