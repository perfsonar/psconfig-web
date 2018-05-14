
//contrib
var assert = require('assert');
var chai = require('chai');

//mine
var config = require('../api/config');
var importer = require('../api/admin/controllers/importer');
var fs = require('fs');

var save_output = false;

var testfiles = [];
testfiles.push( 'data/testbed.json' );
testfiles.push( 'data/testbed2-noarchives.json' );
testfiles.push( 'data/testbed3-nodescription.json' );
testfiles.push( 'data/testbed4-no_endpoint_description.json' );


function formatlog( obj ) {
    var out = JSON.stringify( obj, null, 3 );
    return out;
}

describe('import', function() {
    testfiles.forEach( function( testfile ) {
        //console.log("TESTFILE", testfile);

        it( testfile + ' import', function(done) {
            var sub = 1;
            var meshconfig;
            var testfile_expected = testfile + "-expected";
            //console.log("testfile_expected", testfile_expected);
            var testfile_out = testfile + "-out";
            var expected_output;
            var cb = function( err, tests, config_params) {
                //console.error("CALLBACK err, tests, config_params", err, tests, config_params);
                var results = {
                    err: err,
                    tests: tests,
                    config_params: config_params
                };

                if ( save_output ) {
                    fs.writeFile(testfile_out, JSON.stringify( results ), function (err) {
                        if (err) {
                            console.log("ERROR writing file", err);
                            throw err;
                        }
                        console.log('Saved!');
                    });
                }

                //console.log("RESULTS", formatlog( results ) );
                //console.log("EXPECTED_OUTPUT", formatlog( expected_output ) );
                //console.log("RESULTS\n", JSON.stringify( results ) );
                chai.expect( results ).to.deep.equal( expected_output );
                done();

            };
            fs.readFile(testfile_expected, 'utf8', function (err,data) {
                if (err) {
                    console.log("ERROR reading EXPECTED file", err);
                    return;
                }
                //console.log("EXPECTED DATA", data);
                expected_output = JSON.parse(data);
                //console.log("AFTER JSON PARSE", data);
                //console.error("expected output\n", JSON.stringify( expected_output, null, 3 ) );

            });


            fs.readFile(testfile, 'utf8', function (err,data) {
                if (err) {
                    console.log("ERROR reading file", err);
                    return;
                }
                //console.log(data);
                meshconfig = JSON.parse(data);
                //console.error("meshconfig before\n", JSON.stringify( meshconfig, null, 3 ) );
                importer._process_imported_config ( meshconfig, sub, cb, true );
                //console.log("meshconfig after\n", JSON.stringify( meshconfig, null, 3 ) );
            });


        });
    });
});
