
const fs = require('fs'); //debug
const request = require('request');
const winston = require('winston');
const Sandbox = require('sandbox'); //https://github.com/gf3/sandbox
const async = require('async');

//mine
const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');

exports.profile = {
    getall: function(cb) { 
        request.get({
            url: config.common.auth_api+"/profiles",
            json: true,
            headers: { 'Authorization': 'Bearer '+config.common.auth_jwt }
        }, function (err, res, profiles) {
            if(err) return cb(err);
            if (res.statusCode != 200) {
                return cb({message: "couldn't load user profiles from profile service:", code: res.statusCode});
            }
            //convert to array of objecdt keyed by user ids
            var ps = {};
            profiles.forEach(function(p) {
                //p.public.sub = p.id;
                ps[p.id] = p;
            });
            //console.dir(ps);
            cb(null, ps);
        });
    }
}

exports.dynamic = {
    resolve: function(js, type, cb) {
        var services = {};
        db.Host.find({"services.type": type}, function(err, hosts) {
            if(err) return cb(err);
            logger.debug("running dynamic hostgroup query on",hosts.length,"hosts");
            var sandbox = new Sandbox(/*{timeout: 1000*10}*/);

            //convert recs to json 
            var json = JSON.stringify(hosts);
            //(and strip non-ascii chars..)
            var code = `
                JSON.stringify(`+json+`.filter(
                function(host) {
                    try {
                        `+js+`
                    } catch(e) {
                        console.log(host.hostname+' - '+e.toString());
                    }
                }))
            `;
            sandbox.run(code, function(res) {
                try {
                    var json = eval(res.result); //Is this safe?
                    var hosts = JSON.parse(json);
                    var ids = hosts.map(function(host) { return host._id; }); //just pull _id
                    cb(null, {ids: ids, c: res.console});
                } catch(e) {
                    //logger.debug(e);
                    cb("couldn't parse sanbox output or cb error");
                }
            });
        });
    }
}


