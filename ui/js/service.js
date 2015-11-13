
app.controller('ServicesController', ['$scope', 'appconf', 'toaster', '$http', 'serverconf', '$location', 'scaMessage', 'services', 'jwtHelper', 'hosts', '$modal', 
function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, services, jwtHelper, hosts, $modal) {
    scaMessage.show(toaster);
    //menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt) {
        var user = jwtHelper.decodeToken(jwt);
        /*
        //TODO - I should probably let server figure out.
        if(user && ~user.scopes.common.indexOf("admin")) {
            $scope.canedit = true;
        }
        */
    }

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
                var services = [];
                //find all services that belongs to this host
                for(var service_id in _services.recs) {
                    _services.recs[service_id].forEach(function(service) {
                        if(service.client_uuid == host.uuid) services.push(service);
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
        //console.dir($scope.services);
        $scope.services.recs["ma"].forEach(function(service) {
            if(service.client_uuid == _host._detail.uuid) _host.default_ma = service;
        });
        
        /*
        //if ma is not specified, pick local MA
        _host.services.forEach(function(service) {
            if(!service.ma) service.ma = ma;
        });
        */

        var modal = $modal.open({
            animation: true,
            templateUrl: 't/service.html',
            controller: 'ServiceModalController',
            size: 'lg',
            resolve: {
                host: function() { return _host; },
                title: function() { return _host._detail.sitename; },
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

app.controller('ServiceModalController', ['$scope', 'appconf', 'toaster', '$http', '$modalInstance', 'host', 'title', 'services', 'serverconf',
function($scope, appconf, toaster, $http, $modalInstance, host, title, services, serverconf) {
    $scope.host = host;
    $scope.title = title;
    //serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    //profiles.then(function(_profiles) { $scope.profiles = _profiles; }); //for admin list
    services.then(function(_services) { $scope.services = _services; }); //for host list

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    }

    function getdata() {
        return $scope.host;
    }

    $scope.submit = function() {
        //edit
        $http.put(appconf.api+'/cache/host/'+host._detail.uuid, getdata())
        .then(function(res) {
            $modalInstance.close();
            toaster.success("Updated Successfully!");
        }, function(res) {
            //console.dir(res);
            toaster.error(res.data.message);
        });   
    }
}]);
