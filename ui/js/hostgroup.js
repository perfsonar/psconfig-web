
app.controller('HostgroupsController', 
function($scope, toaster, $http, jwtHelper, serverconf, users, $modal, scaMessage, $routeParams, $location, hostgroups, hosts, $cookies) {
    scaMessage.show(toaster);
    $scope.active_menu = "hostgroups";
    $scope.filter = $cookies.get('hostgroups_filter');

    $scope.tabs = {
        static: { "active": true },
        dynamic: { "active": false },
    };

    users.getAll().then(function(_users) {
        $scope.users = _users;
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

    $scope.host_catalog = {}; //keyed by id

    $scope.refreshHosts = function(query) {
        var find = {};
        if(query) { 
            find.$or = [
                {hostname: {$regex: query}},
                {sitename: {$regex: query}},
                {lsid: {$regex: query}},
            ];
        } else {
            //only search for what's selected
            find._id = {$in: $scope.selected.hosts};
        }
        return $http.get($scope.appconf.api+'/hosts'+
            '?select='+encodeURIComponent('sitename hostname lsid info')+
            '&limit=1000'+
            '&find='+encodeURIComponent(JSON.stringify(find))).then(function(res) {
            $scope.hosts = res.data.hosts;
            $scope.hosts.forEach(function(host) {
                $scope.host_catalog[host._id] = host;
            });
        });
    };

    $scope.selected = null;
    $scope.select = function(hostgroup) {
        $scope.selected = hostgroup;
        switch(hostgroup.type) {
        case "static":
            $scope.tabs.static.active = true;
            break;
        case "dynamic":
            $scope.tabs.dynamic.active = true;
            //$scope.run_dynamic();
            break;
        }
        $scope.refreshHosts();
        $scope.closesubbar();
        $location.update_path("/hostgroups/"+hostgroup._id);
        window.scrollTo(0,0);
    }

    $scope.add = function() {
        $scope.selected = hostgroups.add();
        $scope.closesubbar();
        $location.update_path("/hostgroups");
    }

    $scope.changetype = function(event, type) {

        if(!$scope.selected) return;
        if ( type == "dynamic" ) {
            //$scope.run_dynamic();
        } else { 
            $scope.refreshHosts();
            if($scope.selected.type != type) {
                $scope.selected.type = type;
                $scope.form.$setDirty();

            }
        }
    }

    $scope.submit = function() {
        /*
        if($scope.selected.type == "dynamic") {
            //update cached host list (.hosts) with current list of hosts (_hosts)
            //so that it will be up-to-date before next caching takes place
            $scope.selected.hosts = $scope.selected._hosts;
        }
        */

        delete $scope.selected.host_filter_console; //could cause "payload too large"

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
            /*
            }).catch(function(err) {
                console.dir(err);
            });
            */
        }
    }

    $scope.cancel = function() {
        location.reload();
    }

    $scope.remove = function() {
        hostgroups.remove($scope.selected).then(function() {
            toaster.success("Removed successfully");
            $scope.selected = null;
        }).catch($scope.toast_error);
    }

    $scope.run_dynamic = function() {
        if(!$scope.tabs.dynamic.active) return;

        //console.log("running dynamic query");
        $http.get($scope.appconf.api+'/hostgroups/dynamic', {
            params: { type: $scope.selected.service_type, js: $scope.selected.host_filter, }
        })
        .then(function(res) {
            $scope.selected.host_filter_alert = null;
            //$scope.selected._hosts = res.data.ids;
            $scope.selected.host_filter_console = res.data.c;

            //update cached host list (.hosts) with current list of hosts (_hosts)
            //so that it will be up-to-date before next caching takes place
            $scope.selected.hosts = res.data.ids;
            $scope.refreshHosts();
        }, function(res) {
            //failed..
            //$scope.selected._hosts = null;
            $scope.selected.hosts = null; //should I set to []?
            $scope.selected.host_filter_alert = null;
            $scope.selected.host_filter_console = null;
            if(res.data.message) $scope.selected.host_filter_alert = res.data.message;
        });
    }

    $scope.filter_hostgroups = function(hostgroups) {
        if(!hostgroups) return; //no loaded yet?
        $cookies.put('hostgroups_filter', $scope.filter);

        return hostgroups.filter(function(hostgroup) {
            if($scope.selected == hostgroup) return true; //always show selected one
            if(!$scope.filter) return true; //show all

            var name = hostgroup.name.toLowerCase();
            var type = hostgroup.service_type.toLowerCase();

            //all tokens must match somewhere
            var tokens = $scope.filter.toLowerCase().split(" ");
            var accept = true;
            tokens.forEach(function(token) {
                var match = false;
                if(~name.indexOf(token)) match = true;
                if(~type.indexOf(token)) match = true;
                if(!match) accept = false;
            });
            return accept;
        });
    }
});

