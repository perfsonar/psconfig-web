console.log("NOTE: db mca copied to pwa-test1");
//contrib
var assert = require('assert');
var chai = require('chai');

//mine
var config = require('./etc/config');
var publisher = require('../api/pub/meshconfig');
const winston = require('winston');
const logger = new winston.Logger(config.logger.winston);
const async = require('async');
fs = require('fs');

var interimfiles = [];
//interimfiles.push( 'data/publisher1-multi-mas.json-expected' );
interimfiles.push( 'publisher1-multi-mas.json-interim-filled-in-hostgroups');
var testfiles = [];
//testfiles.push( 'data/publisher1-multi-mas.json-interim' );
//testfiles.push( 'data/publisher1-multi-mas.json-expected' );
testfiles.push( 'publisher1-multi-mas.json-expected-filled-in-hostgroups');

var expectedfiles = [];
expectedfiles.push( "throughput3-1_expected.json" );
//expectedfiles.push( "throughput3-2_expected2_shouldmatch.json" );
function formatlog( obj ) {
    var out = JSON.stringify( obj, null, 3 );
    return out;
}

var testsObj = {
    "throughput3": {
        expected_file: "throughput3-2_expected2_shouldmatch.json",
        description: "checks for probe_type handling in throughput tests"
    },
    "trace-udp": {
        expected_file: "trace_udp-expected.json",
        description: "checks for probe_type handling in trace tests"

    }


};

const FILEZ = false;

function cleanup() {
    publisher.dbTest.disconnect();

}

describe('publisher', function() {
    //async.eachOfSeries( testsObj, function( item, key, nextTest ) {}
    Object.keys(testsObj).forEach( function( key ) {
        var item = testsObj[ key ];
        //let naem = "throughput3";
        let naem = key;
        let opts = { 
            "format": "psconfig"
        };
        var expected_output = {};
        //var testfile_expected = expectedfiles[0];
        var testfile_expected = item.expected_file;
        var desc = item.description;

        it( testfile_expected + ' publish', function(done) {
            console.log("Description: ", desc);
            console.log("testfile_expected", testfile_expected);
            //var expected_output;
            fs.readFile("data/" + testfile_expected, 'utf8', function (err,data) {
                //console.log("err, data", err, data);
                if (err) {
                    console.log("ERROR reading file", err);
                    return;
                }
                //console.log("file contents", data);
                expected_output = JSON.parse(data);
                //console.log("expected DATA\n", JSON.stringify( expected_output, null, 3));
                //console.log("\nEND EXPECTED DATA\n");
                //console.error("meshconfig before\n", JSON.stringify( meshconfig, null, 3 ) );
                let opts = { 
                    "format": "psconfig"
                };
                //publisher._process_published_config ( meshconfig, opts, cb, "psconfig" );
                //console.log("psconfig after\n", JSON.stringify( meshconfig, null, 3 ) );


                var dbCB = function( err, results ) {
                    //console.log("CALLBACK err, results", err, results);
                    //console.log("RESULTS !!!!\n", formatlog( results ) );
                    //console.log("RESULTS !!!!\n", JSON.stringify(results, null, 3) );
                    //console.log("RESULTS !!!!\n", JSON.stringify(results));
                    //console.log("ERRRR !!!!\n", err );
                    //var expected_output = {};
                    chai.expect( results ).to.deep.equal( expected_output ); //TODO: this sorta works
                    done();
                    cleanup();
                    //nextTest();
                    //return nextTest(null, results);
                    //done();
                };
                publisher.get_config( naem, opts, dbCB, config );
            });
            //console.log("psconfig after\n", JSON.stringify( _config, null, 3 ) );

        });
    }, function( finalErr ) {
        console.log("Got to end. Err?", finalErr);
        //nextTest();
        cleanup();
    });
        

            });
