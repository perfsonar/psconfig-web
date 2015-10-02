
app.controller('HeaderController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'serverconf',
function($scope, appconf, $route, toaster, $http, jwtHelper, serverconf) {
    $scope.title = appconf.title;
    serverconf.then(function(_c) { $scope.serverconf = _c; });
}]);

app.controller('AboutController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', 'serverconf',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, serverconf) {
    serverconf.then(function(_c) { $scope.serverconf = _c; });
    menu.then(function(_menu) { $scope.menu = _menu; });
}]);

app.controller('HomeController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', 'serverconf',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, serverconf) {
    menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_c) { $scope.serverconf = _c; });
}]);

