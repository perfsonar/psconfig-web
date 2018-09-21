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
    //"client-uuid": "3A7CFE34-FB6D-11E7-928E-D0860605CAE2", //CL example
    "client-uuid": "58daadb8-4382-489e-ba91-39e1784ba940",

}];

console.log("hostsToQuery", hostsToQuery);

function run() {
    var host_results = [];
    //go through each LS
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
    /*
        for( var i in host_results ) {
            var row = host_results[i];
            console.log("hostid", i);
            console.log("number of hosts: " + row.length);
            console.log("host_result:", row);

        }
        */
        //async.eachOfSeries(hosts, function(host, id, next) {
        
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
                for(var j in hosts) {
                    var host = hosts[j];
                    if ( sameHost( host, host ) ) { // TODO: fix 2nd argument
                        console.log("SAME HOST!!!");
                    }
                    //console.log("host addresses", host.addresses);

                }


            });
        }

    });
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




