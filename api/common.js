
//contrib
var request = require('request');
var winston = require('winston');
var Sandbox = require('sandbox'); //https://github.com/gf3/sandbox

//mine
var config = require('./config');
var logger = new winston.Logger(config.logger.winston);
var db = require('./models');

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
        db.Host.find({"services.type": type}, function(err, recs) {
            if(err) return cb(err);
            logger.debug("running dynamic hostgroup query on "+recs.length);
            var sandbox = new Sandbox(/*{timeout: 1000*10}*/);
            var matches = [];
            var code = "JSON.stringify("+JSON.stringify(recs)+".filter("+
                "function(host) {"+
                //"   var host = service.Host||{};\n"+
                "   try {\n"+
                js+"\n"+
                "   } catch(e) {\n"+
                "   console.log(host.hostname+' - '+e.toString());\n"+
                "   }\n"+
                "}))";
            sandbox.run(code, function(res) {
                var _recs = res.result.slice(1, -1); //remove first and last double quotes (not sure how I can get rid of it)
                try {
                    var hosts = JSON.parse(_recs);
                    var ids = hosts.map(function(host) { return host._id; }); //just pull _id
                    cb(null, {recs: ids, c: res.console});
                } catch(e) {
                    logger.debug(e);
                    //logger.debug(res.console);
                    cb("couldn't parse sanbox output or cb error");
                }
            });
        });
    }
}


