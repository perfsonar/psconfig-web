//contrib
const request = require("supertest");
const assert = require("assert");
const jwt = require("jsonwebtoken");
const chai = require("chai");

//mine
const server = require("../api/admin/server");
const config = require("../api/config");
const db = require("../api/models");

const user = jwt.decode(config.test.user_jwt);
const admin = jwt.decode(config.test.admin_jwt);

describe("admin", function () {
    before(function (done) {
        db.init(done);
    });

    it("return 200", function (done) {
        request(server.app)
            .get("/health")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .end(function (err, res) {
                if (err) throw err;
                assert(res.body.status == "ok", "status is not ok");
                done();
            });
    });

    describe("#testspecs", function () {
        var testspec = {
            service_type: "owamp",
            desc: "updated by admin",
            specs: {
                test1: "hello",
                test2: "world",
                test3: "another",
                test4: "shouldn happen",
            },
            admins: [user.sub],
        };

        it("add a testspec", function (done) {
            request(server.app)
                .post("/testspecs")
                .send(testspec)
                .set("Authorization", "Bearer " + config.test.user_jwt)
                .expect(200)
                .end(function (err, res) {
                    if (err) throw err;
                    assert(res.body.desc == testspec.desc);
                    testspec._id = res.body._id;
                    testspec.create_date = res.body.create_date;
                    done();
                });
        });

        it("update a test testspec (remove user from admin list)", function (done) {
            testspec.admins = [];
            testspec.specs.test3 = "another";

            request(server.app)
                .put("/testspecs/" + testspec.id)
                .send(testspec)
                .set("Authorization", "Bearer " + config.test.user_jwt)
                .expect(200, { status: "ok" }, done);
        });

        it("try updating a test testspec that user does not have access - should 401", function (done) {
            request(server.app)
                .put("/testspecs/" + testspec.id)
                .send({
                    desc: "should 401",
                })
                .set("Authorization", "Bearer " + config.test.user_jwt)
                .expect(401, done);
        });
        it("but it should let admin update", function (done) {
            request(server.app)
                .put("/testspecs/" + testspec.id)
                .send(testspec)
                .set("Authorization", "Bearer " + config.test.admin_jwt)
                .expect(200, done);
        });
        it("get testspec", function (done) {
            request(server.app)
                .get("/testspecs/" + testspec.id)
                //.set('Authorization', 'Bearer '+config.test.admin_jwt)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    assert((res.body.id = testspec.id));
                    assert((res.body.desc = testspec.desc));
                    assert((res.body.service_type = testspec.service_type));
                    assert.deepEqual(res.body.specs, testspec.specs);
                    done();
                });
        });
        it("delete testspec (nonadmin - should 401)", function (done) {
            request(server.app)
                .delete("/testspecs/" + testspec.id)
                .set("Authorization", "Bearer " + config.test.user_jwt)
                .expect(401, done);
        });
        it("delete testspec by admin", function (done) {
            request(server.app)
                .delete("/testspecs/" + testspec.id)
                .set("Authorization", "Bearer " + config.test.admin_jwt)
                .expect(200, done);
        });
    });
});
