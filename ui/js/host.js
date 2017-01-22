
app.controller('HostsController', function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, hosts, $modal, $routeParams, users) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;
    $scope.active_menu = "hosts";

    $scope.loading = true;

    //load users for admin
    users.getAll().then(function(_users) {

        $scope.users = _users;
        hosts.getAll().then(function(_hosts) {
            $scope.hosts = _hosts;

            //create _id>host mapping
            $scope.hosts_o = {};
            _hosts.forEach(function(host) {
                $scope.hosts_o[host._id] = host;
            });

            $scope.loading = false;

            //select specified host
            if($routeParams.id) {
                _hosts.forEach(function(host) {
                    if(host._id == $routeParams.id) $scope.select(host);
                });
            } else $scope.select(_hosts[0]); //select first one then
        });
    });

    hosts.getMAs().then(function(hosts) { $scope.mas = hosts; });

    $scope.selected = null;
    $scope.select = function(host) {
        $scope.selected = host;

        hosts.getDetail(host).then(function(_host) {
            find_missing_services();    
        });

        //hide subbar if shown
        if($(".subbar").hasClass("subbar-shown")) {
            $(".subbar").removeClass("subbar-shown");
        }

        $scope.closesubbar();
        $location.update_path("/hosts/"+host._id);
        window.scrollTo(0,0);
    }
    $scope.add = function() {
        $scope.selected = hosts.add();
        $scope.closesubbar();
        find_missing_services();    
    }

    function find_missing_services() {
        //find service that are not yet added
        $scope.missing_services = [];
        for(var id in $scope.serverconf.service_types) {
            //see if this service is already registered
            var missing = true;
            $scope.selected.services.forEach(function(used_service) {
                if(used_service.type == id) missing = false;
            }); 
            if(missing) $scope.missing_services.push({
                id: id, 
                label: $scope.serverconf.service_types[id].label,
            });
        }
    }

    $scope.addservice = function() {
        $scope.selected.services.push({
            type: $scope.addservice_item.id,
            name: "tdb..", //TODO is service name used? maybe I should deprecate?
            locator: "",
        });
        find_missing_services();    
        $scope.addservice_item = null;
    }

    function clean_spec(specs) {
        for(var k in specs) {
            if(specs[k] === '') delete specs[k];
        }
    }

    $scope.submit = function() {
        //remove parameter set to empty string
        clean_spec($scope.selected.info);
        clean_spec($scope.selected.location);

        if(!$scope.selected._id) {
            hosts.create($scope.selected).then(function() {
                toaster.success("Host created successfully!");
                $scope.form.$setPristine();
            }).catch(function(res) {
                toaster.error(res.data.message||res.data.errmsg); 
            });
        } else {
            hosts.update($scope.selected).then(function() {
                toaster.success("Host updated successfully!");
                $scope.form.$setPristine();
            }).catch(function(res) {
                toaster.error(res.data.message||res.data.errmsg); 
            });
        }
    }
    $scope.cancel = function() {
        location.reload();
    }
    $scope.remove = function() {
        hosts.remove($scope.selected).then(function() {
            toaster.success("Removed successfully");
            $scope.selected = null;
        });
    }

    /*
    var mas = {};
    services.then(function(_services) { 
        $scope.services = _services;

        //create id>ma mapping for deref_ma
        if($scope.services.recs['ma']) $scope.services.recs['ma'].forEach(function(service) {
            mas[service.id] = service;
        });

        $scope.hosts = {};
        hosts.then(function(_hosts) {
            _hosts.forEach(function(host) {
            
                var services = [];
                //find all services that belongs to this host (and set _has_localma.. if the host has ma service)
                for(var service_id in _services.recs) {
                    _services.recs[service_id].forEach(function(service) {
                        if(service.client_uuid == host.uuid) services.push(service);
                        if(service.type == 'ma') host._has_localma = true;
                    });
                }
                services.forEach(deref_ma);
                $scope.hosts[host.uuid] = {
                    _detail: host,
                    services: services
                }
            });
            $scope.hosts_num = Object.keys($scope.hosts).length;
            $scope.loading = false;
        });
    });

    function deref_ma(service) {
        if(!service.ma) return;
        service.MA = mas[service.ma];
    }
    */

    /*
    $scope.edit = function(host) {
        var _host = angular.copy(host);
        var modal = $modal.open({
            animation: true,
            templateUrl: 't/host.html',
            controller: 'HostModalController',
            size: 'lg',
            resolve: {
                host: function() { return _host; },
                //title: function() { return _host.sitename + " (" +(host.hostname || host.ip) + ")"; },
            }
        });
        modal.result.then(function() {
            for(var k in _host) $scope.selected[k] = _host[k]; 
            //$scope.hosts[_host.uuid] = _host;
            //_host.services.forEach(deref_ma);
        }, function() {
            //failed?
        });
    }
    */
});

/*
app.controller('HostModalController', function($scope, appconf, toaster, $http, $modalInstance, host, hosts) {
    $scope.host = host;
    hosts.getMAs().then(function(hosts) {
        $scope.mas = hosts;
    });

    $scope.cancel = function() {
        if($scope.form.$dirty) {
            if(confirm("Do you want to abondon unsaved changes?")) {
                $modalInstance.dismiss('cancel');
            }
        } else {
            $modalInstance.dismiss('cancel');
        }
    }

    $scope.submit = function() {
        $http.put(appconf.api+'/hosts/'+host._id, $scope.host)
        .then(function(res) {
            $modalInstance.close();
            toaster.success("Updated Successfully!");
            $scope.form.$setPristine();
        }, function(res) {
            toaster.error(res.data.message);
        });   
    }
});
*/
