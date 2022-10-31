console.log("NOTE: db mca copied to pwa-test1");
//contrib
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
var chai = require("chai");
var chaiHttp = require("chai-http");

//mine
var config = require("./etc/config");
var publisher = require("../api/pub/meshconfig");
var fs = require("fs");
const fsp = require("fs/promises");
chai.use(deepEqualInAnyOrder);
chai.use(chaiHttp);

var testsObj = {
    throughput3: {
        expected_file: "throughput3-expected.json",
        description: "probe_type handling in throughput tests",
        expected_values: {
            "tests.throughput3.spec.schema": 2,
            "tests.throughput3.spec.single-ended": true,
            "tests.this little pingy.spec.schema": 3,
            "tests.lat4 444.spec.schema": 2,
            "tests.tput4 protocol udp probe_type tcp.spec.schema": 1,
            "tests.tput4 protocol udp probe_type tcp.spec.udp": true,
            "tests.throughput5.spec.schema": 1,
            "tests.throughput5.spec.udp": true,
            "archives.host-additional-archive0.data.schema": 1,
            "archives.host-additional-archive1.data.schema": 1,
            "archives.host-archive0.archiver": "esmond",
            "archives.host-archive0.data.schema": 1,
            "archives.host-archive0.data.url":
                "https://perfsonar-dev9.grnoc.iu.edu/esmond/perfsonar/archive",
            "archives.host-archive0.data.measurement-agent":
                "{% scheduled_by_address %}",
            "archives.host-archive1.data.schema": 1,
        },
        should_not_exist: ["tests.throughput3.spec.udp"],
    },
    "trace-udp": {
        expected_file: "trace_udp-expected.json",
        description: "probe_type handling in trace tests",
        expected_values: {
            "tests.tr1.spec.schema": 1,
            "tests.tr1.spec.probe-type": "udp",
        },
        should_not_exist: ["tests.tr1.spec.protocol", "tests.tr1.spec.udp"],
    },
};

function getValueStringPath(obj, path) {
    if (!path) return obj;
    const properties = path.split(".");
    return getValueStringPath(obj[properties.shift()], properties.join("."));
}

function check_expected_values(config, testName) {
    var expected_values = testsObj[testName].expected_values || {};
    var should_not_exist = testsObj[testName].should_not_exist || [];

    describe(testName + "certain values", function () {
        Object.keys(expected_values).forEach(function (key) {
            it(" matches specific values: " + key, function (done) {
                //console.log("key", key);
                var expected_val = expected_values[key];
                var received_val = getValueStringPath(config, key);
                //console.log("received val", received_val);
                chai.expect(received_val).to.equal(expected_val);
                done();
            });
        });

        should_not_exist.forEach(function (key) {
            it(key + " should *not* be set", function (done) {
                var keyArr = key.split(".");
                //console.log("config", JSON.stringify(config, null, 3));
                //console.log("keyArr", keyArr);
                var lastKey = keyArr.pop();
                var containerStr = keyArr.join(".");
                var obj = getValueStringPath(config, containerStr);
                done();
            });
        });
    });
}

function cleanup() {
    publisher.dbTest.disconnect();
}

describe("publisher", function () {
    Object.keys(testsObj).forEach(function (key) {
        var item = testsObj[key];
        let naem = key;
        let opts = {
            format: "psconfig",
        };
        var expected_output = {};
        var testfile_expected = item.expected_file;
        var desc = item.description;
        var resultsTest;

        it(
            desc + " " + " matches contentsof file: " + testfile_expected,
            function (done) {
                console.log("Description: ", desc);
                console.log("testfile_expected", testfile_expected);
                //var expected_output;
                fs.readFile(
                    "test/data/" + testfile_expected,
                    "utf8",
                    function (err, data) {
                        //console.log("err, data", err, data);
                        if (err) {
                            console.log("ERROR reading file", err);
                            return;
                        }
                        //console.log("file contents\n");
                        //console.log(data);
                        expected_output = JSON.parse(data);
                        //console.log("expected DATA\n", JSON.stringify( expected_output, null, 3));
                        //console.log("\nEND EXPECTED DATA\n");
                        //console.error("meshconfig before\n", JSON.stringify( meshconfig, null, 3 ) );
                        /*
                let opts = { 
                    "format": "psconfig"
                };
                */
                        //publisher._process_published_config ( meshconfig, opts, cb, "psconfig" );
                        //console.log("psconfig after\n", JSON.stringify( meshconfig, null, 3 ) );

                        var dbCB = function (err, results) {
                            //console.log("CALLBACK err, results", err, "\n");
                            //console.log(results);
                            //console.log("RESULTS !!!!\n", formatlog( results ) );
                            //console.log("RESULTS !!!!\n", JSON.stringify(results, null, 3) );
                            //console.log("RESULTS !!!!\n", JSON.stringify(results));
                            //console.log("ERRRR !!!!\n", err );
                            //var expected_output = {};
                            chai.expect(results).to.deep.equal(expected_output);
                            resultsTest = results;
                            //check_expected_values( results, naem );
                            if (naem == "throughput3") {
                                // ensure ""single-ended " iset on througphput 3
                                //chai.expect( results.tests.throughput3[ "spec" ][ "single-ended" ] ).to.equal(true);
                                // ensure schema is 2 for throughput3 since single-ended is enabled
                                //chai.expect( results.tests.throughput3[ "spec" ][ "schema" ] ).to.equal(2);
                                // ensure "udp" is not set for this test
                                //chai.expect( results.tests.throughput3[ "spec" ] ).to.not.have.property("udp");
                                // ensure that udp is enabled for this test
                                //chai.expect( results.tests["tput4 protocol udp probe_type tcp"][ "spec" ]["udp"]).to.equal(true);
                                // ensure that udp is enabled for this test
                                //chai.expect( results.tests["throughput5"][ "spec" ]["udp"]).to.equal(true);
                            }
                            done();
                            cleanup();
                            //nextTest();
                            //return nextTest(null, results);
                            //done();
                        };
                        publisher.get_config(naem, opts, dbCB, config);
                    }
                );
                //console.log("psconfig after\n", JSON.stringify( _config, null, 3 ) );
            }
        );
        it(" matches specific values: " + naem, function (done) {
            check_expected_values(resultsTest, naem);
            done();
        });
    });
    console.log("Got to end.");
    //nextTest();
    cleanup();
});

describe("John's Test", function () {
    let opn_all_expect;

    before(async function () {
        try {
            const opn_all_data = await fsp.readFile(
                "test/data/opn-all-expected.json"
            );
            opn_all_expect = JSON.parse(opn_all_data);
        } catch (err) {
            console.error("ERROR reading file: ", err);
        }
    });

    it("opn-all should match opn_all_expect", async function () {
        return await chai
            .request("http://grigutis-dev.grnoc.iu.edu/pwa")
            .get("/pub/config/opn-all")
            .then((res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body).to.deep.equalInAnyOrder(opn_all_expect);
            })
            .catch((err) => {
                throw err;
            });
    });
});
