
//contrib
var assert = require('assert');
var chai = require('chai');

//mine
var config = require('../api/config');
var importer = require('../api/admin/controllers/importer');
fs = require('fs');

//var testfile = 'data/testbed.json';
//var testfile = 'data/testbed2-noarchives.json';
var testfile = 'data/testbed3-nodescription.json';


function formatlog( obj ) {
    var out = JSON.stringify( obj, null, 3 );
    return out;
}

describe('import', function() {
    it('basic import', function(done) {
        var sub = 1;
        var meshconfig;
        var testfile_expected = testfile + "-expected";
        console.log("testfile_expected", testfile_expected);
        var testfile_out = testfile + "-out";
        var expected_output;
        var cb = function( err, tests, config_params) {
            //console.error("CALLBACK err, tests, config_params", err, tests, config_params);
            var results = {
                err: err,
                tests: tests,
                config_params: config_params
            };

            fs.writeFile(testfile_out, JSON.stringify( results ), function (err) {
                  if (err) {
                      console.log("ERROR writing file", err);
                      throw err;
                  }
                  console.log('Saved!');
            });

            console.log("RESULTS", formatlog( results ) );
            //console.log("RESULTS\n", JSON.stringify( results ) );
            chai.expect( results ).to.deep.equal( expected_output );
            done();

        };
        fs.readFile(testfile_expected, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            //console.log("EXPECTED DATA", data);
            expected_output = JSON.parse(data);
            console.error("expected output\n", JSON.stringify( expected_output, null, 3 ) );

        });


        fs.readFile(testfile, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            //console.log(data);
            meshconfig = JSON.parse(data);
            //console.error("meshconfig before\n", JSON.stringify( meshconfig, null, 3 ) );
            importer._process_imported_config ( meshconfig, sub, cb, true );
            //console.log("meshconfig after\n", JSON.stringify( meshconfig, null, 3 ) );
        });


    });
    /*
    describe('#hostgroup', function () {
        it('simple', function(done) {
            filter.resolveHostGroup("if(service.location.state == 'CA') return true;", "owamp", function(err, res) {
                if(err) done(err);
                console.dir(res);
                chai.expect(res).to.deep.equal({ 
                    recs: [ '90248b61-8789-41c1-aba9-1a60e7df0894.owamp',
                        'ef858107-85cf-4876-a062-af63ea718969.owamp',
                        'c0d25ad7-6cfe-4de5-9c36-20c43d952efd.owamp' ],
                    c: [] 
                });
                done();
            });
        });
        it('should raise RefernceError', function(done) {
            filter.resolveHostGroup("hoge", "owamp", function(err, res) {
                chai.expect(err).to.equal('ReferenceError: hoge is not defined');
                done();
            });
        });
        it('should raise user Error', function(done) {
            filter.resolveHostGroup("throw new Error('error');", "owamp", function(err, res) {
                chai.expect(err.toString()).to.equal('Error: error');
                done();
            });
        });
    });
    */
});
