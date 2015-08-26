'use strict';

/*
 * Right now, we are going to have a single module for our app which contains
 * all controllers. In the future, we should refactor into multiple modules. When I do, don't forget
 * to add it to app.js's module list
 * */

/*
var controllers = angular.module('profileControllers', [
    'ui.bootstrap',
]);
*/

app.controller('SettingsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$cookies', '$location',
function($scope, appconf, $route, toaster, $http, jwtHelper, $cookies, $location) {
    $scope.form_profile  = null; //to be loaded later

    //forward to auth page if jwt is missing
    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt == null || jwtHelper.isTokenExpired(jwt)) {
        localStorage.setItem('post_auth_redirect', window.location.toString());
        window.location = appconf.auth_url;
        return;
    }

    $http.get(appconf.api+'/public')
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
        $http.put(appconf.api+'/public', $scope.form_profile)
        .success(function(data, status, headers, config) {
            toaster.success(data.message);
        })
        .error(function(data, status, headers, config) {
            toaster.error(data.message);
        });         
    }

    //load menu
    //$scope.curpage = $location.path();
    $http.get(appconf.shared_api+'/menu')
    .success(function(menu) {
        $scope.menu = menu;
        $scope.settings_menu = menu[0];
    });
}]);



