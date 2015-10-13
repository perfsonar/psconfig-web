
//contrib
var request = require('supertest');
var assert = require("assert");

//mine
var db = require('../models');
var server = require('../server');

describe('rest', function() {
    describe('#services', function () {
        this.timeout(1000*10);
        it('services cache refresh', function (done) {
            request(server.app)
            .post('/services/cache')
            .expect(200, {status: 'ok'}, done);
        });
    });
});
