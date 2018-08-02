
//contrib
var assert = require('assert');
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
var chai = require('chai');
chai.use(deepEqualInAnyOrder);

//mine
var config = require('../api/config');
var fs = require('fs');

var save_output = false;

var path = 'manual-tests/';

var testfiles = [];
testfiles.push( { before: 'owamp-master-ma.json', after: 'owamp-branch-ma.json' });
testfiles.push( { before: 'owamp-pscheduler-master-ma.json', after: 'owamp-pscheduler-branch-ma.json' });
testfiles.push( { before: 'nightly-before-ma-fixes-psconfig.json', after: 'nightly-after-ma-fixes-psconfig.json' } );

testfiles.push( { before: 'nightly-before-ma-fixes.json', after: 'nightly-after-ma-fixes.json' } );



function formatlog( obj ) {
    var out = JSON.stringify( obj, null, 3 );
    return out;
}

describe('manual', function() {
    testfiles.forEach( function( testfile ) {
        var before = testfile.before;
        var after = testfile.after;
        //console.log("TESTFILE", testfile);
        var output_after;

        it( 'checks manually ' + before, function(done) {
            var output_before;
            fs.readFile(path + before, 'utf8', function (err,data) {
                if (err) {
                    console.log("ERROR reading EXPECTED file", err);
                    return;
                }
                //console.log("EXPECTED DATA", data);
                output_before = JSON.parse(data);
                //console.log("AFTER JSON PARSE", data);
                //console.error("expected output\n", JSON.stringify( output_before, null, 3 ) );

            });


            fs.readFile(path + after, 'utf8', function (err,data) {
                if (err) {
                    console.log("ERROR reading file", err);
                    return;
                }
                //console.log(data);
                output_after = JSON.parse(data);
                chai.expect( output_after ).to.deep.equalInAnyOrder( output_before );
                //chai.expect( output_after ).to.deep.equal( output_before );
                done();
                //console.error("meshconfig before\n", JSON.stringify( meshconfig, null, 3 ) );
                //importer._process_imported_config ( meshconfig, sub, cb, true );
                //console.log("meshconfig after\n", JSON.stringify( meshconfig, null, 3 ) );
            });


        });
    });
});
