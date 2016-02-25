
//contrib
var winston = require('winston');
var Sandbox = require('sandbox'); //https://github.com/gf3/sandbox

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

exports.resolveHostGroup = function(js, type, cb) {
    var services = {};
    db.Service.findAll({
        include: [
            {
                model: db.Host, 
                attributes: ['info', 'communities', 'hostname', 'toolkit_url', 'no_agent', 'ip'], //TODO - not sure on this yet.
            }, 
        ],
        where: {type: type}
    }).then(function(recs) {
        var sandbox = new Sandbox(/*{timeout: 1000*10}*/);
        var matches = [];
        var code = "JSON.stringify("+JSON.stringify(recs)+".filter("+
            "function(service) {"+
            "   var host = service.Host||{};\n"+
            "   try {\n"+
            js+"\n"+
            "   } catch(e) {\n"+
            "   console.log(host.hostname+' - '+e.toString());\n"+
            "   }\n"+
            "}))";
        sandbox.run(code, function(res) {
            //console.dir(res);
            var _recs = res.result.slice(1, -1); //remove first and last double quotes (not sure how I can get rid of it)
            try {
                var precs = JSON.parse(_recs);
                var ids = [];
                precs.forEach(function(prec) { ids.push(prec.uuid); }); //just pull uuids
                //console.dir(precs);
                cb(null, {recs: ids, c: res['console']});
            } catch(e) {
                cb(_recs);
            }
        });
    });
}
