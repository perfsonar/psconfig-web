#!/usr/bin/node
"use strict";

const fs = require("fs");
const dns = require("dns");
const net = require("net");
const winston = require("winston");
const async = require("async");
const request = require("request");
const assert = require("assert");
const urlLib = require("url");

//mine
const config = require("./config");
const logger = new winston.Logger(config.logger.winston);
const db = require("./models");
const common = require("./common");

var save_output = false;
var lsHostArr = [];
var lsQueried = {};
var hostgroupsArr = [];
var hostgroupLookup = {};
var updatedLookup = {};

logger.debug("CONFIG", JSON.stringify(config.datasource, null, 4));
/*
 * If you want to query for specific hosts you can enter key-value pairs like this
 * By default we query all hosts
var hostsToQuery = [
{
    //"host-name": "psb.hpc.utfsm.cl",
    //"client-uuid": "58daadb8-4382-489e-ba91-39e1784ba940",

}];
*/
var hostsToQuery = [];

db.init(function (err) {
    if (err) throw err;
    logger.info("connected to db");
    startProcessing(); //this starts the loop
});

function startProcessing() {
    exports.run();
}

logger.debug("hostsToQuery (empty means all)", hostsToQuery);
var hosts = [];

exports.run = function run() {
    var host_results = [];
    async.series(
        [getHostgroups, expireStaleRecords],

        function (err) {
            //This function gets called after the two tasks have called their "task callbacks"
            if (err) return err;
            async.eachOfSeries(
                config.datasource.lses,
                function (service, id, next) {
                    logger.info(
                        "processing datasource for expiration/duplication prevention:" +
                            id,
                        "................................................................................"
                    );
                    logger.info("lookup service", service);
                    switch (service.type) {
                        case "sls":
                            var newLSResults = getHostsFromLS(
                                host_results,
                                hostsToQuery,
                                service,
                                id,
                                next
                            );
                            host_results.concat(newLSResults);
                            break;
                        case "global-sls":
                            var newLSResults = getHostsFromGlobalLS(
                                host_results,
                                hostsToQuery,
                                service,
                                id,
                                next
                            );
                            host_results.concat(newLSResults);
                            break;
                        default:
                            logger.error(
                                "unknown datasource/service type:" +
                                    service.type
                            );
                    }
                },
                function (err) {
                    if (err) logger.error(err);
                    if (save_output) {
                        fs.writeFile(
                            "lsHostArr.json",
                            JSON.stringify(lsHostArr),
                            function (err) {
                                if (err) {
                                    logger.error("ERROR writing file", err);
                                    throw err;
                                }
                                logger.info("Saved!");
                            }
                        );
                    }
                    logger.info("num result", lsHostArr.length);

                    async.series(
                        [getHostsFromDb, updateDbHostsWithLsRecords],
                        function (err) {
                            if (err) {
                                logger.error(
                                    "ERROR: FAILED GETTING/UPDATING DB HOSTS",
                                    err
                                );
                                return err;
                            }
                        }
                    );
                }
            );
        }
    );
};

function getHostsFromDb(callback) {
    // retrieve the host record from the local db
    var options = {};
    if (hostsToQuery.length == 0) {
    } else {
        for (var i in hostsToQuery) {
            var hostFilter = hostsToQuery[i];
            for (var key in hostFilter) {
                var val = hostFilter[key];
                key = key.replace("client-uuid", "uuid");
                key = key.replace("host-name", "hostname");
                options[key] = val;
            }
        }
    }

    db.Host.find(options, function (err, hostsRes) {
        if (err) {
        } else {
            hosts = hostsRes;
            logger.debug("HOSTS FROM DB:", hosts.length);
            async.setImmediate(function () {
                callback();
            });
        }
    });
}

function updateDbHostsWithLsRecords(callback) {
    if (typeof hosts == "undefined" || hosts.length < 1) {
        logger.warn(
            "Can't update hosts with ls records; no hosts specified",
            hosts
        );
        return hosts;
    }

    var hostsDelete = [];
    var hostsUpdate = [];

    async.eachSeries(
        hosts,
        function (host, nextDbHost) {
            var lsHosts = getHostFromLsArr(host.uuid);
            if (lsHosts.length == 0) {
                async.setImmediate(function () {
                    nextDbHost();
                });
            } else {
                // loop over ls hosts
                async.eachSeries(
                    lsHosts,
                    function (lsHost, lsCb) {
                        if (host._id in updatedLookup) {
                            var fakeErr = new Error();
                            fakeErr.break = true;
                            //async.setImmediate(function() {
                            return lsCb(fakeErr);
                            //});
                        }
                        var lsUrl = lsHost._url_full;
                        //console.log("lsUrl for host ", lsUrl);
                        if (sameHost(host, lsHost)) {
                            if (host.url == lsUrl) {
                                //console.log("URLs ALREADY EQUAL; not updating;");
                                async.setImmediate(function () {
                                    var fakeErr = new Error();
                                    fakeErr.break = true;
                                    return lsCb(fakeErr);
                                });
                            } else {
                                //logger.debug("EQUIVALENT! Updating " + lsUrl + " for " , host._id, host.hosthname );
                                db.Host.findByIdAndUpdate(
                                    host._id,
                                    {
                                        $set: {
                                            url: lsUrl,
                                            update_date: new Date(),
                                        },
                                    },
                                    function (err, record) {
                                        if (err) {
                                            logger.error(
                                                "ERROR UPDATING HOST!!!",
                                                err,
                                                host.hostname,
                                                host._id
                                            );
                                            async.setImmediate(function () {
                                                return lsCb(err);
                                            });
                                        } else {
                                            logger.info(
                                                "Host updated successfully; hostname, id, ls url:",
                                                host.hostname,
                                                host._id,
                                                lsUrl
                                            );
                                            // break out of this nested async.each,
                                            // but continue the main async.each.
                                            updatedLookup[host._id] = true;
                                            async.setImmediate(function () {
                                                var fakeErr = new Error();
                                                fakeErr.break = true;
                                                return lsCb(fakeErr);
                                            });
                                        }
                                    }
                                );
                            }
                        } else {
                            async.setImmediate(function () {
                                lsCb();
                            });
                        }
                    },
                    function (err) {
                        if (err && err.break) {
                            // Breaking out early, as we already found a match
                            async.setImmediate(function () {
                                nextDbHost();
                            });
                        } else if (err) {
                            logger.error("host was not updated!", err);
                            async.setImmediate(function () {
                                nextDbHost(err);
                            });
                        } else {
                            async.setImmediate(function () {
                                nextDbHost();
                            });
                        }
                    }
                );
            }
        },
        function (err) {
            if (err) {
                logger.info("error updating db hosts", err);
            } else {
                logger.info("done expiring/updating LS URLs for db hosts");
            }
        }
    );
}

// check to see if two records belong to the same host
function sameHost(host1, host2) {
    const uniqueFields = {
        ls: ["client-uuid", "host-name"],
        db: ["uuid", "addresses"],
    };

    var host1Addresses;
    if (isLsHost(host1)) {
        host1Addresses = host1["host-name"];
    } else {
        host1Addresses = host1["addresses"].map((address) => address.address);
    }

    var host2Addresses;
    if (isLsHost(host2)) {
        host2Addresses = host2["host-name"];
    } else {
        host2Addresses = host2["addresses"].map((address) => address.address);
    }

    var intersection = host1Addresses.filter(
        (value) => -1 !== host2Addresses.indexOf(value)
    );
    return intersection.length > 0;
}

// check whether we are looking at an LS or a PWA DB host record
function isLsHost(host) {
    // the LS uses "host-name" for the hostname field, while
    // the PWA db uses "hostname"
    if ("host-name" in host) {
        return true;
    }
    return false;
}

// expires stale records; more specifically, anything:
// * > 7 days old
// * that is not in use ( does not belong to any hostgroups )
// * that is not an adhoc host (no lsid set)
function expireStaleRecords(callback) {
    var d = new Date();
    d.setHours(-24 * 7);

    var options = {
        update_date: { $lt: d },
        lsid: { $exists: true },
    };
    logger.debug("stale host options", options);
    logger.debug("hostgroupLookup", hostgroupLookup);

    // retrieve hosts where update_date is "stale" and
    // lsid is set (NON-adhoc hosts only)
    db.Host.find(options).exec(function (err, hosts) {
        // Get the hosts
        var expireArr = [];
        async.each(
            hosts,
            function (host, next) {
                if (host._id in hostgroupLookup) {
                    logger.info(
                        "Host found in hostgroup; not expiring ",
                        host._id,
                        host.hostname
                    );
                } else {
                    logger.info("Expiring host!!! ", host._id, host.hostname);
                    expireArr.push(host._id);
                }
                next();
            },
            function (err) {
                // if any of the file processing produced an error, err would equal that error
                if (err) {
                    // One of the iterations produced an error.
                    // All processing will now stop.
                    logger.error("A host failed to process", err);
                    callback("error" + err);
                } else {
                    logger.info("All hosts have been processed successfully");
                    logger.debug(
                        "Expiring " + expireArr.length + " hosts:",
                        expireArr
                    );
                    var query = {
                        _id: { $in: expireArr },
                    };
                    db.Host.deleteMany(query, function (err) {
                        if (err) {
                            logger.error("error deleting hosts", err);
                            callback("error deleting hosts " + err);
                        } else {
                            logger.info("successfully deleted hosts");
                            callback();
                        }
                    });
                }
            }
        );
    });
}

function getHostsFromLS(hostsArr, hostsToQuery, ls, lsid, cb) {
    var ah_url = ls.url;
    var query = "?type=host";

    var queryHosts = hostsToQuery;
    if (hostsToQuery.length == 0) {
        queryHosts = [{}];
    }
    async.eachSeries(
        queryHosts,
        function (hostQuery, next) {
            for (var key in hostQuery) {
                var val = hostQuery[key];
            }

            var url = ah_url + query;
            if (ah_url in lsQueried) {
                logger.debug("ALREADY QUERIED LS (skipping): " + ah_url);
                return next();
            }
            request(url, { timeout: 1000 * 5 }, function (err, res, body) {
                lsQueried[ah_url] = 1;
                if (err) return cb(err);
                if (res.statusCode != 200)
                    return cb(
                        new Error(
                            "failed to download activehosts.json from:" +
                                service.activehosts_url +
                                " statusCode:" +
                                res.statusCode
                        )
                    );

                body = JSON.parse(body);
                var objKey = key + "-" + val;
                if (body.length > 0) {
                    var lsBaseUrl = url;
                    lsBaseUrl = lsBaseUrl.match(/^http.?:\/\/[^\/]+/) + "/";
                    formatLsHostRecords(body, lsBaseUrl);
                    lsHostArr = lsHostArr.concat(body);
                }
                next();
            });
        },
        function (err) {
            if (err) logger.error(err);
            if (cb) cb();
        }
    );
}

function formatLsHostRecords(hosts, ls_url) {
    for (var i in hosts) {
        var host = hosts[i];
        host._url_full = ls_url + host.uri;
    }
    return hosts;
}

function getHostgroups(callback) {
    var options = {};

    db.Hostgroup.find(options).exec(function (err, hostgroups) {
        if (err) {
            logger.error("Error retrieving hostgroups: ", err);
            return callback(err);
        }
        async.each(
            hostgroups,
            function (hostgroup, next) {
                async.each(
                    hostgroup.hosts,
                    function (hostId, nextHost) {
                        hostgroupLookup[hostId] = true;
                        nextHost();
                    },
                    function (err) {
                        if (err) {
                            nextHost(err);
                        }
                    }
                );

                next();
            },
            function (err) {
                if (err) {
                    callback(err);
                }
            }
        );
        callback();
    });
}

function getHostFromLsArr(uuid) {
    var filter = {};
    filter["client-uuid"] = uuid;
    var result = lsHostArr.filter(function (host) {
        return "client-uuid" in host && host["client-uuid"][0] == uuid;
    });
    result = result.sort(function (a, b) {
        return a.expires < b.expires;
    });
    return result;
}

function getHostsFromGlobalLS(hostsArr, hostsToQuery, service, id, cb) {
    request(
        service.activehosts_url,
        { timeout: 1000 * 5 },
        function (err, res, body) {
            if (err) return cb(err);
            if (res.statusCode != 200)
                return cb(
                    new Error(
                        "failed to download activehosts.json from:" +
                            service.activehosts_url +
                            " statusCode:" +
                            res.statusCode
                    )
                );
            try {
                var activehosts = JSON.parse(body);
                //load from all activehosts
                async.eachSeries(
                    activehosts.hosts,
                    function (host, next) {
                        if (host.status != "alive") {
                            logger.warn(
                                "skipping " +
                                    host.locator +
                                    " with status:" +
                                    host.status
                            );
                            return next();
                        }
                        //massage the service url so I can use cache_ls to do the rest
                        service.url = host.locator;
                        getHostsFromLS(
                            hostsArr,
                            hostsToQuery,
                            service,
                            id,
                            function (err) {
                                if (err) logger.error(err);
                                next();
                            }
                        );
                    },
                    cb
                );
            } catch (e) {
                //couldn't parse activehosts json..
                logger.error("error parsing activehosts.json", e);
                return;
            }
        }
    );
}
