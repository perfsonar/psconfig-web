
app.controller('HostgroupsController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'serverconf', 'users', '$modal', 'scaMessage', 'hostgroups',
function($scope, appconf, toaster, $http, jwtHelper, serverconf, users, $modal, scaMessage, hostgroups) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);

    users.then(function(_users) {
        $scope.users = _users;
        hostgroups.then(function(_hostgroups) { $scope.hostgroups = _hostgroups});
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
            //apply change
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
            type: 'static',
            hosts: [],
            host_filter: "return false; //select none",
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
            console.log("adding hostgroupu to list");
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
        for(var id in $scope.users) {
            $scope.users_a.push($scope.users[id]);
        }
    });

    $scope.submit = function() {
        //find active tab
        for(var type in $scope.tabs) {
            if($scope.tabs[type].active) $scope.hostgroup.type = type;
        }

        //dynamic uses hosts as cache of the latest query result. let's use the validation result
        if($scope.hostgroup.type == 'dynamic') {
            $scope.hostgroup.hosts = $scope.hostgroup._hosts||[];
            //console.dir($scope.hostgroup.hosts);
        }

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
    
    //pick active tab
    $scope.tabs = {
        static: {active: false},
        dynamic: {active: false},
    };
    $scope.tabs[hostgroup.type].active = true;
}]);

//validator for host_filter ace
app.directive('hostfilter', function($q, $http, appconf) {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            var p = scope.$parent.$parent; //TODO - this feels very icky..
            ctrl.$asyncValidators.hostfilter = function(modelValue, viewValue) {
                //TODO this doesn't fire if empty.
                if (ctrl.$isEmpty(modelValue)) {
                    console.log("empty");
                    return $q.when();
                }

                var def = $q.defer();
                $http.get(appconf.api+'/cache/services-js/', {
                    params: { type: attrs.serviceType, js: modelValue, }
                })
                .then(function(res) {
                    p.hostgroup._hosts = res.data.recs;
                    p.host_filter_alert = null;
                    def.resolve();
                    console.dir(res.data);
                }, function(res) {
                    //toaster.error(res.data.message);
                    p.hostgroup._hosts = null;
                    if(res.data.message) p.host_filter_alert = res.data.message;
                    //console.dir(res);
                    def.reject();
                });   
                return def.promise;
            };
        }
    };
});


