

//contrib
var request = require('supertest');
var assert = require('assert');

//mine
var db = require('../models');
var server = require('../server');

describe('testspecs', function() {
    describe('#rest', function () {
        /*
        it('check', function (done) {
            request(server.app)
            .get('/testspecs/check')
            .expect(200, {test: 'hello'}, done);
        });
        */
        it('listall testspecs', function (done) {
            request(server.app)
            .get('/testspecs')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);
                assert(res.body.length > 5, "too little testspecs");
                done();
            });
        });
    });
});
