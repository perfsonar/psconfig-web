
app.controller('HostgroupsController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'menu', 'serverconf', 'profiles', '$modal', 'scaMessage',
function($scope, appconf, toaster, $http, jwtHelper, menu, serverconf, profiles, $modal, scaMessage) {
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

app.controller('HostgroupModalController', ['$scope', 'appconf', 'toaster', '$http', 'profiles', '$modalInstance', 'hostgroup', 'title', 'services', 'serverconf',
function($scope, appconf, toaster, $http,  profiles, $modalInstance, hostgroup, title, services, serverconf) {
    $scope.hostgroup = hostgroup;
    $scope.title = title;
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });

    profiles.then(function(_profiles) { $scope.profiles = _profiles; }); //for admin list
    services.then(function(_services) { $scope.services = _services; }); //for host list

    function getdata() {
        //create a copy of $scope.testspec so that UI doesn't break while saving.. (why just admins?)
        var data = angular.copy($scope.hostgroup);
        data.admins = [];
        $scope.hostgroup.admins.forEach(function(admin) {
            if(admin) data.admins.push(admin.sub);
        });
        console.dir(data);
        return data;
    }

    $scope.submit = function() {
        if(!$scope.hostgroup.id) {
            //create 
            $http.post(appconf.api+'/hostgroups/', getdata())
            .then(function(res) {
                $modalInstance.close();
                toaster.success("Hostgroup created successfully!");
            }, function(res) {
                toaster.error(res.data.message);
            });           
        } else {
            //edit
            $http.put(appconf.api+'/hostgroups/'+$scope.hostgroup.id, getdata())
            .then(function(res) {
                $modalInstance.close();
                toaster.success("Updated Successfully!");
            }, function(res) {
                toaster.error(res.data.message);
            });   
        }
    }
    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/hostgroups/'+$scope.hostgroup.id)
        .then(function(res) {
            $modalInstance.close();
            toaster.success("Deleted Successfully!");
        }, function(res) {
            toaster.error(res.data.message);
        });       
    }
}]);


