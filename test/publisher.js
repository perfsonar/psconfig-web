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

function formatlog( obj ) {
    var out = JSON.stringify( obj, null, 3 );
    return out;
}

var testsObj = {
    "throughput3": {
        expected_file: "throughput3-expected.json",
        description: "probe_type handling in throughput tests"
    },
    "trace-udp": {
        expected_file: "trace_udp-expected.json",
        description: "probe_type handling in trace tests"

    }


};


function cleanup() {
    publisher.dbTest.disconnect();

}

describe('publisher', function() {
    Object.keys(testsObj).forEach( function( key ) {
        var item = testsObj[ key ];
        let naem = key;
        let opts = { 
            "format": "psconfig"
        };
        var expected_output = {};
        var testfile_expected = item.expected_file;
        var desc = item.description;

        it( desc + " " + " matches contentsof file: " + testfile_expected, function(done) {
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
                /*
                let opts = { 
                    "format": "psconfig"
                };
                */
                //publisher._process_published_config ( meshconfig, opts, cb, "psconfig" );
                //console.log("psconfig after\n", JSON.stringify( meshconfig, null, 3 ) );


                var dbCB = function( err, results ) {
                    //console.log("CALLBACK err, results", err, results);
                    //console.log("RESULTS !!!!\n", formatlog( results ) );
                    //console.log("RESULTS !!!!\n", JSON.stringify(results, null, 3) );
                    //console.log("RESULTS !!!!\n", JSON.stringify(results));
                    //console.log("ERRRR !!!!\n", err );
                    //var expected_output = {};
                    chai.expect( results ).to.deep.equal( expected_output );
                    if ( naem == "throughput3" ) {
                        // ensure ""single-ended " iset on througphput 3
                        chai.expect( results.tests.throughput3[ "spec" ][ "single-ended" ] ).to.equal(true);
                        // ensure schema is 2 for throughput3 since single-ended is enabled
                        chai.expect( results.tests.throughput3[ "spec" ][ "schema" ] ).to.equal(2);
                        // ensure "udp" is not set for this test
                        chai.expect( results.tests.throughput3[ "spec" ] ).to.not.have.property("udp");
                        // ensure that udp is enabled for this test
                        chai.expect( results.tests["tput4 protocol udp probe_type tcp"][ "spec" ]["udp"]).to.equal(true);
                        // ensure that udp is enabled for this test
                        chai.expect( results.tests["throughput5"][ "spec" ]["udp"]).to.equal(true);

                    }
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
    });
        console.log("Got to end.");
        //nextTest();
        cleanup();
        

            });
