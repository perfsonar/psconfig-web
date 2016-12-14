
//show all testspecs
app.controller('TestspecsController', function($scope, $route, toaster, $http, jwtHelper, $location, serverconf, scaMessage, users, testspecs, $modal, $routeParams) {
    scaMessage.show(toaster);
    $scope.active_menu = "testspecs";

    users.getAll().then(function(_users) {
        $scope.users = _users;
        testspecs.getAll().then(function(_testspecs) { 
            $scope.testspecs = _testspecs; 
            //find task specified
            if($routeParams.id) {
                $scope.testspecs.forEach(function(testspec) {
                    if(testspec._id == $routeParams.id) $scope.select(testspec);
                });
            } else {
                //select first one
                if($scope.testspecs.length > 0) $scope.select($scope.testspecs[0]);
            }
        });
    });

    $scope.selected = null;
    $scope.select = function(testspec) {
        $scope.selected = testspec; 
        $location.update_path("/testspecs/"+testspec._id);
        window.scrollTo(0,0);
    }

    $scope.setdefault = function(type) {
        var def = $scope.serverconf.defaults.testspecs[type];
        $scope.selected.specs = angular.copy(def);
    }

    //some special behaviors on form
    $scope.$watch('selected.specs.ipv4_only', function(nv, ov) {
        if(nv) {
            delete $scope.selected.specs.ipv6_only;
        }
    });
    $scope.$watch('selected.specs.ipv6_only', function(nv, ov) {
        if(nv) {
            delete $scope.selected.specs.ipv4_only;
        }
    });

    $scope.add = function() {
        $scope.selected = testspecs.add();
    }

    $scope.submit = function() {
        //remove parameter set to empty string
        for(var k in $scope.selected.specs) {
            if($scope.selected.specs[k] === '') delete $scope.selected.specs[k];
        }

        //TODO - remove parameters that aren't shown on the UI
        console.dir($scope.form);
        for(var k in $scope.selected.specs) {
            if($scope.form[k] === undefined) {
                console.log("no such field:"+k+" removing (maybe from bad default?)");
                delete $scope.selected.specs[k];
            }
        }

        if(!$scope.selected._id) {
            //new
            testspecs.create($scope.selected).then(function() {
                toaster.success("Testspec created successfully!");
            });
        } else {
            //update
            testspecs.update($scope.selected).then(function() {
                toaster.success("Testspec updated successfully!");
            });
            /*
            } else {
                //update
                $http.put(appconf.api+'/testspecs/'+$scope.testspec._id, $scope.testspec)
                .then(function(res, status, headers, config) {
                    
                    //find the item user was editing
                    $scope.testspecs.forEach(function(testspec) {
                        if(testspec._id == $scope.testspec._id) {   
                            //apply updates
                            for(var k in $scope.testspec) {
                                testspec[k] = $scope.testspec[k];
                            }
                            //console.dir($scope.testspecs);
                            //console.dir(res.data);
                            testspec._canedit = res.data.canedit;
                        }
                    });

                    $scope.form.$setPristine();
                    $location.path("/testspecs");
                    toaster.success("Updated Successfully!");

                }, function(res, status, headers, config) {
                    toaster.error("Update failed!");
                });   
            }
            */
        }
    }
    $scope.cancel = function() {
        location.reload();
    }
    $scope.remove = function() {
        testspecs.remove($scope.selected).then(function() {
            toaster.success("Removed successfully");
            $scope.selected = null;
        });
        /*
        */
    }
});

