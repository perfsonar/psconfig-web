app.directive('scaprofile', function() {
    return {
        template: '<img gravatar-src="profile.email" width="14"></img> {{profile.fullname}} <a ng-if="email" href="mailto:{{profile.email}}">&lt;{{profile.email}}&gt;</a>',
        scope: { id: '<', email: '<'},
        controller: function($scope, profile) {
            if($scope.email === undefined) $scope.email = true; //show by default

            $scope.$watch('id', function() {
                if($scope.id) {
                    //console.log("loading sca profile from "+$scope.id);
                    $scope.profile = profile.get($scope.id);
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

