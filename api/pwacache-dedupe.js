#!/usr/bin/node
'use strict';

const fs = require('fs');
const dns = require('dns');
const net = require('net');
const winston = require('winston');
const async = require('async');
const request = require('request');
const assert = require('assert');

//mine
const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');
const common = require('./common');

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
    "client-uuid": "3A7CFE34-FB6D-11E7-928E-D0860605CAE2",

}];

console.log("hostsToQuery", hostsToQuery);

function run() {
    var host_results = {};
    //go through each LS
    async.eachOfSeries(config.datasource.lses, function(service, id, next) {
        logger.info("processing datasource:"+id,"................................................................................");
        console.log("service", service);
        switch(service.type) {
            case "sls":
                getHostsFromLS( host_results, hostsToQuery, service, id, next);
                //cache_ls(hosts, service, id, next);
                break;
            case "global-sls":
                //cache_global_ls(hosts, service, id, next);
                getHostsFromGlobalLS(host_results, hostsToQuery, service, id, next);
                break;
            default:
                logger.error("unknown datasource/service type:"+service.type);
        }
    }, function(err) {
        if(err) logger.error(err); //continue
        console.log("host_results", host_results);
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
                    console.log("host addresses", host.addresses);

                }
                

            });
        }

    });
}

function getHostsFromLS( hostsObj, hostsToQuery, ls, lsid, cb ) {
    //console.warn("Getting host from LS ", lsid, ls);
    var ah_url = ls.url;
    var query = "?type=host";

    async.eachSeries( hostsToQuery, function( hostQuery, next ) {
        for( var key in hostQuery ) {
            var val = hostQuery[key];

            query += "&" + key + "=" + val;
        }
        
        var url = ah_url + query;
        console.log("host url: " + url);
        request(url, {timeout: 1000*5}, function(err, res, body) {
            if(err) return cb(err);
            if(res.statusCode != 200) return cb(new Error("failed to download activehosts.json from:"+service.activehosts_url+" statusCode:"+res.statusCode));
            body = JSON.parse(body);
            console.warn("host result", body);
            var objKey = key + "-" + val;
            if ( body.length > 0 ) {
                if ( ! (objKey in hostsObj) ) hostsObj[objKey] = [];
                hostsObj[objKey] = hostsObj[objKey].concat( body );

            }
            next();

        });
    }, function(err) {
            if(err) logger.error(err);
            if(cb) cb();
        
    });



}

function getHostsFromGlobalLS( hostsObj, hostsToQuery, service, id, cb ) {
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
                //massage the service url so that I can use cache_ls to do the rest
                service.url = host.locator;
                //service.url = host.locator+service.query;
                getHostsFromLS(hostsObj, hostsToQuery, service, id, function(err) {
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




