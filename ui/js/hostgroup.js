
app.controller('HostgroupsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'profile', 'menu', 
function($scope, appconf, $route, toaster, $http, jwtHelper, profile, menu) {
    profile.then(function(_profile) { $scope.profile = _profile; });
    menu.then(function(_menu) { $scope.menu = _menu; });

    $scope.hosts = [];
    $scope.addresses = [{name: "hello"}, {name: "world"}];
    $scope.refreshAddresses = function(address) {
        var params = {address: address, sensor: false};
        return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {params: params})
        .then(function(response) {
            console.dir(response.data.results);
            $scope.addresses = response.data.results
        });
    }
}]);

