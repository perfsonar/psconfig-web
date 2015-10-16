var assert = require("assert");

var db = require('../models');

describe('models', function() {
    var testspec = null;
    var admins = [];
    var t1 = null;
    describe('#test data', function () {
        it('create test1', function (done) {
            db.Test.create({desc: "test1", service_type: "owamp", mesh_type: "mesh"}).then(function(_t1) {
                t1 = _t1;
                db.Test.findOne({where: {desc: "test1"}}).then(function(a) {
                    if(a) done();
                    else done(new Error("couldn't create config1"));
                });
            });
        });
        it('create config1', function (done) {
            db.Config.create({desc: "config4", url: "test-configr4", admins: []}).then(function(new_a) {
                db.Config.findOne({where: {desc: "config4"}}).then(function(a) {
                    if(a) done();
                    else done(new Error("couldn't create config1"));
                });
            });
        });
        it('add test1 to config1', function (done) {
            db.Config.findOne({where: {desc: "config4"}}).then(function(c) {
                c.addTest(t1).then(function() {
                    done();
                });
            });
        });
        /*
        it('create/find admin test2', function (done) {
            db.Admin.create({sub: "test2"}).then(function(new_a) {
                db.Admin.findOne({where: {sub: new_a.sub}}).then(function(a) {
                    admins.push(a);
                    if(a) done();
                    else done(new Error("couldn't create admin test2"));
                });
            });
        });

        //permanent test data
        var pa;
        it('create/find admin', function (done) {
            db.Admin.create({sub: "1"}).then(function(_a) {
                db.Admin.findOne({where: {sub: _a.sub}}).then(function(a) {
                    pa = a;
                    done();
                });
            });
        });
        it('create testspec2', function (done) {
            db.Testspec.create({service_type: "bwctl", specs: {some: 'value', another: 'stuff'}}).then(function(new_t) {
                new_t.setAdmins([pa]).then(function() {
                    done();
                });
            });
        });
        it('create testspec2', function (done) {
            db.Testspec.create({service_type: "bwctl", specs: {some: 'value2', another: 'stuff2'}}).then(function(new_t) {
                new_t.setAdmins([pa]).then(function() {
                    done();
                });
            });
        });
        */
        it('create testspec', function (done) {
            db.Testspec.create({desc: "testspec 1", service_type: "bwctl", specs: {some: 'value', another: 'stuff'}, admins: ["1", "2"]}).then(function(new_t) {
                if(new_t) done();
            });
        });
        it('create testspec', function (done) {
            db.Testspec.create({desc: "testspec 2", service_type: "bwctl", specs: {some: 'value', another: 'stuff2'}, admins: ["1"]}).then(function(new_t) {
                if(new_t) done();
            });
        });
    });
    describe('#Hostgroup', function () {
        var test_hostgroup = null
        it('create/find hostgroup', function (done) {
            db.Hostgroup.create({service_type: "test", hosts: ["host1", "host2","host3"]}).then(function(new_h) {
                db.Hostgroup.findOne({where: {id: new_h.id}}).then(function(h) {
                    test_hostgroup = h;
                    if(h) {
                        done();
                    }
                    else done(new Error("couldn't find hostgroup 1"));
                });
            });
        });
        /*
        it('adding hostgroup / admin relation', function (done) {
            test_hostgroup.setAdmins(admins).then(function() {
                test_hostgroup.getAdmins().then(function(admins) {
                    for(var i in admins) {
                        console.log(admins[i].sub);
                    }
                    console.log("added admin");
                    done();
                });
            });
        });
        it('trying hasAdmin', function(done) {
            test_hostgroup.hasAdmins([admins[0]]).then(function(res) {
                if(res == true) done();
                else done(new Error("couldn't find admin relationship"));
            });
        });
        */
    });
    describe('#testspecs', function () {
        it('create/find testspecs', function (done) {
            db.Testspec.create({service_type: "test", specs: {some: 'value', another: 'stuff'}}).then(function(new_t) {
                db.Testspec.findOne({where: {id: new_t.id}}).then(function(_testspec) {
                    //_testspec.setAdmins(admins).then(function() {
                    testspec = _testspec;
                    if(testspec) {
                        assert.deepEqual(testspec.specs, {some: 'value', another: 'stuff'});
                        done();
                    } else done(new Error("couldn't find testspec with id:"+new_t.id));
                    //);
                });
            });
        });
    });

    describe('#cleanup', function () {
        it('remove hostgroups', function (done) {
            db.Hostgroup.destroy({where: {service_type: "test"}}).then(function(i) {
                if(i == 1) done();
                else done(new Error("couldn't destroy exactly 1 test host group.. got "+i));
            });
        });
        /*
        it('remove test admin1', function (done) {
            db.Admin.destroy({where: {sub: "test1"}}).then(function(i) {
                if(i == 1) done();
                else done(new Error("couldn't destroy exactly 1 test admin"));
            });
        });
        it('remove test admin2', function (done) {
            db.Admin.destroy({where: {sub: "test2"}}).then(function(i) {
                if(i == 1) done();
                else done(new Error("couldn't destroy exactly 1 test admin"));
            });
        });
        */
        it('remove testspec', function (done) {
            db.Testspec.destroy({where: {id: testspec.id}}).then(function(i) {
                if(i == 1) done();
                else done(new Error("couldn't destroy exactly 1 testspec"));
            });
        });
    });
});
