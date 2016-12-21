
/* - use users service instead?
app.factory('profile', function(appconf, $http) {
    var profile_cache = {};
    return {
        get: function(id) {
            if(profile_cache[id] === undefined) {
                profile_cache[id] = {};
                $http.get(appconf.auth_api+"/profile/"+id)
                .then(function(res) {
                    for(var key in res.data) profile_cache[id][key] = res.data[key];
                });
            }
            return profile_cache[id];
        }
    }
});
*/

//just a service to load all users from auth service
app.factory('serverconf', ['appconf', '$http', function(appconf, $http) {
    return $http.get(appconf.api+'/config')
    .then(function(res) {
        return res.data;
    });
}]);

/*
app.factory('services', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    var label_c = 0;
    function get_class() {
        switch(label_c++ % 5) {
        case 0: return "label-primary"; break;
        case 1: return "label-success"; break;
        case 2: return "label-info"; break;
        case 3: return "label-warning"; break;
        case 4: return "label-danger"; break;
        }
    }

    return $http.get(appconf.api+'/cache/services')
    .then(function(res) {
        //assign label_classes
        for(var lsid in res.data.lss) {
            res.data.lss[lsid].label_class = get_class();
        };

        //set old flag on hosts that haven't been updated lately
        var now = new Date();
        var old = new Date(now.getTime() - 1000*3600); //1 hour old enough?
        for(var type in res.data.recs) {
            res.data.recs[type].forEach(function(service) {
                if(Date.parse(service.updatedAt) < old) service.old = true;
            });
        }
        //console.dir(res.data);
        return res.data;
    });
}]);
*/

app.factory('hosts', function(appconf, $http, toaster) {
    var hosts = [];
    //var all_promise = null;
    var ma_promise = null;

    return {
        //return basic (uuid, sitename, hostname, lsid) host info for all hosts
        getAll: function(opts) { 
            //if(all_promise) return all_promise;
            var select = "sitename hostname lsid";
            if(opts && opts.select) select = opts.select;
            return $http.get(appconf.api+'/hosts?select='+select+'&sort=sitename hostname&limit=100000')
            .then(function(res) {
                hosts = res.data.hosts;
                return res.data.hosts;
            });
        },

        //load host detail (add to existing host object)
        getDetail: function(host) {
            return $http.get(appconf.api+'/hosts?find='+JSON.stringify({_id: host._id})).then(function(res) {
                var _host = res.data.hosts[0];
                //console.dir(_host);
                for(var k in _host) host[k] = _host[k];
                return host;
            });
        },

        //list of all hosts with MA service
        getMAs: function() {
            if(ma_promise) return ma_promise;
            ma_promise = $http.get(appconf.api+'/hosts?select=sitename hostname&sort=sitename hostname&find='+JSON.stringify({
                "services.type": "ma"
            })).then(function(res) {
                //console.log("mas");
                //console.dir(res.data.hosts);
                return res.data.hosts;
            });
            return ma_promise;
        }
    }
});

app.factory('users', function(appconf, $http, jwtHelper) {
    var all_promise = null;
    return {
        //return basic (uuid, sitename, hostname, lsid) host info for all hosts
        getAll: function() { 
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.auth_api+'/profile')
            .then(function(res) {
                //convert IDs to string
                res.data.profiles.forEach(function(profile) {
                    profile.id = profile.id.toString();
                });
                return res.data.profiles;
            });
            return all_promise; 
        }
    }
});

app.factory('testspecs', function(appconf, $http, jwtHelper) {
    var testspecs = null;
    var all_promise = null;
    return {
        getAll: function() {
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.api+'/testspecs')
            .then(function(res) {
                testspecs = res.data.testspecs;
                //console.dir(testspecs);
                return res.data.testspecs;
            });
            return all_promise; 
        },
        add: function() {
            var testspec = {
                desc: "New Testspec",
                admins: [],
            };
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                testspec.admins.push(user.sub.toString());
                testspec._canedit = true;
            }
            testspecs.push(testspec);
            return testspec;
        },
        create: function(testspec) {
            return $http.post(appconf.api+'/testspecs/', testspec)
            .then(function(res) {
                testspec._id = res.data._id;
                testspec._canedit = res.data._canedit;
                testspec.create_date = res.data.create_date;
                return testspec;
            });
        },
        update: function(testspec) {
            return $http.put(appconf.api+'/testspecs/'+testspec._id, testspec)
            .then(function(res) {
                testspec._canedit = res.data._canedit;
                return testspec;
            });
        },
        remove: function(testspec) {
            return $http.delete(appconf.api+'/testspecs/'+testspec._id)
            .then(function(res) {
                testspecs.splice(testspecs.indexOf(testspec), 1);
                //$scope.form.$setPristine();//ignore all changed made
                //$location.path("/testspecs");
                //toaster.success("Deleted Successfully!");
            });
        }
    }
});

app.factory('configs', function(appconf, $http, toaster, jwtHelper) {
    var configs = [];
    //var all_promise = null;
    var ma_promise = null;

    return {
        //return basic (uuid, sitename, hostname, lsid) config info for all configs
        getAll: function(opts) { 
            //if(all_promise) return all_promise;
            var select = "url desc admins tests create_date";
            if(opts && opts.select) select = opts.select;
            return $http.get(appconf.api+'/configs?select='+select+'&sort=desc&limit=100000')
            .then(function(res) {
                configs = res.data.configs;
                return res.data.configs;
            });
        },
        add: function() {
            var config = {
                desc: "New Config",
                admins: [],
                tests: [],
            };
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                config.admins.push(user.sub.toString());
                config._canedit = true;
            }
            configs.push(config);
            return config;
        },
        create: function(config) {
            return $http.post(appconf.api+'/configs/', config)
            .then(function(res) {
                config._id = res.data._id;
                config._canedit = res.data._canedit;
                config.create_date = res.data.create_date;
                return config;
            });
        },
        update: function(config) {
            return $http.put(appconf.api+'/configs/'+config._id, config)
            .then(function(res) {
                config._canedit = res.data._canedit;
                return config;
            });
        },
        remove: function(config) {
            return $http.delete(appconf.api+'/configs/'+config._id)
            .then(function(res) {
                configs.splice(configs.indexOf(config), 1);
            });
        }
    }
});

app.factory('hostgroups', function(appconf, $http, jwtHelper) {
    var hostgroups = null;
    var all_promise = null;
    return {
        getAll: function() {
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.api+'/hostgroups')
            .then(function(res) {
                hostgroups = res.data.hostgroups;
                return res.data.hostgroups;
            });
            return all_promise; 
        },
        add: function() {
            var hostgroup = {
                desc: "New Hostgroup",
                admins: [],
                type: "static",
                hosts: [],
                host_filter: "return false; //select none",
            };
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                hostgroup.admins.push(user.sub.toString());
                hostgroup._canedit = true;
            }
            hostgroups.push(hostgroup);
            return hostgroup;
        },
        create: function(hostgroup) {
            return $http.post(appconf.api+'/hostgroups/', hostgroup)
            .then(function(res) {
                hostgroup._id = res.data._id;
                hostgroup._canedit = res.data._canedit;
                hostgroup.create_date = res.data.create_date;
                return hostgroup;
            });
        },
        update: function(hostgroup) {
            return $http.put(appconf.api+'/hostgroups/'+hostgroup._id, hostgroup)
            .then(function(res) {
                hostgroup._canedit = res.data._canedit;
                return hostgroup;
            });
        },
        remove: function(hostgroup) {
            return $http.delete(appconf.api+'/hostgroups/'+hostgroup._id)
            .then(function(res) {
                hostgroups.splice(hostgroups.indexOf(hostgroup), 1);
                //$scope.form.$setPristine();//ignore all changed made
            });
        }
    }
});

//TODO - deprecate this?
//load menu and profile by promise chaining
app.factory('menu', function(appconf, $http, jwtHelper, $sce, scaMessage, scaMenu, toaster) {

    var jwt = localStorage.getItem(appconf.jwt_id);
    var menu = {
        header: {},
        top: scaMenu,
        user: null, //to-be-loaded
    };
    if(appconf.icon_url) menu.header.icon = $sce.trustAsHtml("<img src=\""+appconf.icon_url+"\">");
    if(appconf.home_url) menu.header.url = appconf.home_url
    if(jwt) menu.user = jwtHelper.decodeToken(jwt);

    return menu;
});

