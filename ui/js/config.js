
app.controller('ConfigsController', ['$scope', 'appconf', 'toaster', '$http', 'serverconf', '$location', 'scaMessage', 'services', 'jwtHelper',
function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, services, jwtHelper) {
    scaMessage.show(toaster);
    //menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });

    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt && jwtHelper.decodeToken(jwt)) {
        $scope.cancreate = true;
    }
    
    //start loading stuff
    var testspecs, hostgroups;//, services;
    $http.get(appconf.api+'/testspecs/').then(function(res) {
        testspecs = res.data; 
        return $http.get(appconf.api+'/hostgroups/');
    }).then(function(res) {
        hostgroups = res.data;
        return $http.get(appconf.api+'/configs');
    }).then(function(res) {
        $scope.configs = res.data;
        //deref testspecs / hostgroups 
        $scope.configs.forEach(function(config) {
            config.Tests.forEach(function(test) {
                testspecs.forEach(function(_testspec) {
                    if(test.TestspecId == _testspec.id) test.testspec = _testspec; 
                });
                hostgroups.forEach(function(_hostgroup) {
                    if(test.agroup == _hostgroup.id) test.agroup = _hostgroup;
                    if(test.bgroup == _hostgroup.id) test.bgroup = _hostgroup;
                    if(test.nagroup == _hostgroup.id) test.nagroup = _hostgroup;
                });
            });
        });

        /*
            //user gets to see admin - but I need to load profiles 
            profiles.then(function(_profiles) {
                //if user can get profiles, then user must be a user
                $scope.cancreate = true;
                
                //map all user's profile to sub so that I use it to show admin info
                var users = {};
                _profiles.forEach(function(profile) {
                    users[profile.sub] = profile;
                });

                //convert admin ids to profile objects - so that select2 will recognize as already selected item
                $scope.configs.forEach(function(config) {
                    config._admins = [];
                    config.admins.forEach(function(id) {
                        config._admins.push(users[id]);
                    });
                });
            });
        }
        */
    });
    
    $scope.addconfig = function() {
        $location.url("/config/new");
    }
    $scope.edit = function(config) {
        $location.url("/config/"+config.id);
    }
}]);

app.controller('ConfigController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'serverconf', '$routeParams', '$location', 'services', 'users', 'testspecs', 'hostgroups',
function($scope, appconf, toaster, $http, jwtHelper, serverconf, $routeParams, $location, services, users, testspecs, hostgroups) {
    $scope.id = $routeParams.id;
    $scope.appconf = appconf;

    //load stuff
    //TODO while we are loading stuff, config template gets rendered and ui-select does odd things if the users list aren't loaded yet
    //doc talks about using resolver inside the route config, but I want to keep stuff inside the controller.. how can I?
    maybe_load_users(function() {
        services.then(function(_services) { 
            $scope.services = _services; 
            testspecs.then(function(testspecs) { 
                $scope.testspecs = testspecs;
                hostgroups.then(function(hostgroups) { 
                    $scope.hostgroups = hostgroups;
                    load_config();
                });
            });
        });
    });

    /*
    if(profiles) {
        profiles.then(function(_profiles) { 
            $scope.profiles = _profiles; 
            //map all user's profile to sub so that I use it to show admin info
            $scope.users = {};
            _profiles.forEach(function(profile) {
                $scope.users[profile.sub] = profile;
            });
            return load();
        }); 
    } else {
        load_guest();
    }
    */

    function maybe_load_users(cb) {
        var jwt = localStorage.getItem(appconf.jwt_id);
        if(jwt && jwtHelper.decodeToken(jwt)) {
            users.then(function(_users) { 
                $scope.users = _users;
                $scope.users_a = [];
                for(var sub in $scope.users) {
                    $scope.users_a.push($scope.users[sub]);
                }
                //cb(jwtHelper.decodeToken(jwt));
                cb();
            });
        } else cb();
    }
    
    function load_config(user) {
        if($scope.id == "new") {
            //new config
            var jwt = localStorage.getItem(appconf.jwt_id);
            var user = jwtHelper.decodeToken(jwt);
            $scope.config = {
                admins: [ $scope.users[user.sub] ], //select current user as admin
                Tests: [],
                canedit: true, 
            }
        } else {
            //updating config
            $http.get(appconf.api+'/configs/'+$routeParams.id).then(function(res) {
                $scope.config = res.data;
                res.data.Tests.forEach(function(test) {
                    //angular wants value key to be string
                    if(test.TestspecId) test.TestspecId = test.TestspecId.toString();
                    if(test.agroup) test.agroup = test.agroup.toString();
                    if(test.bgroup) test.bgroup = test.bgroup.toString();
                });
            });
        }
    }

    $scope.cancel = function() {
        //TODO - form modify alert?
        $location.url("/configs");
    }

    /*
    //is this needed still?
    function getdata() {
        //create a copy of $scope.testspec so that UI doesn't break while saving.. (just admins?)
        var data = angular.copy($scope.config);
        return data;
    }
    */

    $scope.submit = function() {
        if(!$scope.config.id) {
            //create 
            $http.post(appconf.api+'/configs/', $scope.config)
            .then(function(res) {
                $scope.form.$setPristine();
                $location.url("/configs");
                toaster.success("Config created successfully!");
            }, function(res) {
                toaster.error(res.data.message);
            });           
        } else {
            //edit
            $http.put(appconf.api+'/configs/'+$scope.config.id, $scope.config)
            .then(function(res) {
                $scope.form.$setPristine();
                $location.url("/configs");
                toaster.success("Updated Successfully!");
            }, function(res) {
                if(res.data) toaster.error(res.data.message);
                else {
                    toaster.error("Failed to update config");
                    console.dir(res);
                }
            });   
        }
    }
    $scope.addtest = function() {
        $scope.config.Tests.push({
            //id: null,
            desc: "",
            enabled: true,
            mesh_type: "mesh",
        });
    }
    $scope.removetest = function(test) {
        var idx = $scope.config.Tests.indexOf(test);
        $scope.config.Tests.splice(idx, 1);
        $scope.form.$setDirty();
        //toaster.success("Removed Test!");
    }

    $scope.remove = function() {
        $http.delete(appconf.api+'/configs/'+$scope.id)
        .then(function(res) {
            $scope.form.$setPristine();//ignore all changed made
            $location.url("/configs");
            toaster.success("Deleted Successfully!");
        }, function(res) {
            toaster.error(res.data.message);
        });       
    }
    $scope.get_selected_testspec = function(id) {
        for(var i = 0;i < $scope.testspecs.length; ++i) {
            if($scope.testspecs[i].id == id) return $scope.testspecs[i];
        }
    }
    $scope.get_hostgroup = function(id) {
        for(var i = 0;i < $scope.hostgroups.length; ++i) {
            if($scope.hostgroups[i].id == id) return $scope.hostgroups[i];
        }
    }
    $scope.reset_servicetype = function(test) {
        delete test.agroup;
        delete test.bgroup;
        delete test.TestspecId;
    }
}]);


