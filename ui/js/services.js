
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
    var load_promise = $http.get(appconf.api+'/hosts?select=uuid sitename hostname&limit=100000')
    .then(function(res) {
        hosts = res.data.hosts;
        return res.data.hosts;
    }, function(res) {
        toaster.error("Failed to query hosts");
    });

    return {
        getAll: function() { return load_promise; },
    }
});

app.factory('users', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    return $http.get(appconf.auth_api+'/profile')
    .then(function(res) {
        var users = {};
        res.data.profiles.forEach(function(user) {
            //user.id = user.id.toString(); //id needs to be string for legacy reason
            user.id = user.id;
            users[user.id] = user;
        });
        return users;
    }, function(res) {
        //console.log(res.statusText);
    });
}]);

app.factory('testspecs', function(appconf, $http, jwtHelper, users, $q) {
    var deferred = $q.defer();

    //first load profiles
    users.then(function(profiles) {
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
    });
    return deferred.promise;
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

