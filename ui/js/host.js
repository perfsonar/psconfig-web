
app.controller('HostsController', function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, hosts, $modal, $routeParams) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;
    $scope.active_menu = "hosts";

    $scope.loading = true;
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

    $scope.selected = null;
    $scope.select = function(host) {
        $scope.selected = host;
        hosts.getDetail(host).then(function(_host) {
            //console.log("loaded");
            //find ma service
            _host.services.forEach(function(service) {
                if(service.type == "ma") _host._default_ma = service;
            });    
        });

        if($(".subbar").hasClass("subbar-shown")) {
            $(".subbar").removeClass("subbar-shown");
        }

        $location.update_path("/hosts/"+host._id);
        window.scrollTo(0,0);
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

    $scope.edit = function(host) {
        var _host = angular.copy(host);

        /*
        _host.default_ma = null;
        scope.services.forEach(function(service) {
            if(service.client_uuid == _host.uuid) _host.default_ma = service;
        });
        */
        
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
});

app.controller('HostModalController', function($scope, appconf, toaster, $http, $modalInstance, host, hosts) {
    $scope.host = host;
    //$scope.title = title;
    //services.then(function(_services) { $scope.services = _services; }); //for host list
    hosts.getMAs().then(function(hosts) {
        $scope.mas = hosts;
    });

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    }

    $scope.submit = function() {
        $http.put(appconf.api+'/hosts/'+host._id, $scope.host)
        .then(function(res) {
            $modalInstance.close();
            toaster.success("Updated Successfully!");
        }, function(res) {
            toaster.error(res.data.message);
        });   
    }
});
