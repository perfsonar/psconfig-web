
//contrib
var request = require('supertest');
var assert = require('assert');
var jwt = require('jsonwebtoken');
var chai = require('chai');

//mine
var server = require('../admin/server');
var config = require('../config');

var user = jwt.decode(config.test.user_jwt);
var admin = jwt.decode(config.test.admin_jwt);

describe('rest', function() {
    describe('#testspecs', function () {
        /*
        it('check', function (done) {
            request(server.app)
            .get('/testspecs/check')
            .expect(200, {test: 'hello'}, done);
        });
        */
        var testspec = {
            desc: 'updated by admin',
            service_type: 'owamp',
            desc: 'this is a test - updated',
            specs: {
                test1: 'hello',
                test2: 'world',
                test3: 'another',
                test4: 'shouldn happen',
            },
            admins: [{sub: user.sub}],
        };

        it('add a test testspec', function (done) {
            request(server.app)
            .post('/testspecs')
            .send(testspec)
            .set('Authorization', 'Bearer '+config.test.user_jwt)
            /*
            .expect(function(res) {
                assert(res.body.status == 'ok');
            })
            */
            //.expect(200, {status: 'ok'})
            .end(function(err, res) {
                if(err) throw err;
                assert(res.body.status == 'ok');
                testspec.id = res.body.testspec.id;
                testspec.createdAt = res.body.testspec.createdAt;
                done();
            });
        });

        it('update a test testspec (remove user from admin list)', function (done) {
            testspec.admins = [];
            testspec.specs.test3 = "another";

            request(server.app)
            .put('/testspecs/'+testspec.id)
            .send(testspec)
            .set('Authorization', 'Bearer '+config.test.user_jwt)
            .expect(200, {status: 'ok'}, done)
        });

        it('try updating a test testspec that user does not have access - should 401', function (done) {
            request(server.app)
            .put('/testspecs/'+testspec.id)
            .send({
                desc: 'should 401',
            })
            .set('Authorization', 'Bearer '+config.test.user_jwt)
            .expect(401, done)
        });
        it('but it should let admin update', function(done) {
            request(server.app)
            .put('/testspecs/'+testspec.id)
            .send(testspec)
            .set('Authorization', 'Bearer '+config.test.admin_jwt)
            .expect(200, done)
        });
        it('get testspec', function(done) {
            request(server.app)
            .get('/testspecs/'+testspec.id)
            //.set('Authorization', 'Bearer '+config.test.admin_jwt)
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);
                assert(res.body.id = testspec.id);
                assert(res.body.desc  = testspec.desc);
                assert(res.body.service_type = testspec.service_type);
                assert.deepEqual(res.body.specs, testspec.specs);
                done();
            });
        });
        it('delete testspec (nonadmin - should 401)', function(done) {
            request(server.app)
            .delete('/testspecs/'+testspec.id)
            .set('Authorization', 'Bearer '+config.test.user_jwt)
            .expect(401, done)
        });
        it('delete testspec by admin', function(done) {
            request(server.app)
            .delete('/testspecs/'+testspec.id)
            .set('Authorization', 'Bearer '+config.test.admin_jwt)
            .expect(200, done)
        });
    });
});
