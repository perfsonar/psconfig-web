
app.controller('HostgroupsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', 'serverconf', 'profiles', '$modal',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, serverconf, profiles, $modal) {
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

        return load();
    });

    function load() {
        return $http.get(appconf.api+'/hostgroups' /*,{cache: true}*/).then(function(res) {
            //convert admin ids to profile objects - so that select2 will recognize as already selected item
            res.data.forEach(function(hostgroup) {
                var admins = [];
                hostgroup.admins.forEach(function(id) {
                    admins.push($scope.users[id]);
                });
                hostgroup.admins = admins; //override
                //$scope.testspecs[type].push(testspec);
            });
            $scope.hostgroups = res.data;
            return $scope.hostgroups;  //just to be more promise-ish
        });
    }

    $scope.edit = function(_hostgroup) {
        if(!_hostgroup.canedit) {
            toaster.error("You need to be listed as an admin in order to edit this testspec");
            return;
        }

        var hostgroup = angular.copy(_hostgroup);
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
                    //return "Update "+$scope.serverconf.service_types[testspec.service_type].label+" Test Spec";
                    return "Update Host Group";
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
        var hostgroup = {
            service_type: service_type,
            admins: [ $scope.users[user.sub] ], //select current user as admin
            hosts: [],
            desc: "",
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
    }
}]);

app.controller('HostgroupModalController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', '$location', 'profiles', '$modalInstance', 'hostgroup', 'title', 'services',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, $location, profiles, $modalInstance, hostgroup, title, services) {
    $scope.hostgroup = hostgroup;
    $scope.title = title;

    //for admin list
    profiles.then(function(_profiles) { $scope.profiles = _profiles; });
    //for host list
    services.then(function(_services) { $scope.services = _services; });

    //create a copy of $scope.testspec so that UI doesn't break while saving.. (just admins?)
    function getdata() {
        var data = angular.copy($scope.hostgroup);
        data.admins = [];
        $scope.hostgroup.admins.forEach(function(admin) {
            if(admin) data.admins.push(admin.sub);
        });
        return data;
    }

    $scope.submit = function() {
        if(!$scope.hostgroup.id) {
            //create 
            $http.post(appconf.api+'/hostgroups/', getdata())
            .success(function(data, status, headers, config) {
                $modalInstance.close();
                toaster.success("Hostgroup created successfully!");
            })
            .error(function(data, status, headers, config) {
                toaster.error("Creation failed!");
            });           
        } else {
            //edit
            $http.put(appconf.api+'/hostgroups/'+$scope.hostgroup.id, getdata())
            .success(function(data, status, headers, config) {
                $modalInstance.close();
                toaster.success("Updated Successfully!");
            })
            .error(function(data, status, headers, config) {
                toaster.error("Update failed!");
            });   
        }
    }
    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/hostgroups/'+$scope.hostgroup.id, getdata())
        .success(function(data, status, headers, config) {
            $modalInstance.close();
            toaster.success("Deleted Successfully!");
        })
        .error(function(data, status, headers, config) {
            toaster.error("Deletion failed!");
        });       
    }
}]);


