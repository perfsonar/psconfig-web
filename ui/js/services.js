
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
    var all_promise = null;
    var ma_promise = null;

    return {
        //return basic (uuid, sitename, hostname, lsid) host info for all hosts
        getAll: function() { 
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.api+'/hosts?select=sitename hostname lsid&sort=sitename hostname&limit=100000')
            .then(function(res) {
                hosts = res.data.hosts;
                return res.data.hosts;
            }, function(res) {
                toaster.error("Failed to query hosts");
            });
            return all_promise; 
        },

        //load host detail (add to existing host object)
        getDetail: function(host) {
            return $http.get(appconf.api+'/hosts?find='+JSON.stringify({_id: host._id})).then(function(res) {
                var _host = res.data.hosts[0];
                //console.dir(_host);
                for(var k in _host) host[k] = _host[k];
                return host;
            }, function(res) {
                toaster.error("Failed to load host detail");
            });
        },

        //list of all hosts with MA service
        getMAs: function() {
            if(ma_promise) return ma_promise;
            ma_promise = $http.get(appconf.api+'/hosts?select=sitename hostname&sort=sitename hostname&find='+JSON.stringify({
                "services.type": "ma"
            })).then(function(res) {
                console.log("mas");
                console.dir(res.data.hosts);
                return res.data.hosts;
            }, function(res) {
                toaster.error("Failed to load ma hosts");
            });
            return ma_promise;
        }
    }
});

app.factory('users', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    var all_promise = null;
    return {
        //return basic (uuid, sitename, hostname, lsid) host info for all hosts
        getAll: function() { 
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.auth_api+'/profile')
            .then(function(res) {
                return res.data.profiles;
            }, function(res) {
                toaster.error("Failed to query profiles");
            });
            return all_promise; 
        }
    }
}]);

app.factory('testspecs', function(appconf, $http, jwtHelper, users, $q) {
    var testspecs = null;
    var all_promise = null;
    return {
        getAll: function() {
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.api+'/testspecs')
            .then(function(res) {
                testspecs = res.data.testspecs;
                console.dir(testspecs);
                return res.data.testspecs;
            }, function(res) {
                console.error("Failed to query testspecs");
            });
            return all_promise; 
            /*
            var deferred = $q.defer();

            //first load profiles
            //users.getAll().then(function(profiles) {
                //then load testspecs
                $http.get(appconf.api+'/testspecs')
                .then(function(res) {
                    
                    //lookup users
                    res.data.forEach(function(t) {
                        var as = [];
                        t.admins.forEach(function(a) {
                            as.push(profiles[a]);
                        });
                        t.admins = as; 
                    });
                    deferred.resolve(res.data);
                });
            //});
            return deferred.promise;
        *   */
        },
        post: function(testspec) {
            return $http.post(appconf.api+'/testspecs/', testspec)
            .then(function(res, status, headers, config) {
                //add it 
                testspec._id = res.data._id;
                testspec._canedit = res.data._canedit;
                testspecs.push(testspec);
                return testspec;
            }, function(res, status, headers, config) {
                console.error("failed to register testspec");
            });   
        }
    }
});

app.factory('hostgroups', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    return $http.get(appconf.api+'/hostgroups')
    .then(function(res) {
        return res.data;
    });
}]);

//TODO - deprecate this?
//load menu and profile by promise chaining
app.factory('menu', ['appconf', '$http', 'jwtHelper', '$sce', 'scaMessage', 'scaMenu', 'toaster',
function(appconf, $http, jwtHelper, $sce, scaMessage, scaMenu, toaster) {

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
}]);

