
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

