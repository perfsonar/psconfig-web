
app.controller('HostsController', ['$scope', 'appconf', 'toaster', '$http', 'serverconf', '$location', 'scaMessage', 'services', 'hosts', '$modal', 
function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, services, hosts, $modal) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    var mas = {};
    services.then(function(_services) { 
        $scope.services = _services;

        //create id>ma mapping for deref_ma
        $scope.services.recs['ma'].forEach(function(service) {
            mas[service.id] = service;
        });

        $scope.hosts = {};
        hosts.then(function(_hosts) {
            _hosts.forEach(function(host) {
            
                //massage toolkit_url
                //if(host.toolkit_url == 'auto') host._toolkit_url = "http://"+(host.hostname||host.ip);
                
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
        });
    });

    function deref_ma(service) {
        if(!service.ma) return;
        service.MA = mas[service.ma];
    }

    $scope.edit = function(host) {
        var _host = angular.copy(host);

        //find *local* MA
        _host.default_ma = null;
        $scope.services.recs["ma"].forEach(function(service) {
            if(service.client_uuid == _host._detail.uuid) _host.default_ma = service;
        });
        
        var modal = $modal.open({
            animation: true,
            templateUrl: 't/host.html',
            controller: 'HostModalController',
            size: 'lg',
            resolve: {
                host: function() { return _host; },
                title: function() { return _host._detail.sitename + " (" +(host._detail.hostname || host._detail.ip) + ")"; },
            }
        });
        modal.result.then(function() {
            $scope.hosts[_host._detail.uuid] = _host;
            _host.services.forEach(deref_ma);
        }, function() {
            //failed?
        });
    }
}]);

app.controller('HostModalController', ['$scope', 'appconf', 'toaster', '$http', '$modalInstance', 'host', 'title', 'services', 
function($scope, appconf, toaster, $http, $modalInstance, host, title, services) {
    $scope.host = host;
    $scope.title = title;
    services.then(function(_services) { $scope.services = _services; }); //for host list

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    }

    $scope.submit = function() {
        //edit
        $http.put(appconf.api+'/cache/host/'+host._detail.uuid, $scope.host)
        .then(function(res) {
            $modalInstance.close();
            toaster.success("Updated Successfully!");
        }, function(res) {
            //console.dir(res);
            toaster.error(res.data.message);
        });   
    }
}]);
