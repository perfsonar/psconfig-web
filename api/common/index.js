var request = require('request');

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

exports.filter = require('./filter');
