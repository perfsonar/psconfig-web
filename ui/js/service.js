
app.controller('ServicesController', ['$scope', 'appconf', 'toaster', '$http', 'menu', 'serverconf', 'profiles', '$location', 'scaMessage', 'services', 'jwtHelper', 'hosts', 
function($scope, appconf, toaster, $http, menu, serverconf, profiles, $location, scaMessage, services, jwtHelper, hosts) {
    scaMessage.show(toaster);
    menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });

    services.then(function(_services) { 
        $scope.services = _services;
        $scope.hosts = {};
        hosts.then(function(_hosts) {
            _hosts.forEach(function(host) {
                var services = [];
                //find all services that belongs to this host
                for(var service_id in _services.recs) {
                    _services.recs[service_id].forEach(function(service) {
                        if(service.client_uuid == host.uuid) services.push(service);
                    });
                }
                $scope.hosts[host.uuid] = {
                    _detail: host,
                    services: services
                }
            });
            console.dir($scope.hosts);
        });
    });

    $scope.appconf = appconf;
}]);

