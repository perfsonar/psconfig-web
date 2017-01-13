
//contrib
var assert = require('assert');
var chai = require('chai');

//mine
var config = require('../api/config');
var filter = require('../api/common').filter;

describe('filter', function() {
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
});
