app.factory('services', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    var label_c = 0;
    function get_class() {
        switch(label_c++ % 5) {
        case 0: return "label-primary"; break;
        case 1: return "label-success"; break;
        case 2: return "label-info"; break;
        case 3: return "label-warning"; break;
        case 4: return "label-danger"; break;
        }
    }

    return $http.get(appconf.api+'/services')
    .then(function(res) {
        //assign label_classes
        for(var lsid in res.data.lss) {
            res.data.lss[lsid].label_class = get_class();
        };
        return res.data;
    });
}]);

app.directive('mcAdmins', function() {
    return {
        scope: { admins: '=', },
        templateUrl: 't/admins.html',
    } 
});

app.directive('mcHosts', ['services', function(services) {
    return {
        scope: { hosts: '=', serviceid: '=' },
        templateUrl: 't/hosts.html',
        link: function(scope, element, attrs) {
            scope._hosts = [];
            services.then(function(_services) {
                scope.services = _services;
                //convert list of host ids to service record
                scope.hosts.forEach(function(id) {
                    //look for the serviceid
                    _services.recs[scope.serviceid].forEach(function(rec) {
                        if(rec.id == id) scope._hosts.push(rec);
                    });
                });
            });
        }
    } 
}]);

app.controller('HeaderController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'serverconf',
function($scope, appconf, $route, toaster, $http, jwtHelper, serverconf) {
    $scope.title = appconf.title;
    serverconf.then(function(_c) { $scope.serverconf = _c; });
}]);

app.controller('AboutController', ['$scope', 'appconf', 'menu', 'serverconf',
function($scope, appconf, menu, serverconf) {
    menu.then(function(_menu) { 
        $scope.menu = _menu; 
        console.log("menu loaded");
    });
    serverconf.then(function(_c) { $scope.serverconf = _c; });
}]);

app.controller('HomeController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', 'serverconf',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, serverconf) {
    menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_c) { $scope.serverconf = _c; });
}]);

