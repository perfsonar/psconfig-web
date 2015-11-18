'use strict';

var app = angular.module('app', [
    'app.config',
    'ngRoute',
    'ngAnimate',
    'ngCookies',
    'toaster',
    'angular-loading-bar',
    'angular-jwt',
    'ui.select',
    'sca-shared',
    'ui.bootstrap',
    'ngOrderObjectBy',
    'ui.gravatar',
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
}]).run(['$rootScope', '$location', 'toaster', 'jwtHelper', 'appconf', 'scaMessage',
function($rootScope, $location, toaster, jwtHelper, appconf, scaMessage) {
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
    jwtInterceptorProvider.tokenGetter = function(jwtHelper, config, $http, toaster) {
        //don't send jwt for template requests (I don't think angular will ever load css/js - browsers do)
        if (config.url.substr(config.url.length - 5) == '.html') return null;
        return localStorage.getItem(appconf.jwt_id);
    }
    $httpProvider.interceptors.push('jwtInterceptor');
}]);
 
//load menu and profile by promise chaining
//http://www.codelord.net/2015/09/24/$q-dot-defer-youre-doing-it-wrong/
//https://www.airpair.com/angularjs/posts/angularjs-promises
app.factory('menu', ['appconf', '$http', 'jwtHelper', '$sce', 'scaMessage', 'scaMenu', '$q', 'toaster',
function(appconf, $http, jwtHelper, $sce, scaMessage, scaMenu, $q, toaster) {

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
        _profile: null, //to-be-loaded
    };
    if(appconf.icon_url) menu.header.icon = $sce.trustAsHtml("<img src=\""+appconf.icon_url+"\">");
    if(appconf.home_url) menu.header.url = appconf.home_url

    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt) {
        var expdate = jwtHelper.getTokenExpirationDate(jwt);
        var ttl = expdate - Date.now();
        if(ttl < 0) {
            toaster.error("Your login session has expired. Please re-sign in");
            localStorage.removeItem(appconf.jwt_id);
        } else {
            menu.user = jwtHelper.decodeToken(jwt);
            if(ttl < 3600*1000) {
                //jwt expring in less than an hour! refresh!
                console.log("jwt expiring in an hour.. refreshing first");
                $http({
                    url: appconf.auth_api+'/refresh',
                    //skipAuthorization: true,  //prevent infinite recursion
                    //headers: {'Authorization': 'Bearer '+jwt},
                    method: 'POST'
                }).then(function(response) {
                    var jwt = response.data.jwt;
                    localStorage.setItem(appconf.jwt_id, jwt);
                    menu.user = jwtHelper.decodeToken(jwt);
                });
            }
        }
    }

    if(menu.user) {
        $http.get(appconf.profile_api+'/public/'+menu.user.sub).then(function(res) {
            menu._profile = res.data;
            if(res.data) {
                //logged in, but does user has email?
                if(res.data.email) {
                    return menu; //TODO - return return to what?
                } else {
                    //force user to update profile
                    //TODO - do I really need to?
                    scaMessage.info("Please update your profile before using application.");
                    sessionStorage.setItem('profile_settings_redirect', window.location.toString());
                    document.location = appconf.profile_url;
                }
            } else {
                //not logged in.
                return menu; //TODO return to what?
            }
        });
    }
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

//just a service to load all users from auth service
app.factory('serverconf', ['appconf', '$http', function(appconf, $http) {
    return $http.get(appconf.api+'/config')
    .then(function(res) {
        return res.data;
    });
}]);
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

    return $http.get(appconf.api+'/cache/services')
    .then(function(res) {
        //assign label_classes
        for(var lsid in res.data.lss) {
            res.data.lss[lsid].label_class = get_class();
        };

        //set old flag on hosts that haven't been updated lately
        var now = new Date();
        var old = new Date(now.getTime() - 1000*3600); //1 hour old enough?
        for(var type in res.data.recs) {
            res.data.recs[type].forEach(function(service) {
                if(Date.parse(service.updatedAt) < old) service.old = true;
            });
        }
        return res.data;
    });
}]);
app.factory('hosts', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    return $http.get(appconf.api+'/cache/hosts')
    .then(function(res) {
        return res.data;
    });
}]);
app.factory('users', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    return $http.get(appconf.api+'/cache/profiles')
    .then(function(res) {
        return res.data;
    }, function(res) {
        //console.log(res.statusText);
    });
}]);
app.factory('testspecs', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    return $http.get(appconf.api+'/testspecs')
    .then(function(res) {
        return res.data;
    });
}]);
app.factory('hostgroups', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    return $http.get(appconf.api+'/hostgroups')
    .then(function(res) {
        return res.data;
    });
}]);

app.directive('mcAdmins', function() {
    return {
        scope: { admins: '=', },
        templateUrl: 't/admins.html',
    } 
});

app.directive('mcSpecs', function() {
    return {
        scope: { specs: '=', },
        templateUrl: 't/specs.html',
    } 
});

app.directive('mcService', function() {
    return {
        scope: { ls: '=', service: '=', },
        templateUrl: 't/service.html',
    } 
});

app.directive('mcTests', function() {
    return {
        scope: { tests: '=', servicetypes: '=', /*testspecs: '=', hostgroups: '='*/},
        templateUrl: 't/tests.html',
        controller: function($scope, services) {
            services.then(function(_services) { 

                //find the service specified via uuid        
                $scope.get_service = function(uuid) {
                    for(var type in _services.recs) {
                        var recs = _services.recs[type];
                        for(var i = 0;i < recs.length;i++) {
                            if(recs[i].uuid == uuid) return recs[i];
                        };
                    }
                    return null;
                }
            }); 
        }
    } 
});

app.directive('mcHostlist', ['services', function(services) {
    return {
        scope: { hosts: '=', serviceid: '='},
        templateUrl: 't/hostlist.html',
        link: function(scope, element, attrs) {
            //link only gets executed once. I need to watch hosts list myself in case it changes
            function update() {
                scope._hosts = [];
                services.then(function(_services) {
                    scope.services = _services;
                    //convert list of host ids to service record
                    scope.hosts.forEach(function(id) {
                        //look for the serviceid
                        _services.recs[scope.serviceid].forEach(function(rec) {
                            if(rec.uuid == id) scope._hosts.push(rec);
                        });
                    });
                });
            }
            scope.$watch('hosts', function(nv, ov) {
                update();
            });
        }
    } 
}]);

app.controller('HeaderController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'serverconf', 'menu',
function($scope, appconf, $route, toaster, $http, jwtHelper, serverconf, menu) {
    $scope.title = appconf.title;
    serverconf.then(function(_c) { $scope.serverconf = _c; });
    $scope.menu = menu;
    $scope.user = menu.user; //for app menu
}]);

app.controller('AboutController', ['$scope', 'appconf', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper',
function($scope, appconf, menu, serverconf, scaMessage, toaster, jwtHelper) {
    scaMessage.show(toaster);
    //menu.then(function(_menu) { $scope.menu = _menu; });
    $scope.appconf = appconf;

    /*
    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt) { $scope.user = jwtHelper.decodeToken(jwt); }
    */

}]);




app.controller('HostgroupsController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'serverconf', 'users', '$modal', 'scaMessage',
function($scope, appconf, toaster, $http, jwtHelper, serverconf, users, $modal, scaMessage) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);

    users.then(function(_users) {
        $scope.users = _users;
        return $http.get(appconf.api+'/hostgroups' /*,{cache: true}*/).then(function(res) {
            $scope.hostgroups = res.data;
            return $scope.hostgroups;  //just to be more promise-ish
        });
    });

    $scope.edit = function(_hostgroup) {
        if(!_hostgroup.canedit) {
            toaster.error("You need to be listed as an admin in order to edit this testspec");
            return;
        }

        var hostgroup = angular.copy(_hostgroup);
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 't/hostgroup.html',
            controller: 'HostgroupModalController',
            size: 'lg',
            resolve: {
                hostgroup: function () {
                    return hostgroup;
                },
                title: function() {
                    return "Update Host Group";
                },
            }
        });
        modalInstance.result.then(function() {
            for(var k in hostgroup) {
                _hostgroup[k] = hostgroup[k];
            }
        }, function (code) {
            if(code == "remove") {
                for(var i = 0;i < $scope.hostgroups.length; ++i) {
                    if($scope.hostgroups[i].id == hostgroup.id) {
                        $scope.hostgroups.splice(i, 1);
                        break;
                    }
                }
            }
        });
    }

    $scope.create = function(service_type) {
        var hostgroup = {
            service_type: service_type,
            admins: [ $scope.users[user.sub] ], //select current user as admin
            hosts: [],
            desc: "",
        };
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 't/hostgroup.html',
            controller: 'HostgroupModalController',
            size: 'lg',
            resolve: {
                hostgroup: function () {
                    return hostgroup;
                },
                title: function() {
                    return "New Hostgroup";
                },
            }
        });
        modalInstance.result.then(function() {
            $scope.hostgroups.push(hostgroup);
        }, function (code) {
            //console.log("dismiss code"+code);
        });
    }
}]);

app.controller('HostgroupModalController', ['$scope', 'appconf', 'toaster', '$http', '$modalInstance', 'hostgroup', 'title', 'services', 'serverconf', 'users',
function($scope, appconf, toaster, $http, $modalInstance, hostgroup, title, services, serverconf, users) {
    $scope.hostgroup = hostgroup;
    $scope.title = title;
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });

    //profiles.then(function(_profiles) { $scope.profiles = _profiles; }); //for admin list
    services.then(function(_services) { $scope.services = _services; }); //for host list

    users.then(function(_users) {
        $scope.users = _users;
        $scope.users_a = [];
        for(var sub in $scope.users) {
            $scope.users_a.push($scope.users[sub]);
        }
    });


    /*
    function getdata() {
        //create a copy of $scope.testspec so that UI doesn't break while saving.. (why just admins?)
        var data = angular.copy($scope.hostgroup);
        data.admins = [];
        $scope.hostgroup.admins.forEach(function(admin) {
            if(admin) data.admins.push(admin.sub);
        });
        return data;
    }
    */

    $scope.submit = function() {
        if(!$scope.hostgroup.id) {
            //create 
            $http.post(appconf.api+'/hostgroups/', $scope.hostgroup)
            .then(function(res) {
                $modalInstance.close();
                toaster.success("Hostgroup created successfully!");
                $scope.hostgroup.canedit = res.data.canedit;
                $scope.hostgroup.id = res.data.id;
            }, function(res) {
                toaster.error(res.data.message);
            });           
        } else {
            //edit
            $http.put(appconf.api+'/hostgroups/'+$scope.hostgroup.id, $scope.hostgroup)
            .then(function(res) {
                $modalInstance.close();
                toaster.success("Updated Successfully!");
                $scope.hostgroup.canedit = res.data.canedit;
            }, function(res) {
                toaster.error(res.data.message);
            });   
        }
    }
    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/hostgroups/'+$scope.hostgroup.id)
        .then(function(res) {
            $modalInstance.dismiss('remove');
            toaster.success("Deleted Successfully!");
        }, function(res) {
            toaster.error(res.data.message);
        });       
    }
}]);




app.controller('HostsController', ['$scope', 'appconf', 'toaster', '$http', 'serverconf', '$location', 'scaMessage', 'services', 'hosts', '$modal', 
function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, services, hosts, $modal) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

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
        
        var modal = $modal.open({
            animation: true,
            templateUrl: 't/host.html',
            controller: 'HostModalController',
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

app.controller('HostModalController', ['$scope', 'appconf', 'toaster', '$http', '$modalInstance', 'host', 'title', 'services', 'serverconf',
function($scope, appconf, toaster, $http, $modalInstance, host, title, services, serverconf) {
    $scope.host = host;
    $scope.title = title;
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


//show all testsspecs
app.controller('TestspecsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$location', 'serverconf', 'scaMessage', 'users',
function($scope, appconf, $route, toaster, $http, jwtHelper, $location, serverconf, scaMessage, users) {
    scaMessage.show(toaster);
    //menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    //TODO - will fail for guest user
    users.then(function(_users) {
        $scope.users = _users;
        return $http.get(appconf.api+'/testspecs' /*,{cache: true}*/).then(function(res) {
            $scope.testspecs = res.data;
            return $scope.testspecs;  //just to be more promise-ish
        });
    });

    $scope.add = function(service_id) {
        $location.url("/testspec/new/"+service_id);
    }

    $scope.edit = function(testspec) {
        $location.url("/testspec/"+testspec.id);
    }
}]);

//test spec editor
app.controller('TestspecController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$location', 'users', '$routeParams',
function($scope, appconf, $route, toaster, $http, jwtHelper, $location, users, $routeParams) {
    $scope.id = $routeParams.id;
    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt && jwtHelper.decodeToken(jwt)) {
        users.then(function(_users) { 
            $scope.users = _users;
            $scope.users_a = [];
            for(var sub in $scope.users) {
                $scope.users_a.push($scope.users[sub]);
            }
            load(jwtHelper.decodeToken(jwt));
        });
    } else {
        load_guest();
    }

    if($scope.id == 'new') {
        $scope.title = "New Test Spec";
    } else {
        $scope.title = "Update Test Spec";
    }

    function load_guest() {
        $http.get(appconf.api+'/testspecs/'+$routeParams.id).then(function(res) {
            $scope.testspec = res.data;
            watch();
        });
    }
    function load(user) {
        if($scope.id == "new") {
            //new
            var service_type = $routeParams.service_type;
            $scope.testspec = {
                service_type: service_type,
                admins: [ $scope.users[user.sub] ], //select current user as admin
                specs: $scope.serverconf.defaults.testspecs[service_type],
                desc: "",
            };
            watch();
        } else {
            //update
            load_guest();
        }
    }

    function watch() {
        //some special behaviors
        $scope.$watch(function() { 
            return $scope.testspec.specs.ipv4_only 
        }, function(nv, ov) {
            if(nv) {
                delete $scope.testspec.specs.ipv6_only;
            }
        });
        $scope.$watch(function() { 
            return $scope.testspec.specs.ipv6_only 
        }, function(nv, ov) {
            if(nv) {
                delete $scope.testspec.specs.ipv4_only;
            }
        });
    }

    $scope.submit = function() {
        //remove parameter set to empty string
        for(var k in $scope.testspec.specs) {
            if($scope.testspec.specs[k] === '') delete $scope.testspec.specs[k];
        }

        //TODO - remove parameters that aren't shown on the UI
        for(var k in $scope.testspec.specs) {
            if($scope.form[k] === undefined) {
                console.log("no such field:"+k+" removing");
                delete $scope.testspec.specs[k];
            }
        }
        if(!$scope.testspec.id) {
            //create 
            $http.post(appconf.api+'/testspecs/', $scope.testspec)
            .then(function(data, status, headers, config) {
                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Testspec created successfully!");
            }, function(data, status, headers, config) {
                toaster.error("Creation failed!");
            });           
        } else {
            //edit
            $http.put(appconf.api+'/testspecs/'+$scope.testspec.id, $scope.testspec)
            .then(function(data, status, headers, config) {
                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Updated Successfully!");
            }, function(data, status, headers, config) {
                toaster.error("Update failed!");
            });   
        }
    }
    $scope.cancel = function() {
        $location.path("/testspecs");
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/testspecs/'+$scope.testspec.id, $scope.testspec)
        .then(function(data, status, headers, config) {
            $scope.form.$setPristine();//ignore all changed made
            $location.path("/testspecs");
            toaster.success("Deleted Successfully!");
        }, function(data, status, headers, config) {
            toaster.error("Deletion failed!");
        });       
    }
}]);




app.controller('ConfigsController', ['$scope', 'appconf', 'toaster', '$http', 'serverconf', '$location', 'scaMessage', 'services', 'jwtHelper', 'hosts',
function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, services, jwtHelper, hosts) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    hosts.then(function(_hosts) { $scope.hosts = _hosts; });

    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt && jwtHelper.decodeToken(jwt)) {
        $scope.cancreate = true;
    }
    
    //start loading stuff
    var testspecs, hostgroups;
    $http.get(appconf.api+'/testspecs/').then(function(res) {
        testspecs = res.data; 
        return $http.get(appconf.api+'/hostgroups/');
    }).then(function(res) {
        hostgroups = res.data;
        return $http.get(appconf.api+'/configs');
    }).then(function(res) {
        $scope.configs = res.data;
        //deref testspecs / hostgroups 
        $scope.configs.forEach(function(config) {
            config.Tests.forEach(function(test) {
                testspecs.forEach(function(_testspec) {
                    if(test.TestspecId == _testspec.id) test.testspec = _testspec; 
                });
                hostgroups.forEach(function(_hostgroup) {
                    if(test.agroup == _hostgroup.id) test.agroup = _hostgroup;
                    if(test.bgroup == _hostgroup.id) test.bgroup = _hostgroup;
                    if(test.nagroup == _hostgroup.id) test.nagroup = _hostgroup;
                });
            });
        });
    });
    
    $scope.addconfig = function() {
        $location.url("/config/new");
    }
    $scope.edit = function(config) {
        $location.url("/config/"+config.id);
    }
    $scope.autoconf = function(host) {
        var address = host.hostname || host.ip;
        document.location = appconf.pub_url+"/auto/"+address;
    }
}]);

app.controller('ConfigController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'serverconf', '$routeParams', '$location', 'services', 'users', 'testspecs', 'hostgroups',
function($scope, appconf, toaster, $http, jwtHelper, serverconf, $routeParams, $location, services, users, testspecs, hostgroups) {
    $scope.id = $routeParams.id;
    $scope.appconf = appconf;

    //load stuff
    //TODO while we are loading stuff, config template gets rendered and ui-select does odd things if the users list aren't loaded yet
    //doc talks about using resolver inside the route config, but I want to keep stuff inside the controller.. how can I?
    maybe_load_users(function() {
        services.then(function(_services) { 
            $scope.services = _services; 
            testspecs.then(function(testspecs) { 
                $scope.testspecs = testspecs;
                hostgroups.then(function(hostgroups) { 
                    $scope.hostgroups = hostgroups;
                    load_config();
                });
            });
        });
    });

    function maybe_load_users(cb) {
        var jwt = localStorage.getItem(appconf.jwt_id);
        if(jwt && jwtHelper.decodeToken(jwt)) {
            users.then(function(_users) { 
                $scope.users = _users;
                $scope.users_a = [];
                for(var sub in $scope.users) {
                    $scope.users_a.push($scope.users[sub]);
                }
                //cb(jwtHelper.decodeToken(jwt));
                cb();
            });
        } else cb();
    }
    
    function load_config(user) {
        if($scope.id == "new") {
            //new config
            var jwt = localStorage.getItem(appconf.jwt_id);
            var user = jwtHelper.decodeToken(jwt);
            $scope.config = {
                admins: [ $scope.users[user.sub] ], //select current user as admin
                Tests: [],
                canedit: true, 
            }
        } else {
            //updating config
            $http.get(appconf.api+'/configs/'+$routeParams.id).then(function(res) {
                $scope.config = res.data;
                res.data.Tests.forEach(function(test) {
                    //angular wants value key to be string
                    if(test.TestspecId) test.TestspecId = test.TestspecId.toString();
                    if(test.agroup) test.agroup = test.agroup.toString();
                    if(test.bgroup) test.bgroup = test.bgroup.toString();
                });
            });
        }
    }

    $scope.cancel = function() {
        //TODO - form modify alert?
        $location.url("/configs");
    }

    /*
    //is this needed still?
    function getdata() {
        //create a copy of $scope.testspec so that UI doesn't break while saving.. (just admins?)
        var data = angular.copy($scope.config);
        return data;
    }
    */

    $scope.submit = function() {
        if(!$scope.config.id) {
            //create 
            $http.post(appconf.api+'/configs/', $scope.config)
            .then(function(res) {
                $scope.form.$setPristine();
                $location.url("/configs");
                toaster.success("Config created successfully!");
            }, function(res) {
                toaster.error(res.data.message);
            });           
        } else {
            //edit
            $http.put(appconf.api+'/configs/'+$scope.config.id, $scope.config)
            .then(function(res) {
                $scope.form.$setPristine();
                $location.url("/configs");
                toaster.success("Updated Successfully!");
            }, function(res) {
                if(res.data) toaster.error(res.data.message);
                else {
                    toaster.error("Failed to update config");
                    console.dir(res);
                }
            });   
        }
    }
    $scope.addtest = function() {
        $scope.config.Tests.push({
            //id: null,
            desc: "",
            enabled: true,
            mesh_type: "mesh",
        });
    }
    $scope.removetest = function(test) {
        var idx = $scope.config.Tests.indexOf(test);
        $scope.config.Tests.splice(idx, 1);
        $scope.form.$setDirty();
        //toaster.success("Removed Test!");
    }

    $scope.remove = function() {
        $http.delete(appconf.api+'/configs/'+$scope.id)
        .then(function(res) {
            $scope.form.$setPristine();//ignore all changed made
            $location.url("/configs");
            toaster.success("Deleted Successfully!");
        }, function(res) {
            toaster.error(res.data.message);
        });       
    }
    $scope.get_selected_testspec = function(id) {
        for(var i = 0;i < $scope.testspecs.length; ++i) {
            if($scope.testspecs[i].id == id) return $scope.testspecs[i];
        }
    }
    $scope.get_hostgroup = function(id) {
        for(var i = 0;i < $scope.hostgroups.length; ++i) {
            if($scope.hostgroups[i].id == id) return $scope.hostgroups[i];
        }
    }
    $scope.reset_servicetype = function(test) {
        delete test.agroup;
        delete test.bgroup;
        delete test.TestspecId;
    }
}]);


