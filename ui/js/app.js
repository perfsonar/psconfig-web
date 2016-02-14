'use strict';

var app = angular.module('app', [
    'app.config',
    'ngRoute',
    'ngAnimate',
    'ngCookies',
    //'ngMessages',
    'toaster',
    'angular-loading-bar',
    'angular-jwt',
    'ui.bootstrap',
    'ui.select',
    'sca-shared',
    'ngOrderObjectBy',
    'ui.gravatar',
    'ui.ace',
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

/* attempt to get ui-select's required flag working.. didn't work
app.directive('uiSelect', function() {
    return {
        restrict: 'EA',
        require: '?ngModel',
        link: function (scope, element, attrs, ctrl) {
            //if (ctrl && angular.isDefined(attrs.multiple)) {
            if (ctrl) {
                ctrl.$isEmpty = function(value) {
                    return !value || value.length === 0;
                };
            }
        }
    };
});
*/

//http://stackoverflow.com/questions/14852802/detect-unsaved-changes-and-alert-user-using-angularjs
app.directive('confirmOnExit', function() {
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
    /*
    .when('/home', {
        templateUrl: 't/home.html',
        controller: 'HomeController',
        requiresLogin: true,
    })
    */
    .when('/testspecs', {
        templateUrl: 't/testspecs.html',
        controller: 'TestspecsController',
        requiresLogin: true,
    })
    .when('/testspec/:id/:service_type?', {
        templateUrl: 't/testspec.html',
        controller: 'TestspecController'
    })
    .when('/hostgroups', {
        templateUrl: 't/hostgroups.html',
        controller: 'HostgroupsController',
        requiresLogin: true,
    })
    .when('/configs', {
        templateUrl: 't/configs.html',
        controller: 'ConfigsController'
    })
    .when('/config/:id', {
        templateUrl: 't/config.html',
        controller: 'ConfigController'
    })
    .when('/hosts', {
        templateUrl: 't/hosts.html',
        controller: 'HostsController'
    })
    /*
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
}]).run(['$rootScope', '$location', 'jwtHelper', 'appconf', 'scaMessage',
function($rootScope, $location, jwtHelper, appconf, scaMessage) {

    //console.log("application starting");

    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        //console.log("route changed from "+current+" to :"+next);
        //redirect to /login if user hasn't authenticated yet
        if(next.requiresLogin) {
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt == null || jwtHelper.isTokenExpired(jwt)) {
                scaMessage.info("Please login first");
                sessionStorage.setItem('auth_redirect', window.location.toString());
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
        //don't send jwt for template requests (I don't think angular will ever load css/js - browsers do)
        if (config.url.substr(config.url.length - 5) == '.html') return null;
        return localStorage.getItem(appconf.jwt_id);
    }
    $httpProvider.interceptors.push('jwtInterceptor');
}]);
 
//load menu and profile by promise chaining
app.factory('menu', ['appconf', '$http', 'jwtHelper', '$sce', 'scaMessage', 'scaMenu', 'toaster',
function(appconf, $http, jwtHelper, $sce, scaMessage, scaMenu, toaster) {

    var jwt = localStorage.getItem(appconf.jwt_id);
    var menu = {
        header: {
            //label: appconf.title,
            /*
            icon: $sce.trustAsHtml("<img src=\""+appconf.icon_url+"\">"),
            url: appconf.home_url,
            */
        },
        top: scaMenu,
        user: null, //to-be-loaded
        //_profile: null, //to-be-loaded
    };
    if(appconf.icon_url) menu.header.icon = $sce.trustAsHtml("<img src=\""+appconf.icon_url+"\">");
    if(appconf.home_url) menu.header.url = appconf.home_url
    if(jwt) menu.user = jwtHelper.decodeToken(jwt);

    /*
    if(menu.user) {
        $http.get(appconf.profile_api+'/public/'+menu.user.sub).then(function(res) {
            menu._profile = res.data;
        });
    }
    */
    return menu;
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
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
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

app.filter('specname',function(){
    return function(input){
        if(input) return input.replace(new RegExp('_', 'g'), ' ');
    }
});
