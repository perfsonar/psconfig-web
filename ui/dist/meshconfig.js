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
//    'ngOrderObjectBy',
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

app.config(function(uiSelectConfig) {
  uiSelectConfig.dropdownPosition = 'down';
})

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
    .otherwise({
        redirectTo: '/about'
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
    jwtInterceptorProvider.tokenGetter = function(jwtHelper, $http) {
        //don't send jwt for template requests (I don't think angular will ever load css/js - browsers do)
        //if (config.url.substr(config.url.length - 5) == '.html') return null;
        return localStorage.getItem(appconf.jwt_id);
    }
    $httpProvider.interceptors.push('jwtInterceptor');
}]);
 
//load menu and profile by promise chaining
app.factory('menu', ['appconf', '$http', 'jwtHelper', '$sce', 'scaMessage', 'scaMenu', 'toaster',
function(appconf, $http, jwtHelper, $sce, scaMessage, scaMenu, toaster) {

    var jwt = localStorage.getItem(appconf.jwt_id);
    var menu = {
        header: {},
        top: scaMenu,
        user: null, //to-be-loaded
    };
    if(appconf.icon_url) menu.header.icon = $sce.trustAsHtml("<img src=\""+appconf.icon_url+"\">");
    if(appconf.home_url) menu.header.url = appconf.home_url
    if(jwt) menu.user = jwtHelper.decodeToken(jwt);

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

app.filter('trim_locator', function() {
    return function(input) {
        var b = input.indexOf("//");
        if(~b) input = input.substr(b+2);
        var e = input.indexOf(":");
        if(~e) input = input.substr(0, e);
        return input;
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
        //console.dir(res.data);
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
    return $http.get(appconf.auth_api+'/profiles')
    //return $http.get(appconf.api+'/cache/profiles')
    .then(function(res) {
        var users = {};
        res.data.forEach(function(user) {
            //user.id = user.id.toString(); //id needs to be string for legacy reason
            user.id = user.id;
            users[user.id] = user;
        });
        return users;
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
        scope: { admins: '<', },
        templateUrl: 't/admins.html',
    } 
});

app.directive('mcSpecs', function() {
    return {
        scope: { specs: '<', },
        templateUrl: 't/specs.html',
    } 
});

app.directive('mcService', function() {
    return {
        scope: { ls: '<', service: '<', },
        templateUrl: 't/service.html',
    } 
});

app.directive('mcTests', function() {
    return {
        scope: { tests: '<', servicetypes: '<', /*testspecs: '=', hostgroups: '='*/},
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
        scope: { hosts: '<', serviceid: '<'},
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

app.controller('HeaderController', ['$scope', 'appconf', '$route', 'serverconf', 'menu',
function($scope, appconf, $route, serverconf, menu) {
    $scope.title = appconf.title;
    serverconf.then(function(_c) { $scope.serverconf = _c; });
    $scope.menu = menu;
    $scope.user = menu.user; //for app menu
}]);

app.controller('AboutController', ['$scope', 'appconf', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper',
function($scope, appconf, menu, serverconf, scaMessage, toaster, jwtHelper) {
    scaMessage.show(toaster);
    $scope.appconf = appconf;
}]);




app.controller('HostgroupsController', ['$scope', 'appconf', 'toaster', '$http', 'jwtHelper', 'serverconf', 'users', '$modal', 'scaMessage', 'hostgroups',
function($scope, appconf, toaster, $http, jwtHelper, serverconf, users, $modal, scaMessage, hostgroups) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);

    users.then(function(_users) {
        $scope.users = _users;
        hostgroups.then(function(_hostgroups) { $scope.hostgroups = _hostgroups});
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
            //apply change
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
            type: 'static',
            hosts: [],
            host_filter: "return false; //select none",
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
            console.log("adding hostgroupu to list");
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
        for(var id in $scope.users) {
            $scope.users_a.push($scope.users[id]);
        }
    });

    $scope.submit = function() {
        //find active tab
        for(var type in $scope.tabs) {
            if($scope.tabs[type].active) $scope.hostgroup.type = type;
        }

        //dynamic uses hosts as cache of the latest query result. let's use the validation result
        if($scope.hostgroup.type == 'dynamic') {
            $scope.hostgroup.hosts = $scope.hostgroup._hosts||[];
            //console.dir($scope.hostgroup.hosts);
        }

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
    
    //pick active tab
    $scope.tabs = {
        static: {active: false},
        dynamic: {active: false},
    };
    $scope.tabs[hostgroup.type].active = true;
}]);

//validator for host_filter ace
app.directive('hostfilter', function($q, $http, appconf) {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            var p = scope.$parent.$parent; //TODO - this feels very icky..
            ctrl.$asyncValidators.hostfilter = function(modelValue, viewValue) {
                //TODO this doesn't fire if empty.
                if (ctrl.$isEmpty(modelValue)) {
                    console.log("empty");
                    return $q.when();
                }

                var def = $q.defer();
                $http.get(appconf.api+'/cache/services-js/', {
                    params: { type: attrs.serviceType, js: modelValue, }
                })
                .then(function(res) {
                    p.hostgroup._hosts = res.data.recs;
                    p.host_filter_alert = null;
                    p.host_filter_console = res.data.c;
                    def.resolve();
                    console.dir(res.data);
                }, function(res) {
                    p.hostgroup._hosts = null;
                    p.host_filter_alert = null;
                    p.host_filter_console = null;
                    if(res.data.message) p.host_filter_alert = res.data.message;
                    def.reject();
                });   
                return def.promise;
            };
        }
    };
});




app.controller('HostsController', ['$scope', 'appconf', 'toaster', '$http', 'serverconf', '$location', 'scaMessage', 'services', 'hosts', '$modal', 
function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, services, hosts, $modal) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    $scope.loading = true;
    var mas = {};
    services.then(function(_services) { 
        $scope.services = _services;

        //create id>ma mapping for deref_ma
        if($scope.services.recs['ma']) $scope.services.recs['ma'].forEach(function(service) {
            mas[service.id] = service;
        });

        $scope.hosts = {};
        hosts.then(function(_hosts) {
            _hosts.forEach(function(host) {
            
                //massage toolkit_url
                //if(host.toolkit_url == 'auto') host._toolkit_url = "http://"+(host.hostname||host.ip);
                
                var services = [];
                //find all services that belongs to this host (and set _has_localma.. if the host has ma service)
                for(var service_id in _services.recs) {
                    _services.recs[service_id].forEach(function(service) {
                        if(service.client_uuid == host.uuid) services.push(service);
                        if(service.type == 'ma') host._has_localma = true;
                    });
                }
                services.forEach(deref_ma);
                $scope.hosts[host.uuid] = {
                    _detail: host,
                    services: services
                }
            });
            $scope.hosts_num = Object.keys($scope.hosts).length;
            $scope.loading = false;
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
                title: function() { return _host._detail.sitename + " (" +(host._detail.hostname || host._detail.ip) + ")"; },
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

app.controller('HostModalController', ['$scope', 'appconf', 'toaster', '$http', '$modalInstance', 'host', 'title', 'services', 
function($scope, appconf, toaster, $http, $modalInstance, host, title, services) {
    $scope.host = host;
    $scope.title = title;
    services.then(function(_services) { $scope.services = _services; }); //for host list

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    }

    $scope.submit = function() {
        //edit
        $http.put(appconf.api+'/cache/host/'+host._detail.uuid, $scope.host)
        .then(function(res) {
            $modalInstance.close();
            toaster.success("Updated Successfully!");
        }, function(res) {
            //console.dir(res);
            toaster.error(res.data.message);
        });   
    }
}]);


//show all testspecs
app.controller('TestspecsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$location', 'serverconf', 'scaMessage', 'users', 'testspecs', 
function($scope, appconf, $route, toaster, $http, jwtHelper, $location, serverconf, scaMessage, users, testspecs) {
    scaMessage.show(toaster);
    //menu.then(function(_menu) { $scope.menu = _menu; });
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;

    //TODO - will fail for guest user
    users.then(function(_users) {
        $scope.users = _users;
        testspecs.then(function(_testspecs) { $scope.testspecs = _testspecs; });
    });

    $scope.add = function(service_id) {
        $location.url("/testspec/new/"+service_id);
    }

    $scope.edit = function(testspec) {
        $location.url("/testspec/"+testspec.id);
    }
}]);

//test spec editor
app.controller('TestspecController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', '$location', 'users', '$routeParams', 'testspecs',
function($scope, appconf, $route, toaster, $http, jwtHelper, $location, users, $routeParams, testspecs) {
    $scope.id = $routeParams.id;
    $scope.appconf = appconf;

    testspecs.then(function(_testspecs) {
        $scope.testspecs = _testspecs;

        var jwt = localStorage.getItem(appconf.jwt_id);
        if(jwt && jwtHelper.decodeToken(jwt)) {
            users.then(function(_users) { 
                $scope.users = _users;
                $scope.users_a = [];
                for(var id in $scope.users) {
                    $scope.users_a.push($scope.users[id]);
                }
                load(jwtHelper.decodeToken(jwt));
            });
        } else {
            find_testspec();
        }
    });

    if($scope.id == 'new') {
        $scope.title = "New Test Spec";
    } else {
        $scope.title = "Update Test Spec";
    }

    function find_testspec() {
        /*
        $http.get(appconf.api+'/testspecs/'+$routeParams.id).then(function(res) {
            $scope.testspec = res.data;
            watch();
        });
        */
        //find the testscope that user wants to view/edit
        $scope.testspecs.forEach(function(testspec) {
            if(testspec.id == $routeParams.id) {
                //create a deep copy so that user's temporary change won't affect the testspecs content (until submitted)
                $scope.testspec = angular.copy(testspec);
            }
        });
        watch();
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
            find_testspec();
        }
    }

    function watch() {
        //some special behaviors on form
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
                console.log("no such field:"+k+" removing (maybe from bad default?)");
                delete $scope.testspec.specs[k];
            }
        }

        if(!$scope.testspec.id) {
            //create 
            $http.post(appconf.api+'/testspecs/', $scope.testspec)
            .then(function(res, status, headers, config) {
                $scope.testspec.id = res.data.id;
                $scope.testspec.canedit = res.data.canedit;
                $scope.testspecs.push($scope.testspec);
                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Testspec created successfully!");

            }, function(res, status, headers, config) {
                toaster.error("Creation failed!");
            });           
        } else {
            //update
            $http.put(appconf.api+'/testspecs/'+$scope.testspec.id, $scope.testspec)
            .then(function(res, status, headers, config) {
                
                //find the item user was editing
                $scope.testspecs.forEach(function(testspec) {
                    if(testspec.id == $scope.testspec.id) {   
                        //apply updates
                        for(var k in $scope.testspec) {
                            testspec[k] = $scope.testspec[k];
                        }
                        //console.dir($scope.testspecs);
                        //console.dir(res.data);
                        testspec.canedit = res.data.canedit;
                    }
                });

                $scope.form.$setPristine();
                $location.path("/testspecs");
                toaster.success("Updated Successfully!");

            }, function(res, status, headers, config) {
                toaster.error("Update failed!");
            });   
        }
    }
    $scope.cancel = function() {
        $location.path("/testspecs");
    }
    $scope.remove = function() {
        $http.delete(appconf.api+'/testspecs/'+$scope.testspec.id, $scope.testspec)
        .then(function(res, status, headers, config) {
            //find testspec and remove
            for(var i = 0;i < $scope.testspecs.length; ++i) {
                if($scope.testspecs[i].id == $scope.testspec.id) {
                    $scope.testspecs.splice(i, 1);
                    break;
                }
            }

            $scope.form.$setPristine();//ignore all changed made
            $location.path("/testspecs");
            toaster.success("Deleted Successfully!");
        }, function(res, status, headers, config) {
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
    //$scope.pub_url_base = location.hostname+location.pathname;

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
                for(var id in $scope.users) {
                    $scope.users_a.push($scope.users[id]);
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
                    if(test.nagroup) test.nagroup = test.nagroup.toString();
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

        /*
        //make sure URL doesn't conflict
        toaster.error("boo");
        return;
        */

        //some test paramter can be empty (like nagroup) which needs to be null not an empty string
        $scope.config.Tests.forEach(function(test) {
            for(var k in test) {
                if(test[k] === '') test[k] = null;
            }
        });

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
        delete test.nagroup;
        delete test.TestspecId;
    }
}]);


