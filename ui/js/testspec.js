//show all testsspecs
app.controller('TestspecsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', '$location', 'serverconf', 'profiles', 'scaMessage',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, $location, serverconf, profiles, scaMessage) {
    scaMessage.show(toaster);
    menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);
    profiles.then(function(_profiles) {
        $scope.profiles = _profiles;
        
        //map all user's profile to sub so that I use it to show admin info
        $scope.users = {};
        _profiles.forEach(function(profile) {
            $scope.users[profile.sub] = profile;
        });

        //then load all testspecs
        return load();
    });

    function load() {
        return $http.get(appconf.api+'/testspecs' /*,{cache: true}*/).then(function(res) {
            //convert admin ids to profile objects - so that select2 will recognize as already selected item
            res.data.forEach(function(testspec) {
                /*
                var type = testspec.service_type;
                if($scope.testspecs[type] === undefined) {
                    $scope.testspecs[type] = [];
                }
                */
                var admins = [];
                testspec.admins.forEach(function(id) {
                    admins.push($scope.users[id]);
                });
                testspec.admins = admins; //override
                //$scope.testspecs[type].push(testspec);
            });
            $scope.testspecs = res.data;
            return $scope.testspecs;  //just to be more promise-ish
        });
    }

    $scope.add = function(service_id) {
        $location.url("/testspec/new/"+service_id);
    }

    $scope.edit = function(testspec) {

        /*
        if(!testspec.canedit) {
            toaster.error("You need to be listed as an admin in order to edit this testspec");
            return;
        }
        */

        $location.url("/testspec/"+testspec.id);

        /*
        var testspec = angular.copy(_testspec);
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 't/testspec.html',
            controller: 'TestspecModalController',
            size: 'lg',
            resolve: {
                testspec: function () {
                    return testspec;
                },
                title: function() {
                    //return "Update "+$scope.serverconf.service_types[testspec.service_type].label+" Test Spec";
                    return "Update Test Spec";
                },
            }
        });
        modalInstance.result.then(function() {
            load();
        }, function () {
            //toaster.info('Modal dismissed at: ' + new Date());
        });
        */
    }

    /*
    $scope.create = function(service_type) {
        //$location.path('/newtestspec/'+service_type);
        //construct a new testspec
        var testspec = {
            service_type: service_type,
            admins: [ $scope.users[user.sub] ], //select current user as admin
            specs: $scope.serverconf.defaults.testspecs[service_type],
            desc: "",
        };
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 't/testspec.html',
            controller: 'TestspecModalController',
            size: 'lg',
            resolve: {
                testspec: function () {
                    return testspec;
                },
                title: function() {
                    //return "New "+$scope.serverconf.service_types[service_type].label+" Test Spec";
                    return "New Test Spec";
                },
            }
        });
        modalInstance.result.then(function() {
            load();
        }, function () {
            //toaster.info('Modal dismissed at: ' + new Date());
        });
    }
    */
}]);

//test spec editor
app.controller('TestspecController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', '$location', 'profiles', '$routeParams',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, $location, profiles, $routeParams) {
    $scope.id = $routeParams.id;

    //for admin list
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

    /*
    //massaging handful fields
    if($scope.testspec.specs.ipv4_only) {
        $scope.testspec._ipv46 = "4"; 
    }
    if($scope.testspec.specs.ipv6_only) {
        $scope.testspec._ipv46 = "6"; 
    }
    */
    function load_guest(cb) {
        $http.get(appconf.api+'/testspecs/'+$routeParams.id).then(function(res) {
            $scope.testspec = res.data;
            watch();
            if(cb) cb();
        });
    }
    function load() {
        if($scope.id == "new") {
            //new
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                var service_type = $routeParams.service_type;
                $scope.testspec = {
                    service_type: service_type,
                    admins: [ $scope.users[user.sub] ], //select current user as admin
                    specs: $scope.serverconf.defaults.testspecs[service_type],
                    desc: "",
                };
                watch();
            }
        } else {
            //update
            load_guest(function() {
                //convert admins to admin objects
                $scope.testspec._admins = [];
                $scope.testspec.admins.forEach(function(id) {
                    $scope.testspec._admins.push($scope.users[id]);
                });
            });
        }
    }

    function watch() {
        //some special behaviors
        $scope.$watch(function() { 
            return $scope.testspec.specs.ipv4_only 
        }, function(nv, ov) {
            if(nv) {
                delete $scope.testspec.specs.ipv6_only;
            }
        });
        $scope.$watch(function() { 
            return $scope.testspec.specs.ipv6_only 
        }, function(nv, ov) {
            if(nv) {
                delete $scope.testspec.specs.ipv4_only;
            }
        });
    }

    //create a copy of $scope.testspec so that UI doesn't break while saving.. (just admins?)
    function getdata() {
        var data = angular.copy($scope.testspec);
        data.admins = [];
        $scope.testspec._admins.forEach(function(admin) {
            if(admin) data.admins.push(admin.sub);
        });

        /*
        //need to do a bit of massaging for some fields
        delete data.specs.ipv4_only;
        delete data.specs.ipv6_only;
        switch(data._ipv46) {
        case "4": data.specs.ipv4_only = true; break;
        case "6": data.specs.ipv6_only = true; break;
        }
        */
    
        return data;
    }

    $scope.submit = function() {
        if(!$scope.testspec.id) {
            //create 
            $http.post(appconf.api+'/testspecs/', getdata())
            .then(function(data, status, headers, config) {
                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Testspec created successfully!");
            }, function(data, status, headers, config) {
                toaster.error("Creation failed!");
            });           
        } else {
            //edit
            $http.put(appconf.api+'/testspecs/'+$scope.testspec.id, getdata())
            .then(function(data, status, headers, config) {
                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Updated Successfully!");
            }, function(data, status, headers, config) {
                toaster.error("Update failed!");
            });   
        }
    }
    $scope.cancel = function() {
        $location.path("/testspecs");
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/testspecs/'+$scope.testspec.id, getdata())
        .then(function(data, status, headers, config) {
            $scope.form.$setPristine();//ignore all changed made
            $location.path("/testspecs");
            toaster.success("Deleted Successfully!");
        }, function(data, status, headers, config) {
            toaster.error("Deletion failed!");
        });       
    }
}]);


