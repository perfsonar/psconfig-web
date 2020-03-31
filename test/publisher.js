console.log("NOTE: db mca copied to pwa-test1");
//contrib
var assert = require('assert');
var chai = require('chai');

//mine
var config = require('./etc/config');
var publisher = require('../api/pub/meshconfig');
const winston = require('winston');
const logger = new winston.Logger(config.logger.winston);
fs = require('fs');

var interimfiles = [];
//interimfiles.push( 'data/publisher1-multi-mas.json-expected' );
interimfiles.push( 'publisher1-multi-mas.json-interim-filled-in-hostgroups');
var testfiles = [];
//testfiles.push( 'data/publisher1-multi-mas.json-interim' );
//testfiles.push( 'data/publisher1-multi-mas.json-expected' );
testfiles.push( 'publisher1-multi-mas.json-expected-filled-in-hostgroups');


function formatlog( obj ) {
    var out = JSON.stringify( obj, null, 3 );
    return out;
}

const FILEZ = false;

describe('publisher', function() {
    let naem = "throughput3";
                let opts = { 
                    "format": "psconfig"
                };
            var cb = function( err, results ) {
                console.log("CALLBACK err, results", err, results);
                //console.log("RESULTS !!!!\n", formatlog( results ) );
                console.log("RESULTS !!!!\n", JSON.stringify(results) );
                console.log("ERRRR !!!!\n", err );
                var expected_output = {};
                //chai.expect( results ).to.deep.equal( expected_output );
                //done();
            };
            var _config = publisher.get_config( naem, opts, cb );
                //publisher._process_published_config ( naem, opts, cb, "psconfig" );
                console.log("psconfig after\n", JSON.stringify( _config, null, 3 ) );
        if ( FILEZ ) {
    testfiles.forEach( function( testfile ) {
        testfile = "publisher1-multi-mas.json-interim-filled-in-hostgroups";
        console.log("TESTFILE", testfile);

        it( testfile + ' publish', function(done) {
            var sub = 1;
            var meshconfig;
            //var testfile_expected = testfile.replace("-expected", "-interim"); // + "-expected";
            //var testfile_expected = testfile.replace("-interim", "-expected"); // + "-expected";
            var testfile_expected = 'publisher1-multi-mas.json-expected-filled-in-hostgroups';

            console.log("testfile_expected", testfile_expected);
            console.log("testfile", testfile);
            var testfile_out = testfile + "-out";
            var expected_output;
            var cb = function( err, tests, config_params) {
                //console.error("CALLBACK err, tests, config_params", err, tests, config_params);
                var results = {
                    err: err,
                    tests: tests,
                    config_params: config_params
                };

                console.log("RESULTS !!!!\n", formatlog( results ) );
/*
                fs.writeFile(testfile_out, JSON.stringify( results ), function (err) {
                      if (err) {
                          console.log("ERROR writing file", err);
                          throw err;
                      }
                      console.log('Saved!');
                });
*/
                //console.log("RESULTS", formatlog( results ) );
                //console.log("EXPECTED_OUTPUT", formatlog( expected_output ) );
                //console.log("RESULTS\n", JSON.stringify( results ) );
                chai.expect( results ).to.deep.equal( expected_output );
                done();

            };
            fs.readFile("data/" + testfile_expected, 'utf8', function (err,data) {
                if (err) {
                    console.log("ERROR reading EXPECTED file", err);
                    return;
                }
                //console.log("EXPECTED DATA", data);
                expected_output = JSON.parse(data);
                //console.log("AFTER JSON PARSE", data);
                //console.error("expected output\n", JSON.stringify( expected_output, null, 3 ) );

            });


            fs.readFile("data/" + testfile, 'utf8', function (err,data) {
                if (err) {
                    console.log("ERROR reading file", err);
                    return;
                }
                console.log("DATA", data);
                meshconfig = JSON.parse(data);
                //console.error("meshconfig before\n", JSON.stringify( meshconfig, null, 3 ) );
                let opts = { 
                    "format": "psconfig"
                };
                publisher._process_published_config ( meshconfig, opts, cb, "psconfig" );
                console.log("psconfig after\n", JSON.stringify( meshconfig, null, 3 ) );
            });


        });
    });
        }
});
