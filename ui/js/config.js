
app.controller('ConfigsController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'menu', 'serverconf', 'profiles', '$modal', '$location',
function($scope, appconf, toaster, $http, jwtHelper, menu, serverconf, profiles, $modal, $location) {
    menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = null;
    if(jwt) {
        user = jwtHelper.decodeToken(jwt);
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
        load();
    }

    function load() {
        $http.get(appconf.api+'/configs').then(function(res) {
            //convert admin ids to profile objects - so that select2 will recognize as already selected item
            res.data.forEach(function(config) {
                if($scope.users) {
                    var admins = [];
                    config.admins.forEach(function(id) {
                        admins.push($scope.users[id]);
                    });
                    config.admins = admins; //override
                } else {
                    //TODO - guest user don't get to see who the admins is -- I need to test this case
                }
                //$scope.testspecs[type].push(testspec);
            });
            $scope.configs = res.data;
            return $scope.configs;  //just to be more promise-ish
        });
    }
 
    $scope.cancreate = (user && ~user.scopes.common.indexOf("user"));
    /*
    $scope.edit = function(_config) {
        if(!_config.canedit) {
            toaster.error("You need to be listed as an admin in order to edit this mesh configuration");
            return;
        }
        $location.url("/config/"+_config.id);
    }
    */
    $scope.addconfig = function() {
        $location.url("/config/new");
    }

    /*
    $scope.create = function() {
        var config = {
            desc: "",
            admins: [ $scope.users[user.sub] ], //select current user as admin
            tests: [],
        };
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 't/hostgroup.html',
            controller: 'HostgroupModalController',
            size: 'lg',
            resolve: {
                hostgroup: function () {
                    return hostgroup;
                },
                title: function() {
                    return "New Hostgroup";
                },
            }
        });
        modalInstance.result.then(function() {
            load();
        }, function () {
            //toaster.info('Modal dismissed at: ' + new Date());
        });
        alert('todo');
    }
    */
}]);

app.controller('ConfigController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'serverconf', 'profiles', '$modal', '$routeParams', '$location',
function($scope, appconf, toaster, $http, jwtHelper, serverconf, profiles, $modal, $routeParams, $location) {

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);
    profiles.then(function(_profiles) { 
        $scope.profiles = _profiles; 
        //map all user's profile to sub so that I use it to show admin info
        $scope.users = {};
        _profiles.forEach(function(profile) {
            $scope.users[profile.sub] = profile;
        });
        return load();
    }); 

    //load selectable options
    $http.get(appconf.api+'/testspecs/').then(function(res) {
        $scope.testspecs = res.data;
    });
    $http.get(appconf.api+'/hostgroups/').then(function(res) {
        $scope.hostgroups = res.data;
    });

    $scope.id = $routeParams.id;
    function load() {
        if($scope.id == "new") {
            //new
            $scope.config = {
                admins: [ $scope.users[user.sub] ], //select current user as admin
                Tests: [],
                canedit: true
            };
        } else {
            //update
            $http.get(appconf.api+'/configs/'+$routeParams.id).then(function(res) {
                var admins = [];
                res.data.admins.forEach(function(id) {
                    admins.push($scope.users[id]);
                });
                res.data.admins = admins; //override
                $scope.config = res.data;
                return $scope.config;  //just to be more promise-ish
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
        data.admins = [];
        $scope.config.admins.forEach(function(admin) {
            if(admin) data.admins.push(admin.sub);
        });
        return data;
    }

    $scope.submit = function() {
        if(!$scope.config.id) {
            //create 
            $http.post(appconf.api+'/configs/', getdata())
            .success(function(data, status, headers, config) {
                $location.url("/configs");
                toaster.success("Config created successfully!");
            })
            .error(function(data, status, headers, config) {
                toaster.error("Creation failed!");
            });           
        } else {
            //edit
            $http.put(appconf.api+'/configs/'+$scope.config.id, getdata())
            .success(function(data, status, headers, config) {
                $location.url("/configs");
                toaster.success("Updated Successfully!");
            })
            .error(function(data, status, headers, config) {
                toaster.error("Update failed!");
            });   
        }
    }
    $scope.addtest = function() {
        $scope.config.Tests.push({
            //id: null,
            desc: ""
        });
    }
}]);

