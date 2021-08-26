app.directive("scaprofile", function () {
    return {
        template:
            '<img gravatar-src="profile.email" width="14"></img> {{profile.fullname}} <a ng-if="email" href="mailto:{{profile.email}}">&lt;{{profile.email}}&gt;</a>',
        scope: { id: "<", email: "<" },
        controller: function ($scope, profile) {
            if ($scope.email === undefined) $scope.email = true; //show by default

            $scope.$watch("id", function () {
                if ($scope.id) {
                    //console.log("loading sca profile from "+$scope.id);
                    $scope.profile = profile.get($scope.id);
                }
            });
        },
    };
});

app.directive("mcHostlist", function (hosts) {
    return {
        scope: { hostids: "<" },
        templateUrl: "t/hostlist.html",
        link: function ($scope, element, attrs) {
            //link only gets executed once. I need to watch hosts list myself in case it changes
            $scope._hosts = [];
            hosts
                .getAll({ select: "hostname sitename lsid" })
                .then(function (_hosts) {
                    $scope.hosts = {}; //key by host._id
                    _hosts.forEach(function (host) {
                        $scope.hosts[host._id] = host;
                    });
                });
            /*
            scope.$watch('hosts', function(nv, ov) {
                update();
            });
            */
        },
    };
});

app.directive("mcService", function () {
    return {
        scope: { ls: "<", service: "<" },
        templateUrl: "t/service.html",
    };
});

app.directive("mcTests", function () {
    return {
        scope: {
            tests: "<",
            servicetypes: "<" /*testspecs: '=', hostgroups: '='*/,
        },
        templateUrl: "t/tests.html",
        controller: function ($scope, services) {
            services.then(function (_services) {
                //find the service specified via uuid
                $scope.get_service = function (uuid) {
                    for (var type in _services.recs) {
                        var recs = _services.recs[type];
                        for (var i = 0; i < recs.length; i++) {
                            if (recs[i].uuid == uuid) return recs[i];
                        }
                    }
                    return null;
                };
            });
        },
    };
});

app.directive("mcAdmins", function () {
    return {
        scope: { admins: "<" },
        templateUrl: "t/admins.html",
    };
});

app.directive("mcSpecs", function () {
    return {
        scope: { specs: "<", readonly: "<", form: "<" },
        templateUrl: "t/specs.html",
        controller: function ($scope) {
            $scope.remove = function (key) {
                if ($scope.form) $scope.form.$setDirty();
                delete $scope.specs[key];
            };
            $scope.add = function () {
                $scope.specs[$scope.k] = $scope.v;

                //reset
                $scope.k = "";
                $scope.v = "";
                delete $scope.adding;
            };
        },
    };
});

app.directive("minver", function () {
    return {
        scope: { min: "<" },
        template:
            '<span ng-if="min" class="label label-warning" title="Only Supported by perfSONAR >v{{min}}">v{{min}}</span>',
    };
});

//used to convert string to number for input type="number"
//https://docs.angularjs.org/error/ngModel/numfmt
app.directive("stringToNumber", function () {
    return {
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {
            /*
            ngModel.$parsers.push(function(value) {
                return '' + value;
            });
            */
            ngModel.$formatters.push(function (value) {
                return parseFloat(value);
            });
        },
    };
});
