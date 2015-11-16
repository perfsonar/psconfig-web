
//show all testsspecs
app.controller('TestspecsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$location', 'serverconf', 'scaMessage', 'users',
function($scope, appconf, $route, toaster, $http, jwtHelper, $location, serverconf, scaMessage, users) {
    scaMessage.show(toaster);
    //menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    //TODO - will fail for guest user
    users.then(function(_users) {
        $scope.users = _users;
        return $http.get(appconf.api+'/testspecs' /*,{cache: true}*/).then(function(res) {
            $scope.testspecs = res.data;
            return $scope.testspecs;  //just to be more promise-ish
        });
    });

    $scope.add = function(service_id) {
        $location.url("/testspec/new/"+service_id);
    }

    $scope.edit = function(testspec) {
        $location.url("/testspec/"+testspec.id);
    }
}]);

//test spec editor
app.controller('TestspecController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$location', 'users', '$routeParams',
function($scope, appconf, $route, toaster, $http, jwtHelper, $location, users, $routeParams) {
    $scope.id = $routeParams.id;
    $scope.appconf = appconf;

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
        load_guest();
    }

    if($scope.id == 'new') {
        $scope.title = "New Test Spec";
    } else {
        $scope.title = "Update Test Spec";
    }

    function load_guest() {
        $http.get(appconf.api+'/testspecs/'+$routeParams.id).then(function(res) {
            $scope.testspec = res.data;
            watch();
        });
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
            load_guest();
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

    $scope.submit = function() {
        //remove parameter set to empty string
        for(var k in $scope.testspec.specs) {
            if($scope.testspec.specs[k] === '') delete $scope.testspec.specs[k];
        }

        //TODO - remove parameters that aren't shown on the UI
        for(var k in $scope.testspec.specs) {
            if($scope.form[k] === undefined) {
                console.log("no such field:"+k+" removing");
                delete $scope.testspec.specs[k];
            }
        }
        if(!$scope.testspec.id) {
            //create 
            $http.post(appconf.api+'/testspecs/', $scope.testspec)
            .then(function(data, status, headers, config) {
                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Testspec created successfully!");
            }, function(data, status, headers, config) {
                toaster.error("Creation failed!");
            });           
        } else {
            //edit
            $http.put(appconf.api+'/testspecs/'+$scope.testspec.id, $scope.testspec)
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
        $http.delete(appconf.api+'/testspecs/'+$scope.testspec.id, $scope.testspec)
        .then(function(data, status, headers, config) {
            $scope.form.$setPristine();//ignore all changed made
            $location.path("/testspecs");
            toaster.success("Deleted Successfully!");
        }, function(data, status, headers, config) {
            toaster.error("Deletion failed!");
        });       
    }
}]);


