
app.controller('HostgroupsController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'serverconf', 'users', '$modal', 'scaMessage',
function($scope, appconf, toaster, $http, jwtHelper, serverconf, users, $modal, scaMessage) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);

    users.then(function(_users) {
        $scope.users = _users;
        return $http.get(appconf.api+'/hostgroups' /*,{cache: true}*/).then(function(res) {
            $scope.hostgroups = res.data;
            return $scope.hostgroups;  //just to be more promise-ish
        });
    });

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
                    return "Update Host Group";
                },
            }
        });
        modalInstance.result.then(function() {
            for(var k in hostgroup) {
                _hostgroup[k] = hostgroup[k];
            }
        }, function (code) {
            if(code == "remove") {
                for(var i = 0;i < $scope.hostgroups.length; ++i) {
                    if($scope.hostgroups[i].id == hostgroup.id) {
                        $scope.hostgroups.splice(i, 1);
                        break;
                    }
                }
            }
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
            $scope.hostgroups.push(hostgroup);
        }, function (code) {
            //console.log("dismiss code"+code);
        });
    }
}]);

app.controller('HostgroupModalController', ['$scope', 'appconf', 'toaster', '$http', '$modalInstance', 'hostgroup', 'title', 'services', 'serverconf', 'users',
function($scope, appconf, toaster, $http, $modalInstance, hostgroup, title, services, serverconf, users) {
    $scope.hostgroup = hostgroup;
    $scope.title = title;
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });

    //profiles.then(function(_profiles) { $scope.profiles = _profiles; }); //for admin list
    services.then(function(_services) { $scope.services = _services; }); //for host list

    users.then(function(_users) {
        $scope.users = _users;
        $scope.users_a = [];
        for(var sub in $scope.users) {
            $scope.users_a.push($scope.users[sub]);
        }
    });


    /*
    function getdata() {
        //create a copy of $scope.testspec so that UI doesn't break while saving.. (why just admins?)
        var data = angular.copy($scope.hostgroup);
        data.admins = [];
        $scope.hostgroup.admins.forEach(function(admin) {
            if(admin) data.admins.push(admin.sub);
        });
        return data;
    }
    */

    $scope.submit = function() {
        if(!$scope.hostgroup.id) {
            //create 
            $http.post(appconf.api+'/hostgroups/', $scope.hostgroup)
            .then(function(res) {
                $modalInstance.close();
                toaster.success("Hostgroup created successfully!");
                $scope.hostgroup.canedit = res.data.canedit;
                $scope.hostgroup.id = res.data.id;
            }, function(res) {
                toaster.error(res.data.message);
            });           
        } else {
            //edit
            $http.put(appconf.api+'/hostgroups/'+$scope.hostgroup.id, $scope.hostgroup)
            .then(function(res) {
                $modalInstance.close();
                toaster.success("Updated Successfully!");
                $scope.hostgroup.canedit = res.data.canedit;
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
            $modalInstance.dismiss('remove');
            toaster.success("Deleted Successfully!");
        }, function(res) {
            toaster.error(res.data.message);
        });       
    }
}]);


