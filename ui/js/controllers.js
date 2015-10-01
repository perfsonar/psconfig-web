
//TODO - I am not sure if this is really worth existing
app.factory('profile', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt) {
        var user = jwtHelper.decodeToken(jwt);
        return $http.get(appconf.profile_api+'/public/'+user.sub)
        .then(function(res) {
            return res.data;
        });
    } else return null;
}]);

//just a service to load all users from auth service
app.factory('serverconf', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    return $http.get(appconf.api+'/config')
    .then(function(res) {
        return res.data;
    });
}]);

//just a service to load all users from auth service
app.factory('users', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    /*
    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt) {
        //TODO - loading the entire list of users!
        $http.get(appconf.auth_api+'/users')
        .success(function(_users, status, headers, config) {
            var usermap = {};
            _users.forEach(function(user) {
                users.push(user);
                usermap[user.id.toString()] = user;
            });
            //TODO - this loads the entire public profile records!! I should make it lazy load
            //then load profile records from profile service
            $http.get(appconf.profile_api+'/users')
            .success(function(_profiles, status, headers, config) {
                _profiles.forEach(function(profile) {
                    var user = usermap[profile.sub];
                    if(user) {
                        for(var k in profile.public) {
                            user[k] = profile.public[k];
                        }
                    }
                });
                console.dir(users);
            });
        });
    }
    */
    //TODO - this loads the entire public profile records!! I should make it lazy load
    //then load profile records from profile service
    return $http.get(appconf.profile_api+'/users')
    .then(function(res) {
        return res.data;
    });
}]);

//TODO - convert to promise
//http://www.codelord.net/2015/09/24/$q-dot-defer-youre-doing-it-wrong/
app.factory('menu', ['appconf', '$http', function(appconf, $http) {
    var menu = {};

    $http.get(appconf.shared_api+'/menu' /*,{cache: true}*/)
    .then(function(res) {
        if(res.status != 200) return toaster.error("Failed to load menu");
        //console.dir(res.data);
        res.data.forEach(function(m) {
            switch(m.id) {
            case 'top':
                menu.top = m;
                break;
            case 'settings':
                menu.settings = m;
                break;
            case 'meshconfig':
                menu.meshconfig = m;
                break;
            }
        });
    });

    return menu;
}]);

app.controller('HeaderController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper',
function($scope, appconf, $route, toaster, $http, jwtHelper) {
    $scope.title = appconf.title;
}]);

app.controller('AboutController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'profile', 'menu',
function($scope, appconf, $route, toaster, $http, jwtHelper, profile, menu) {
    if(profile) {
        profile.then(function(_profile) { $scope.profile = _profile; });
    }
    $scope.menu = menu;
}]);

app.controller('HomeController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'profile', 'menu', 
function($scope, appconf, $route, toaster, $http, jwtHelper, profile, menu) {
    profile.then(function(_profile) { $scope.profile = _profile; });
    $scope.menu = menu;
}]);

//show all testsspecs
app.controller('TestspecsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'profile', 'menu', '$location', 'serverconf', 'users',
function($scope, appconf, $route, toaster, $http, jwtHelper, profile, menu, $location, serverconf, users) {
    profile.then(function(_profile) { $scope.profile = _profile; });
    /*
    profile.then(function(_profile) { 
        $scope.profiles = {};
        _profile.forEach(function(profile) {
            $scope.profiles[profile.sub] = profile.public;
        });
    });
    */
    $scope.menu = menu;
    serverconf.then(function(_serverconf) {
        $scope.serverconf = _serverconf;
    });

    users.then(function(_users) {
        $scope.users = {};
        _users.forEach(function(user) {
            $scope.users[user.sub] = user.public;
        });

        $http.get(appconf.api+'/testspecs' /*,{cache: true}*/)
        .then(function(res) {
            //sort based on service_types
            $scope.testspecs = {};
            res.data.forEach(function(testspec) {
                var type = testspec.service_type;
                if($scope.testspecs[type] === undefined) {
                    $scope.testspecs[type] = [];
                }
                
                /*
                //add user profile for each Admins
                var admins = {};
                testspec.admins.forEach(function(sub) {
                    //look for the profile
                    _users.forEach(function(user) {
                        if(sub == user.sub) admin[sub] = user.public;
                    });
                });
                testspec.admins = admins;
                */

                $scope.testspecs[type].push(testspec);
            });
        });
    });

    $scope.edit = function(spec) {
        if(spec.canedit) $location.path('/testspec/'+spec.id);
    }

    $scope.create = function(service_type) {
        $location.path('/newtestspec/'+service_type);
    }
}]);

//test spec editor
app.controller('TestspecController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'profile', 'menu', '$location', '$routeParams', 'users', 'serverconf',
function($scope, appconf, $route, toaster, $http, jwtHelper, profile, menu, $location, $routeParams, users, serverconf) {
    $scope.menu = menu;

    profile.then(function(_profile) {
        $scope.profile = _profile;
    });
    serverconf.then(function(_serverconf) {
        $scope.serverconf = _serverconf;
    });

    $scope.users = []; //not yet loaded
    users.then(function(_users) {
        $scope.users = _users; //for admin selector

        if($routeParams.id) {
            //update
            $http.get(appconf.api+'/testspecs/'+$routeParams.id /*,{cache: true}*/)
            .then(function(res) {
                var testspec = res.data;
                //convert to user object - so that select2 will recognize as already selected item
                var admins = [];
                testspec.admins.forEach(function(id) {
                    //look for the profile
                    _users.forEach(function(user) {
                        if(id == user.sub) admins.push(user);
                    });
                });
                testspec.admins = admins;
                $scope.testspec = testspec;
            });
            $scope.submit_type = "update";
        }
        if($routeParams.service_type) {
            var jwt = localStorage.getItem(appconf.jwt_id);
            var user = jwtHelper.decodeToken(jwt);
            var admins = [];
            //find user's profile
            //console.dir(user);
            //console.dir(_users);
            _users.forEach(function(u) {
                if(u.sub == user.sub) admins.push(u);
            });
            $scope.testspec = {
                service_type:  $routeParams.service_type,
                admins: admins,
                specs: {},
                desc: "",
            };
            $scope.submit_type = "create";
        }
    });

    /*
    $scope.admins = [
        { name: 'Adam',      email: 'adam@email.com',      age: 12, country: 'United States' },
        { name: 'Amalie',    email: 'amalie@email.com',    age: 12, country: 'Argentina' },
        { name: 'Estefanía', email: 'estefania@email.com', age: 21, country: 'Argentina' },
        { name: 'Adrian',    email: 'adrian@email.com',    age: 21, country: 'Ecuador' },
        { name: 'Wladimir',  email: 'wladimir@email.com',  age: 30, country: 'Ecuador' },
        { name: 'Samantha',  email: 'samantha@email.com',  age: 30, country: 'United States' },
        { name: 'Nicole',    email: 'nicole@email.com',    age: 43, country: 'Colombia' },
        { name: 'Natasha',   email: 'natasha@email.com',   age: 54, country: 'Ecuador' },
        { name: 'Michael',   email: 'michael@email.com',   age: 15, country: 'Colombia' },
        { name: 'Nicolás',   email: 'nicolas@email.com',    age: 43, country: 'Colombia' }
    ];
    */

    function getdata() {
        //create a copy so that UI doesn't break while saving..
        var data = {
            service_type: $scope.testspec.service_type,
            desc: $scope.testspec.desc,
            specs: {todo: "I need to convert form into spec that I can pass to server"},
            admins: []
        };
        $scope.testspec.admins.forEach(function(admin) {
            data.admins.push(admin.sub);
        });
        return data;
    }

    $scope.update = function() {
        $http.put(appconf.api+'/testspecs/'+$routeParams.id, getdata())
        .success(function(data, status, headers, config) {
            $location.path("/testspecs");
            toaster.success("Updated Successfully!");
        })
        .error(function(data, status, headers, config) {
            toaster.error("Update failed!");
        });         
    }
    $scope.create = function() {
        $http.post(appconf.api+'/testspecs/', getdata())
        .success(function(data, status, headers, config) {
            $location.path("/testspecs");
            toaster.success("Testspec created successfully!");
        })
        .error(function(data, status, headers, config) {
            toaster.error("Creation failed!");
        });           
    }
    $scope.cancel = function() {
        $location.path("/testspecs");
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/testspecs/'+$routeParams.id, getdata())
        .success(function(data, status, headers, config) {
            $location.path("/testspecs");
            toaster.success("Deleted Successfully!");
        })
        .error(function(data, status, headers, config) {
            toaster.error("Deletion failed!");
        });       
    }

}]);

/*
app.controller('SettingsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper',
function($scope, appconf, $route, toaster, $http, jwtHelper) {
    $scope.form_profile = {}; //to be loaded later
    $scope.user = null;

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);

    $http.get(appconf.profile_api+'/public/'+user.sub)
    .success(function(profile, status, headers, config) {
        $scope.form_profile = profile;
    })
    .error(function(data, status, headers, config) {
        if(data && data.message) {
            toaster.error(data.message);
        }
    }); 

    //load user info
    $http.get(appconf.auth_api+'/me')
    .success(function(info) {
        $scope.user = info;
    });
    
    //load menu (TODO - turn this into a service?)
    $http.get(appconf.shared_api+'/menu')
    .success(function(menu) {
        $scope.menu = menu;

        //split menu into each menues
        menu.forEach(function(m) {
            switch(m.id) {
            case 'top': 
                $scope.top_menu = m;
                break;
            case 'settings':
                $scope.settings_menu = m;
                break;
            }
        });
    });

    $scope.submit_profile = function() {
        $http.put(appconf.api+'/public/'+user.sub, $scope.form_profile)
        .success(function(data, status, headers, config) {
            toaster.success(data.message);
        })
        .error(function(data, status, headers, config) {
            toaster.error(data.message);
        });         
    }
    
}]);
*/
