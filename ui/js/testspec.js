'use strict';

//show all testsspecs
app.controller('TestspecsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', '$location', 'serverconf', 'profiles', '$modal',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, $location, serverconf, profiles, $modal) {
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

    $scope.edit = function(_testspec) {
        if(!_testspec.canedit) {
            toaster.error("You need to be listed as an admin in order to edit this testspec");
            return;
        }

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
    }

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
}]);

//test spec editor
app.controller('TestspecModalController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', '$location', 'profiles', '$modalInstance', 'testspec', 'title',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, $location, profiles, $modalInstance, testspec, title) {
    $scope.testspec = testspec;
    $scope.title = title;

    //for admin list
    profiles.then(function(_profiles) { $scope.profiles = _profiles; });

    //create a copy of $scope.testspec so that UI doesn't break while saving.. (just admins?)
    function getdata() {
        /*
        var data = {
            service_type: $scope.testspec.service_type,
            desc: $scope.testspec.desc,
            specs: $scope.testspec.specs,
            admins: [] //to be added below
        };
        */
        var data = angular.copy($scope.testspec);
        data.admins = [];
        $scope.testspec.admins.forEach(function(admin) {
            if(admin) data.admins.push(admin.sub);
        });
        return data;
    }

    $scope.submit = function() {
        console.log("submitted");
        if(!$scope.testspec.id) {
            //create 
            $http.post(appconf.api+'/testspecs/', getdata())
            .success(function(data, status, headers, config) {
                //$location.path("/testspecs");
                $modalInstance.close();
                toaster.success("Testspec created successfully!");
            })
            .error(function(data, status, headers, config) {
                toaster.error("Creation failed!");
            });           
        } else {
            //edit
            $http.put(appconf.api+'/testspecs/'+$scope.testspec.id, getdata())
            .success(function(data, status, headers, config) {
                //$location.path("/testspecs");
                $modalInstance.close();
                toaster.success("Updated Successfully!");
            })
            .error(function(data, status, headers, config) {
                toaster.error("Update failed!");
            });   
        }
    }
    $scope.cancel = function() {
        //$location.path("/testspecs");
        $modalInstance.dismiss('cancel');
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/testspecs/'+$scope.testspec.id, getdata())
        .success(function(data, status, headers, config) {
            //$location.path("/testspecs");
            $modalInstance.close();
            toaster.success("Deleted Successfully!");
        })
        .error(function(data, status, headers, config) {
            toaster.error("Deletion failed!");
        });       
    }
}]);


