
app.controller('ConfigsController',
function($scope, appconf, toaster, $http, $location, scaMessage, users, hosts, hostgroups, configs, $routeParams, testspecs) {
    scaMessage.show(toaster);
    $scope.active_menu = "configs";

    $scope.importer_url = "http://myosg.grid.iu.edu/psmesh/json/name/us-cms"; //default

    //start loading things (should I parallelize)
    users.getAll().then(function(_users) {
        $scope.users = _users;

        testspecs.getAll().then(function(_testspecs) {
            $scope.testspecs = _testspecs;

            hostgroups.getAll().then(function(_hostgroups) {
                $scope.hostgroups = _hostgroups;

                configs.getAll().then(function(_configs) {
                    $scope.configs = _configs;
                    if($routeParams.id) {
                        $scope.configs.forEach(function(config) {
                            if(config._id == $routeParams.id) $scope.select(config);
                        });
                    } else {
                        //select first one
                        if($scope.configs.length > 0) $scope.select($scope.configs[0]);
                    }
                });
            });
        });
    });

    $scope.selected = null;
    $scope.select = function(config) {
        $scope.selected = config;
        $scope.closesubbar();
        $location.update_path("/configs/"+config._id);
        window.scrollTo(0,0);
    }

    $scope.add = function() {
        $scope.selected = configs.add();
        $scope.closesubbar();
        $location.update_path("/configs");
    }
    $scope.addtest = function() {
        $scope.selected.tests.push({
            name: "",
            desc: "",
            enabled: true,
            service_type: "owamp",
            mesh_type: "mesh",
        });
        $scope.form.$setDirty();
    }
    $scope.gethostgroup = function(id) {
        var it = null;
        $scope.hostgroups.forEach(function(hostgroup) {
            if(hostgroup._id == id) it = hostgroup;
        });
        return it;
    }

    $scope.serviceChange = function(test) {
        test.agroup = null;
        test.bgroup = null;
        test.center = null;
        test.nahosts = [];
    }

    $scope.refreshHosts = function(query, test) {
        console.log("refreshing hosts");
        var select = "sitename hostname lsid";
        var find = {
            "services.type": test.service_type,
        }
        if(query) {
            find.$or = [
                {hostname: {$regex: query}},
                {sitename: {$regex: query}},
                {lsid: {$regex: query}},
            ];
        } else {
            if(test && test.center) find._id = test.center;
            else return;
        }
        console.dir(find);
        return $http.get(appconf.api+'/hosts?select='+encodeURIComponent(select)+
            '&sort=sitename hostname&find='+encodeURIComponent(JSON.stringify(find)))
        .then(function(res) {
            $scope.hosts = res.data.hosts;
        });
    };

    $scope.refreshNAHosts = function(test) {
        console.log("refreshing na hosts");
        var hostids = [];
        if(test.agroup) $scope.gethostgroup(test.agroup).hosts.forEach(function(id) {
            hostids.push(id);
        });
        if(test.bgroup) $scope.gethostgroup(test.bgroup).hosts.forEach(function(id) {
            hostids.push(id);
        });
        if(test.center) hostids.push(test.center);
    
        //load hosts from hostids
        var select = "sitename hostname lsid";
        var find = {_id: {$in: hostids}};
        return $http.get(appconf.api+'/hosts?select='+encodeURIComponent(select)+
            '&find='+encodeURIComponent(JSON.stringify(find)))
        .then(function(res) {
            $scope.na_hosts = res.data.hosts;
        });
        /*
        if($scope.hosts) $scope.hosts.forEach(function(host) {
            if(~hostids.indexOf(host._id)) hosts.push(host);
        });
        return hosts;
        */
    }
    $scope.getselectedtestspec = function(test) {
        var it = null;
        if($scope.testspecs) $scope.testspecs.forEach(function(testspec) {
            if(testspec._id == test.testspec) it = testspec;
        });
        return it;
    }

    $scope.removetest = function(test) {
        var idx = $scope.selected.tests.indexOf(test);
        $scope.selected.tests.splice(idx, 1);
        $scope.form.$setDirty();
    }

    $scope.submit = function() {
        if(!$scope.selected._id) {
            configs.create($scope.selected).then(function(config) {
                toaster.success("config created successfully!");
                $scope.form.$setPristine();
                $location.update_path("/configs/"+config._id);
            }).catch($scope.toast_error);
        } else {
            configs.update($scope.selected).then(function(config) {
                toaster.success("config updated successfully!");
                $scope.form.$setPristine();
            }).catch($scope.toast_error);
        }
    }
    $scope.cancel = function() {
        location.reload();
    }

    $scope.remove = function() {
        configs.remove($scope.selected).then(function() {
            toaster.success("Removed successfully");
            $scope.selected = null;
        });
    }

    $scope.autoconf = function(host) {
        var address = host.hostname || host.ip;
        window.open(appconf.pub_url+"auto/"+address, '_blank');
    }

    $scope.import = function() {
        console.log("importing", $scope.importer_url);
        $http.put(appconf.api+'/configs/import/'+$scope.selected._id, {url: $scope.importer_url})
        .then(function(res) {
            console.dir(res.data.tests);
            $scope.selected.tests = $scope.selected.tests.concat(res.data.tests);
            toaster.success(res.data.msg);
        });
    }
});


