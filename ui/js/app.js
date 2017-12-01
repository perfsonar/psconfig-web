'use strict';

var app = angular.module('app', [
    'app.config',
    'ngRoute',
    'ngAnimate',
    'ngCookies',
    'toaster',
    'angular-loading-bar',
    'angular-jwt',
    'ui.bootstrap',
    'ui.select',
    'sca-shared',
    'ui.gravatar',
    'ui.ace',
    'ngLocationUpdate',
    'yaru22.angular-timeago',
    'uiGmapgoogle-maps'
]);

//can't quite do the slidedown animation through pure angular/css.. borrowing slideDown from jQuery..
app.animation('.slide-down', ['$animateCss', function($animateCss) {
    return {
        enter: function(elem, done) {
            $(elem).hide().slideDown("slow", done);
        },
        leave: function(elem, done) {
            $(elem).slideUp("slow", done);
        }
    };
}]);

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

//http://stackoverflow.com/questions/14852802/detect-unsaved-changes-and-alert-user-using-angularjs
app.directive('confirmOnExit', function($window, $location) {
    return {
        //scope: { form: '=', },
        link: function($scope, elem, attrs) {
            window.onbeforeunload = function(){
                if ($scope.form.$dirty) {
                    return "You have unsaved changes.";
                }
            }
            $scope.$on('$locationChangeStart', function(event, next, current) {
                if ($scope.form.$dirty) {
                    if(!confirm("Do you want to abondon unsaved changes?")) {
                        event.preventDefault();
                        //TODO controller might have already changed selected item on the menu.. 
                        //I somehow need to revert, but not sure how..
                    } else {
                        $scope.form.$setPristine();
                        $window.location.reload();  //to load previous content
                    }
                }
            });
        }
    };
});

//http://stackoverflow.com/questions/14544741/how-can-i-make-an-angularjs-directive-to-stoppropagation
app.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if(attr && attr.stopEvent) {
                element.bind(attr.stopEvent, function (e) {
                    e.stopPropagation();
                });
            }
        }
    };
});


app.config(function(uiSelectConfig) {
  uiSelectConfig.dropdownPosition = 'down';
})

app.config(function(appconf, uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: appconf.google_map_api,
        //v: '3.20', //defaults to latest 3.X anyhow
        //libraries: 'weather,geometry,visualization'
    });
})

//show loading bar at the top
app.config(['cfpLoadingBarProvider', '$logProvider', function(cfpLoadingBarProvider, $logProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
}]);

//configure route
app.config(['$routeProvider', 'appconf', function($routeProvider, appconf) {
    $routeProvider.
    /*
    when('/about', {
        templateUrl: 't/about.html',
        controller: 'AboutController',
        requiresLogin: true,
    })
    .*/
    when('/testspecs/:id?', {
        templateUrl: 't/testspecs.html',
        controller: 'TestspecsController',
        requiresLogin: true,
    })
    .when('/hostgroups/:id?', {
        templateUrl: 't/hostgroups.html',
        controller: 'HostgroupsController',
        requiresLogin: true,
    })

    .when('/configs/:id?', {
        templateUrl: 't/configs.html',
        controller: 'ConfigsController',
        requiresLogin: true,
    })
    .when('/hosts/:id?', {
        templateUrl: 't/hosts.html',
        controller: 'HostsController',
        requiresLogin: true,
    })
    .otherwise({
        redirectTo: '/configs'
    });
}]).run(['$rootScope', '$location', 'jwtHelper', 'appconf', 'scaMessage',
function($rootScope, $location, jwtHelper, appconf, scaMessage) {
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        //console.log("route changed from "+current+" to :"+next);
        //redirect to /login if user hasn't authenticated yet
        if(next.requiresLogin) {
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt == null || jwtHelper.isTokenExpired(jwt)) {
                scaMessage.info("Please login first");
                sessionStorage.setItem('auth_redirect', $location.absUrl());
                //sessionStorage.setItem('auth_redirect', window.location.toString());
                window.location = appconf.auth_url;
                event.preventDefault();
            }
        }
    });
}]);

//configure httpProvider to send jwt unless skipAuthorization is set in config (not tested yet..)
app.config(['appconf', '$httpProvider', 'jwtInterceptorProvider', 
function(appconf, $httpProvider, jwtInterceptorProvider) {
    jwtInterceptorProvider.tokenGetter = function(jwtHelper, $http) {
        //don't send jwt for template requests (I don't think angular will ever load css/js - browsers do)
        //if (config.url.substr(config.url.length - 5) == '.html') return null;
        return localStorage.getItem(appconf.jwt_id);
    }
    $httpProvider.interceptors.push('jwtInterceptor');
}]);

//http://plnkr.co/edit/juqoNOt1z1Gb349XabQ2?p=preview
/**
 * AngularJS default filter with the following expression:
 * "person in people | filter: {name: $select.search, age: $select.search}"
 * performs a AND between 'name: $select.search' and 'age: $select.search'.
 * We want to perform a OR.
 */
app.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        var itemMatches = false;

        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop] && item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
});

//https://gist.github.com/Shipow/7880369
app.filter('orderObjectBy', function(){
    return function(input, attribute) {
        if (!angular.isObject(input)) return input;
        var array = [];
        for(var objectKey in input) {
            array.push(input[objectKey]);
        }
        array.sort(function(a, b){
            a = parseInt(a[attribute]);
            b = parseInt(b[attribute]);
            return a - b;
        });
        return array;
    }
});

app.filter('specname',function(){
    return function(input){
        if(input) return input.replace(new RegExp('_', 'g'), ' ');
    }
});

app.filter('trim_locator', function() {
    return function(input) {
        if(!input) return input;
        var b = input.indexOf("//");
        if(~b) input = input.substr(b+2);
        var e = input.indexOf(":");
        if(~e) input = input.substr(0, e);
        return input;
    }
});

app.directive('meshName', function ( ) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue) {
                var field = attrs.name;
                scope.field = field;
                if (viewValue.indexOf("/") !== -1) {
                    ctrl.$setValidity(scope.field, false);
                    return undefined;
                } else {
                    ctrl.$setValidity(scope.field, true);
                    return viewValue;
                }
            });
        }
    };
});


//http://stackoverflow.com/questions/21311401/angularjs-get-element-in-controller
app.directive('hostmap', function (uiGmapGoogleMapApi) {
    return {
        restrict:"E", 
        link: function($scope, elem, attrs) {
            uiGmapGoogleMapApi.then(function(maps) { 
                var mapOptions = {
                    zoom: 4,
                    center: new maps.LatLng(40.0000, -98.0000),
                    mapTypeId: maps.MapTypeId.TERRAIN
                }
                $scope.map = new maps.Map(elem[0], mapOptions);
            });
        }
    };
})
