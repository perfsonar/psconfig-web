var assert = require("assert");

var db = require('../models');

describe('models', function() {
    var admins = [];
    describe('#Admin', function () {
        it('create/find admin test1', function (done) {
            db.Admin.create({user_id: "test1"}).then(function(new_a) {
                db.Admin.findOne({where: {user_id: new_a.user_id}}).then(function(a) {
                    admins.push(a);
                    if(a) done();
                    else done(new Error("couldn't create admin test1"));
                });
            });
        });
        it('create/find admin test2', function (done) {
            db.Admin.create({user_id: "test2"}).then(function(new_a) {
                db.Admin.findOne({where: {user_id: new_a.user_id}}).then(function(a) {
                    admins.push(a);
                    if(a) done();
                    else done(new Error("couldn't create admin test2"));
                });
            });
        });
    });
    describe('#Hostgroup', function () {
        var test_hostgroup = null
        it('create/find hostgroup', function (done) {
            db.Hostgroup.create({service_type: "test_service", hosts: ["host1", "host2","host3"]}).then(function(new_h) {
                db.Hostgroup.findOne({where: {id: new_h.id}}).then(function(h) {
                    test_hostgroup = h;
                    if(h) {
                        done();
                    }
                    else done(new Error("couldn't find hostgroup 1"));
                });
            });
        });
        it('adding hostgroup / admin relation', function (done) {
            test_hostgroup.setAdmins(admins).then(function() {
                test_hostgroup.getAdmins().then(function(admins) {
                    for(var i in admins) {
                        console.log(admins[i].user_id);
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
    });

    describe('#cleanup', function () {
        it('remove hostgroups', function (done) {
            db.Hostgroup.destroy({where: {service_type: "test_service"}}).then(function(i) {
                if(i == 1) done();
                else done(new Error("couldn't destroy exactly 1 test host group.. got "+i));
            });
        });
        it('remove test admin1', function (done) {
            db.Admin.destroy({where: {user_id: "test1"}}).then(function(i) {
                if(i == 1) done();
                else done(new Error("couldn't destroy exactly 1 test admin"));
            });
        });
        it('remove test admin2', function (done) {
            db.Admin.destroy({where: {user_id: "test2"}}).then(function(i) {
                if(i == 1) done();
                else done(new Error("couldn't destroy exactly 1 test admin"));
            });
        });
    });
});
