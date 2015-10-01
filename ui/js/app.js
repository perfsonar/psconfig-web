'use strict';

var app = angular.module('app', [
    'app.config',
    'ngSanitize',
    'ngRoute',
    'ngAnimate',
    'ngCookies',
    'toaster',
    'angular-loading-bar',
    'angular-jwt',
    'ui.select',
    'sca-shared',
]);

//http://plnkr.co/edit/YWr6o2?p=preview
app.directive('ngConfirmClick', [
    function() {
        return {
            link: function (scope, element, attr) {
                var msg = attr.ngConfirmClick || "Are you sure?";
                var clickAction = attr.confirmedClick;
                element.bind('click',function (event) {
                    if ( window.confirm(msg) ) {
                        scope.$eval(clickAction)
                    }
                });
            }
        };
    }
])


//show loading bar at the top
app.config(['cfpLoadingBarProvider', '$logProvider', function(cfpLoadingBarProvider, $logProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
}]);

//configure route
app.config(['$routeProvider', 'appconf', function($routeProvider, appconf) {
    //console.log("router provider");
    $routeProvider.
    when('/about', {
        templateUrl: 't/about.html',
        controller: 'AboutController'
    })
    .when('/home', {
        templateUrl: 't/home.html',
        controller: 'HomeController',
        requiresLogin: true,
    })
    .when('/testspecs', {
        templateUrl: 't/testspecs.html',
        controller: 'TestspecsController',
        requiresLogin: true,
    })
    .when('/testspec/:id', {
        templateUrl: 't/testspec.html',
        controller: 'TestspecController',
        requiresLogin: true,
    })
    .when('/newtestspec/:service_type', {
        templateUrl: 't/testspec.html',
        controller: 'TestspecController',
        requiresLogin: true,
    })
    /*
    when('/login', {
        templateUrl: 't/login.html',
        controller: 'LoginController'
    })
    .when('/success', {
        templateUrl: 't/empty.html',
        controller: 'SuccessController'
    })
    .when('/resetpass', {
        templateUrl: 't/resetpass.html',
        controller: 'ResetpassController'
    })
    */
    .otherwise({
        redirectTo: '/about'
    });
    
    //console.dir($routeProvider);
}]).run(['$rootScope', '$location', 'toaster', 'jwtHelper', 'appconf', function($rootScope, $location, toaster, jwtHelper, appconf) {
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        //console.log("route changed from "+current+" to :"+next);
        //redirect to /login if user hasn't authenticated yet
        if(next.requiresLogin) {
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt == null || jwtHelper.isTokenExpired(jwt)) {
                //TODO - use $cookies.set("messages") to send messages to user service ("please login first" or such..)
                localStorage.setItem('post_auth_redirect', window.location.toString());
                window.location = appconf.auth_url;
                event.preventDefault();
            }
        }
    });
}]);

//configure httpProvider to send jwt unless skipAuthorization is set in config (not tested yet..)
app.config(['appconf', '$httpProvider', 'jwtInterceptorProvider', 
function(appconf, $httpProvider, jwtInterceptorProvider) {
    jwtInterceptorProvider.tokenGetter = function(jwtHelper, config, $http) {
        //don't send jwt for template requests
        if (config.url.substr(config.url.length - 5) == '.html') {
            return null;
        }
        var jwt = localStorage.getItem(appconf.jwt_id);
        if(!jwt) return null; //not jwt

        //TODO - I should probably put this in $interval instead so that jwt will be renewed regardless
        //of if user access server or not.. (as long as the page is opened?)
        //(also, make it part of shared or auth module?)
        var expdate = jwtHelper.getTokenExpirationDate(jwt);
        var ttl = expdate - Date.now();
        if(ttl < 0) {
            console.log("jwt expired");
            return null;
        } else if(ttl < 3600*1000) {
            //console.dir(config);
            console.log("jwt expiring in an hour.. refreshing first");
            //jwt expring in less than an hour! refresh!
            return $http({
                url: appconf.auth_api+'/refresh',
                skipAuthorization: true,  //prevent infinite recursion
                headers: {'Authorization': 'Bearer '+jwt},
                method: 'POST'
            }).then(function(response) {
                var jwt = response.data.jwt;
                //console.log("got renewed jwt:"+jwt);
                localStorage.setItem(appconf.jwt_id, jwt);
                return jwt;
            });
        }
        return jwt;
    }
    $httpProvider.interceptors.push('jwtInterceptor');
}]);

