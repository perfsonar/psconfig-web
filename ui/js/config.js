
app.controller('ConfigsController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'menu', 'serverconf', 'profiles', '$modal', '$location',
function($scope, appconf, toaster, $http, jwtHelper, menu, serverconf, profiles, $modal, $location) {
    menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;
    
    /*
    //load stuff we need
    $http.get(appconf.api+'/testspecs/').then(function(res) {
        $scope.testspecs = res.data;
    });
    $http.get(appconf.api+'/hostgroups/').then(function(res) {
        $scope.hostgroups = res.data;
    });
    */
    $http.get(appconf.api+'/configs').then(function(res) {
        $scope.configs = res.data;
        /*
        var jwt = localStorage.getItem(appconf.jwt_id);
        if(jwt) {
            user = jwtHelper.decodeToken(jwt);//watch out..jwt could be invalid
            if(user && ~user.scopes.common.indexOf("user")) {
                $scope.cancreate = true;
            }
        }
        */
        if(profiles) profiles.then(function(_profiles) {
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
    });

 
    $scope.addconfig = function() {
        $location.url("/config/new");
    }
    $scope.edit = function(config) {
        $location.url("/config/"+config.id);
    }
    $scope.openpuburl = function(config) {
        document.location = appconf.api+"/pub/"+config.url;
    }
}]);

app.controller('ConfigController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'serverconf', 'profiles', '$modal', '$routeParams', '$location',
function($scope, appconf, toaster, $http, jwtHelper, serverconf, profiles, $modal, $routeParams, $location) {
    $scope.id = $routeParams.id;

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
    
    //load selectable options
    $http.get(appconf.api+'/testspecs/').then(function(res) {
        $scope.testspecs = res.data;
    });
    $http.get(appconf.api+'/hostgroups/').then(function(res) {
        $scope.hostgroups = res.data;
    });

    function load_guest(cb) {
        $http.get(appconf.api+'/configs/'+$routeParams.id).then(function(res) {
            $scope.config = res.data;
            res.data.Tests.forEach(function(test) {
                //angular wants value key to be string
                test.TestspecId = test.TestspecId.toString();
                test.agroup = test.agroup.toString();
                if(test.bgroup) test.bgroup = test.bgroup.toString();
            });
            if(cb) cb();
        });
    }
    function load() {
        if($scope.id == "new") {
            //new
            var jwt = localStorage.getItem(appconf.jwt_id);
            var user = jwtHelper.decodeToken(jwt);
            $scope.config = {
                _admins: [ $scope.users[user.sub] ], //select current user as admin
                Tests: [],
                canedit: true, 
            };
        } else {
            //update
            load_guest(function() {
                //convert admins to admin objects
                $scope.config._admins = [];
                $scope.config.admins.forEach(function(id) {
                    $scope.config._admins.push($scope.users[id]);
                });
            });
        }
    }

    $scope.cancel = function() {
        //TODO - form modify alert?
        $location.url("/configs");
    }

    function getdata() {
        //create a copy of $scope.testspec so that UI doesn't break while saving.. (just admins?)
        var data = angular.copy($scope.config);

        //convert admin object to admin sub ids
        data.admins = [];
        $scope.config._admins.forEach(function(admin) {
            if(admin) data.admins.push(admin.sub);
        });

        /*
        //convert various test objects to foreigh keys
        data.Tests.forEach(function(test) {
            test.TestspecId = test.testspec.id;
            test.agroup = test.agroup.id;
            if(test.bgroup) test.bgroup = test.bgroup.id;
        });
        */
    
        return data;
    }

    $scope.submit = function() {
        if(!$scope.config.id) {
            //create 
            $http.post(appconf.api+'/configs/', getdata())
            .then(function(res) {
                $scope.form.$setPristine();
                $location.url("/configs");
                toaster.success("Config created successfully!");
            }, function(res) {
                toaster.error(res.data.message);
            });           
        } else {
            //edit
            $http.put(appconf.api+'/configs/'+$scope.config.id, getdata())
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
    /*
            agroup: "",
            bgroup: "",
            TestspecId: "",
    */
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


