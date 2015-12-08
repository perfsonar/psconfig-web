
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
                attributes: ['info', 'hostname', 'toolkit_url', 'no_agent', 'ip'], //TODO - not sure on this yet.
            }, 
        ],
        where: {type: type}
    }).then(function(recs) {
        var sandbox = new Sandbox();
        var matches = [];
        var code = "JSON.stringify("+JSON.stringify(recs)+".filter(function(service) {var host = service.Host||{};\n"+js+"\n}));";
        sandbox.run(code, function(res) {
            var _recs = res.result.slice(1, -1);
            try {
                //console.log("parsing");
                //console.log(_recs);
                var precs = JSON.parse(_recs);
                //console.log("parsed - pulling uuids");
                var ids = [];
                precs.forEach(function(prec) { ids.push(prec.uuid); }); //just pull uuids
                //console.dir(precs);
                cb(null, {recs: ids, c: res['console']});
            } catch(e) {
                //logger.error("parse error happens if _recs is not array", e);
                cb(_recs);
            }
        });
    });
}
