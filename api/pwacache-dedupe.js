#!/usr/bin/node
'use strict';

const fs = require('fs');
const dns = require('dns');
const net = require('net');
const winston = require('winston');
const async = require('async');
const request = require('request');
const assert = require('assert');
const urlLib = require('url');
//const { URL } = require('url');

//mine
const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');
const common = require('./common');

var lsHostArr = [];
var lsQueried = {};
var hostgroupsArr = [];
var hostgroupLookup = {};

db.init(function(err) {
    if(err) throw err;
    logger.info("connected to db");
    run(); //this start loop
});

console.warn("CONFIG", JSON.stringify(config.datasource, null, 4));
            
//console.log(JSON.stringify(host, null, 4));
var hostsToQuery = [
{
    //"host-name": "psb.hpc.utfsm.cl",
    //"client-uuid": "58daadb8-4382-489e-ba91-39e1784ba940",
    //"client-uuid": "3A7CFE34-FB6D-11E7-928E-D0860605CAE2", //CL example
    "client-uuid": "563B435A-D927-11E7-AC93-957AEF439B43" // newy32aoa
    //"client-uuid": "aa26835a-cfdd-43e7-a145-c8387ba7b5d7" // rrze.uni-erlangen

}];

console.log("hostsToQuery", hostsToQuery);

function run() {
    var host_results = [];
    //go through each LSA
    /*
    getHostgroups().then( function( result ) {
        expireStaleRecords();
    });
    */
    async.series( [ getHostgroups, 
            expireStaleRecords],

            function(err) { //This function gets called after the two tasks have called their "task callbacks"
                if (err) return err; // next(err);
                console.log("done with series!");
                //Here locals will be populated with `user` and `posts`
                //Just like in the previous example
                //res.render('user-profile', locals);
                async.eachOfSeries(config.datasource.lses, function(service, id, next) {
                    logger.info("processing datasource:"+id,"................................................................................");
                    console.log("service", service);
                    switch(service.type) {
                        case "sls":
                            var newLSResults = getHostsFromLS( host_results, hostsToQuery, service, id, next);
                            host_results.concat( newLSResults);
                            //cache_ls(hosts, service, id, next);
                            break;
                        case "global-sls":
                            //cache_global_ls(hosts, service, id, next);
                            var newLSResults = getHostsFromGlobalLS(host_results, hostsToQuery, service, id, next);
                            host_results.concat( newLSResults);
                            break;
                        default:
                            logger.error("unknown datasource/service type:"+service.type);
                    }
                }, function(err) {
                    if(err) logger.error(err); //continue
                    console.log("lsHostArr", lsHostArr.slice(0, 10));
                    console.log("num result", lsHostArr.length);

                    // retrieve the host record from the local db
                    var options = {};
                    for( var i in hostsToQuery ) {
                        var hostFilter = hostsToQuery[i];
                        for( var key in hostFilter ) {
                            var val = hostFilter[key];
                            key = key.replace("client-uuid", "uuid");
                            key = key.replace("host-name", "hostname");
                            options[key] = val;

                        }
                        console.log("db find options", options);

                        db.Host.find(options, function(err, hosts) {
                            console.error("HOSTS FROM DB - ", hosts.length, hosts);
                            mergeDbHosts( hosts );
                            /*
                            for(var j in hosts) {
                                var host = hosts[j];
                                if ( sameHost( host, host ) ) { // TODO: fix 2nd argument
                                    console.log("SAME HOST!!!");
                                }
                                //console.log("host addresses", host.addresses);

                            }
                            */


                        });
                    }

                });
    });
}

function mergeDbHosts( hosts ) {
    if ( ( typeof hosts == "undefined") || hosts.length < 2 ) return hosts;

    for(var i=0; i<hosts.length; i++){
        for(var j=i + 1; j<hosts.length; j++){
            if( sameHost( hosts[i], hosts[j] ) ){
                console.log("hosts are equivalent! ", hosts[i].hostname, hosts[j].hostname);

            } else {
                console.log("hosts are NOT equivalent! ", hosts[i].hostname, hosts[j].hostname);
            }
        }
    }



}

// check to see if two records belong to the same host
function sameHost( host1, host2 ) {
    const uniqueFields = {
        "ls": ["client-uuid", "host-name"],
        "db": ["uuid", "addresses"]
    };

    var host1Addresses;
    if (  isLsHost( host1 ) ) {
        host1Addresses = host1["host-name"];
    } else {
        host1Addresses = host1["addresses"].map( address => address.address );
    }
    console.log("host1Addresses", host1Addresses);

    var host2Addresses;
    if (  isLsHost( host2 ) ) {
        host2Addresses = host2["host-name"];
    } else {
        host2Addresses = host2["addresses"].map( address => address.address );
    }
    console.log("host2Addresses", host2Addresses);

    var intersection = host1Addresses.filter(value => -1 !== host2Addresses.indexOf(value));

    console.log("intersection", intersection);

    return intersection.length > 0;
    
    



}

// check whether we are looking at an LS or a PWA DB host record
function isLsHost( host ) {
    // the LS uses "host-name" for the hostname field, while
    // the PWA db uses "hostname"
    if ( "host-name" in host ) {
        return true;
    }
    return false;

}

// expires stale records; more specifically, anything:
// * > 7 days old
// * that is not in use ( does not belong to any hostgroups )
// * that is not an adhoc host (no lsid set)
function expireStaleRecords( callback ) {
    var d = new Date();
    d.setHours(-24*7);
    console.log("inside Stale Records: hostgroupsArr", hostgroupsArr[0]);

    var options = {
        update_date: {"$lt": d},
        lsid: {"$exists": true}
    };
    console.log("stale host options", options);
    console.log("hostgroupLookup", hostgroupLookup);

    // retrieve hosts where update_date is "stale" and
    // lsid is set (NON-adhoc hosts only)
    db.Host.find(options).exec( function( err, hosts ) {
        // Get the hosts 
        var expireArr = [];
        async.each(hosts, function(host, next) {
            //console.log("host", host._id);
            if ( host._id in hostgroupLookup ) {
                console.log("Host found in hostgroup; not expiring " , host._id, host.hostname);
            } else {
                console.error("Would expire host!!! ", host._id, host.hostname);
                expireArr.push( host._id );
            }
            next();
        }, function(err) {
         // if any of the file processing produced an error, err would equal that error
            if( err ) {
                // One of the iterations produced an error.
                // All processing will now stop.      
                console.log('A host failed to process');
                callback("error" + err);
            } else {
                console.log('All hosts have been processed successfully');
                console.log("Expiring " + expireArr.length + " hosts:", expireArr);
                var query = {
                    _id: {$in: expireArr}
                }
                db.Host.deleteMany( query , function(err) {
                    if ( err ) {
                        console.log("error deleting hosts", err);
                        callback("error deleting hosts " + err);


                    } else {
                        console.log("successfully deleted hosts");
                callback();

                    }


                });

            }

     });



    });
}

function getHostsFromLS( hostsArr, hostsToQuery, ls, lsid, cb ) {
    //console.warn("Getting host from LS ", lsid, ls);
    var ah_url = ls.url;
    var query = "?type=host";

    async.eachSeries( hostsToQuery, function( hostQuery, next ) {
        for( var key in hostQuery ) {
            var val = hostQuery[key];

            //query += "&" + key + "=" + val;
        }

        var url = ah_url + query;
        console.log("host url: " + url);
        if ( ah_url in lsQueried ) {
            console.log("ALREADY QUERIED LS (skipping): " + ah_url);
            return next();
        }
        request(url, {timeout: 1000*5}, function(err, res, body) {
            lsQueried[ah_url] = 1;
            if(err) return cb(err);
            if(res.statusCode != 200) return cb(new Error("failed to download activehosts.json from:"+service.activehosts_url+" statusCode:"+res.statusCode));
            body = JSON.parse(body);
            //console.warn("host result", body);
            var objKey = key + "-" + val;
            if ( body.length > 0 ) {
                var lsBaseUrl = url;
                lsBaseUrl= lsBaseUrl.match(/^http.?:\/\/[^\/]+/) + '/';
                //console.error("lsBaseUrl", lsBaseUrl);
                formatLsHostRecords( body, lsBaseUrl );
                lsHostArr = lsHostArr.concat( body );
                console.log("lsHostArr.length", lsHostArr.length);

            }
            next();

        });
    }, function(err) {
            if(err) logger.error(err);
            console.log("lsHostArr after finishing loplp", lsHostArr.length);
            if(cb) cb();

    });

}

function formatLsHostRecords( hosts, ls_url ) {
    for(var i in hosts ) {
        var host = hosts[i];
        host._url_full = ls_url + host.uri;
    };
    return hosts;


}

function getHostgroups( callback ) {
    console.log("getHostGroups callback", callback);
    //return new Promise( function(resolve, reject) {
    var options = {};

    db.Hostgroup.find(options).exec( function(err, hostgroups) {
        if ( err ) {
            console.error("Error retrieving hostgroups: ", err);
            //reject(err);
            //return [];
            callback(err);

        }
        async.each(hostgroups, function(hostgroup, next) {
            //console.log("HOSTGROUP_ ", hostgroup);
            async.each( hostgroup.hosts, function( hostId, nextHost ) {
                hostgroupLookup[ hostId ] = true;
                nextHost();

            }, function( err ) {
                if ( err ) {
                    nextHost(err);
                }

            });

            next();

        }
        , function( err ) {
            if ( err ) {
                callback(err);
            }

        });
        //console.log("pushing hostgroup", hostgroup);
        //hostgroupsArr = hostgroup;
        //resolve(hostgroupsArr);
        //hostgroupLookup[ host._id ] = true;
        callback();
    });
    //});
}

function getHostsFromGlobalLS( hostsArr, hostsToQuery, service, id, cb ) {
    request(service.activehosts_url, {timeout: 1000*5}, function(err, res, body) {
        if(err) return cb(err);
        if(res.statusCode != 200) return cb(new Error("failed to download activehosts.json from:"+service.activehosts_url+" statusCode:"+res.statusCode));
        try {
            var activehosts = JSON.parse(body);
            //load from all activehosts
            async.eachSeries(activehosts.hosts, function(host, next) {
                if(host.status != "alive") {
                    logger.warn("skipping "+host.locator+" with status:"+host.status);
                    return next();
                }
                //massage the service url so I can use cache_ls to do the rest
                service.url = host.locator;
                //service.url = host.locator+service.query;
                getHostsFromLS(hostsArr, hostsToQuery, service, id, function(err) {
                    if(err) logger.error(err); //continue
                    next();
                });
            }, cb);
        } catch (e) {
            //couldn't parse activehosts json..
            return cb(e);
        }
    });



}




