'use strict';

/*
 * Right now, we are going to have a single module for our app which contains
 * all controllers. In the future, we should refactor into multiple modules. When I do, don't forget
 * to add it to app.js's module list
 * */

var controllers = angular.module('profileControllers', [
    'ui.bootstrap',
]);

controllers.controller('UserController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$cookies', //'jwt_refresher',
function($scope, appconf, $route, toaster, $http, jwtHelper, $cookies/*, jwt_refresher*/) {
    $scope.form_profile  = null; //to be loaded later

    $http.get(appconf.api+'/user/profile')
    .success(function(profile, status, headers, config) {
        //console.dir(profile);
        $scope.form_profile  = profile;
    })
    .error(function(data, status, headers, config) {
        if(data && data.message) {
            toaster.error(data.message);
        }
    }); 
    $scope.submit_profile = function() {
        $http.put(appconf.api+'/user/profile', $scope.form_profile)
        .success(function(data, status, headers, config) {
            toaster.success(data.message);
        })
        .error(function(data, status, headers, config) {
            toaster.error(data.message);
        });         
    }
}]);


