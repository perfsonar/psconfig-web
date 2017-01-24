
app.controller('HostgroupsController', function($scope, toaster, $http, jwtHelper, serverconf, users, $modal, scaMessage, $routeParams, $location, hostgroups, hosts) {
    scaMessage.show(toaster);
    $scope.active_menu = "hostgroups";

    $scope.tabs = {
        static: {},
        dynamic: {},
    };

    //serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    //$scope.appconf = appconf;

    //var jwt = localStorage.getItem(appconf.jwt_id);
    //var user = jwtHelper.decodeToken(jwt);

    users.getAll().then(function(_users) {
        $scope.users = _users;
        hosts.getAll({select: 'hostname sitename services lsid'}).then(function(_hosts) {
        
            //organize by service provided
            $scope.hosts = {}; 
            _hosts.forEach(function(host) {
                if(host.services) host.services.forEach(function(service) {
                    if(!$scope.hosts[service.type]) $scope.hosts[service.type] = [];
                    //console.log(service.type+" "+host._id);
                    $scope.hosts[service.type].push(host);
                });
            });

            //console.dir($scope.hosts["bwctl"]);
            //check for duplicates
            //$scope.hosts["bwctl"].forEach(function(host) {

            hostgroups.getAll().then(function(_hostgroups) { 
                $scope.hostgroups = _hostgroups; 
                if($routeParams.id) {
                    $scope.hostgroups.forEach(function(hostgroup) {
                        if(hostgroup._id == $routeParams.id) $scope.select(hostgroup);
                    });
                } else {
                    //select first one
                    if($scope.hostgroups.length > 0) $scope.select($scope.hostgroups[0]);
                }
            });
        });
    });

    $scope.selected = null;
    $scope.select = function(hostgroup) {
        $scope.selected = hostgroup; 
        switch(hostgroup.type) {
        case "static":
            $scope.tabs.static.active = true; 
            break;
        case "dynamic": 
            $scope.tabs.dynamic.active = true; 
            $scope.run_dynamic();
            break;
        }
        $scope.closesubbar();
        $location.update_path("/hostgroups/"+hostgroup._id);
        window.scrollTo(0,0);
    }

    $scope.add = function() {
        $scope.selected = hostgroups.add();
        $scope.closesubbar();
        $location.update_path("/hostgroups");
    }

    $scope.changetype = function(type) {
        if(!$scope.selected) return;
        if($scope.selected.type != type) {
            $scope.selected.type = type;
            $scope.form.$setDirty();
            if(type == "dynamic") $scope.run_dynamic();
        }
    }

    $scope.submit = function() {
        if(!$scope.selected._id) {
            hostgroups.create($scope.selected).then(function(hostgroup) {
                toaster.success("Hostgroup created successfully!");
                $scope.form.$setPristine();
                $location.update_path("/hostgroups/"+hostgroup._id);
            }).catch($scope.toast_error);
        } else {
            hostgroups.update($scope.selected).then(function(hostgroup) {
                toaster.success("Hostgroup updated successfully!");
                $scope.form.$setPristine();
            }).catch($scope.toast_error);
        }
    }

    $scope.cancel = function() {
        location.reload();
    }

    $scope.remove = function() {
        hostgroups.remove($scope.selected).then(function() {
            toaster.success("Removed successfully");
            $scope.selected = null;
        });
    }
    
    //$scope.$watch("selected.host_filter", $scope.run_dynamic);
    //$scope.$watch("selected.service_type", $scope.run_dynamic);

    $scope.run_dynamic = function() {
        console.log("pre");
        if(!$scope.tabs.dynamic.active) return;

        console.log("running dynamic query");
        $http.get($scope.appconf.api+'/hostgroups/dynamic', {
            params: { type: $scope.selected.service_type, js: $scope.selected.host_filter, }
        })
        .then(function(res) {
            $scope.selected.host_filter_alert = null;
            $scope.selected._hosts = res.data.recs;
            $scope.selected.host_filter_console = res.data.c;
        }, function(res) {
            //failed..
            $scope.selected._hosts = null;
            $scope.selected.host_filter_alert = null;
            $scope.selected.host_filter_console = null;
            if(res.data.message) $scope.selected.host_filter_alert = res.data.message;
        });       
    }
});

