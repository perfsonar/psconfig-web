
//show all testspecs
app.controller('TestspecsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$location', 'serverconf', 'scaMessage', 'users', 'testspecs', 
function($scope, appconf, $route, toaster, $http, jwtHelper, $location, serverconf, scaMessage, users, testspecs) {
    scaMessage.show(toaster);
    //menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    //TODO - will fail for guest user
    users.then(function(_users) {
        $scope.users = _users;
        testspecs.then(function(_testspecs) { $scope.testspecs = _testspecs; });
    });

    $scope.add = function(service_id) {
        $location.url("/testspec/new/"+service_id);
    }

    $scope.edit = function(testspec) {
        $location.url("/testspec/"+testspec.id);
    }
}]);

//test spec editor
app.controller('TestspecController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$location', 'users', '$routeParams', 'testspecs',
function($scope, appconf, $route, toaster, $http, jwtHelper, $location, users, $routeParams, testspecs) {
    $scope.id = $routeParams.id;
    $scope.appconf = appconf;

    testspecs.then(function(_testspecs) {
        $scope.testspecs = _testspecs;

        var jwt = localStorage.getItem(appconf.jwt_id);
        if(jwt && jwtHelper.decodeToken(jwt)) {
            users.then(function(_users) { 
                $scope.users = _users;
                $scope.users_a = [];
                for(var sub in $scope.users) {
                    $scope.users_a.push($scope.users[sub]);
                }
                load(jwtHelper.decodeToken(jwt));
            });
        } else {
            find_testspec();
        }
    });

    if($scope.id == 'new') {
        $scope.title = "New Test Spec";
    } else {
        $scope.title = "Update Test Spec";
    }

    function find_testspec() {
        /*
        $http.get(appconf.api+'/testspecs/'+$routeParams.id).then(function(res) {
            $scope.testspec = res.data;
            watch();
        });
        */
        //find the testscope that user wants to view/edit
        $scope.testspecs.forEach(function(testspec) {
            if(testspec.id == $routeParams.id) {
                //create a deep copy so that user's temporary change won't affect the testspecs content (until submitted)
                $scope.testspec = angular.copy(testspec);
            }
        });
        watch();
    }
    function load(user) {
        if($scope.id == "new") {
            //new
            var service_type = $routeParams.service_type;
            $scope.testspec = {
                service_type: service_type,
                admins: [ $scope.users[user.sub] ], //select current user as admin
                specs: $scope.serverconf.defaults.testspecs[service_type],
                desc: "",
            };
            watch();
        } else {
            //update
            find_testspec();
        }
    }

    function watch() {
        //some special behaviors on form
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

    $scope.submit = function() {
        //remove parameter set to empty string
        for(var k in $scope.testspec.specs) {
            if($scope.testspec.specs[k] === '') delete $scope.testspec.specs[k];
        }

        //TODO - remove parameters that aren't shown on the UI
        for(var k in $scope.testspec.specs) {
            if($scope.form[k] === undefined) {
                console.log("no such field:"+k+" removing (maybe from bad default?)");
                delete $scope.testspec.specs[k];
            }
        }

        if(!$scope.testspec.id) {
            //create 
            $http.post(appconf.api+'/testspecs/', $scope.testspec)
            .then(function(res, status, headers, config) {
                $scope.testspec.id = res.data.id;
                $scope.testspec.canedit = res.data.canedit;
                $scope.testspecs.push($scope.testspec);
                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Testspec created successfully!");

            }, function(res, status, headers, config) {
                toaster.error("Creation failed!");
            });           
        } else {
            //update
            $http.put(appconf.api+'/testspecs/'+$scope.testspec.id, $scope.testspec)
            .then(function(res, status, headers, config) {
                
                //find the item user was editing
                $scope.testspecs.forEach(function(testspec) {
                    if(testspec.id == $scope.testspec.id) {   
                        //apply updates
                        for(var k in $scope.testspec) {
                            testspec[k] = $scope.testspec[k];
                        }
                        //console.dir($scope.testspecs);
                        //console.dir(res.data);
                        testspec.canedit = res.data.canedit;
                    }
                });

                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Updated Successfully!");

            }, function(res, status, headers, config) {
                toaster.error("Update failed!");
            });   
        }
    }
    $scope.cancel = function() {
        $location.path("/testspecs");
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/testspecs/'+$scope.testspec.id, $scope.testspec)
        .then(function(res, status, headers, config) {
            //find testspec and remove
            for(var i = 0;i < $scope.testspecs.length; ++i) {
                if($scope.testspecs[i].id == $scope.testspec.id) {
                    $scope.testspecs.splice(i, 1);
                    break;
                }
            }

            $scope.form.$setPristine();//ignore all changed made
            $location.path("/testspecs");
            toaster.success("Deleted Successfully!");
        }, function(res, status, headers, config) {
            toaster.error("Deletion failed!");
        });       
    }
}]);


