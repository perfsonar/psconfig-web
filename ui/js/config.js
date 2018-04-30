
app.controller('ConfigsController',
function($scope, appconf, toaster, $http, $location, scaMessage, users, hosts, hostgroups, configs, $routeParams, testspecs, uiGmapGoogleMapApi, $timeout) {
    scaMessage.show(toaster);
    $scope.active_menu = "configs";
    $scope.show_map = false;

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

		    //delay showing map slightly to prevent gmap to miss resize event?
		    //TODO - figure out what's going on with gmap and fix it instead of this hack..
		    $timeout(()=>{
			$scope.show_map = true;
		    });
                });
            });
        });
    });

    $scope.selected = null;
    $scope.select = function(config) {
        $scope.selected = config;
        $scope.closesubbar();

        config.tests.forEach(function(test) {
            reset_map(test);
        });

        $location.update_path("/configs/"+config._id);
        window.scrollTo(0,0);
    }

    function reset_map(test) {
        test.map = {
            center: { latitude: 0, longitude: 0 }, zoom: 1, //world
            options: {
                scrollwheel: false,
            },
            markers: [],
        }
        load_hosts(test, function(hosts) {
            hosts.forEach(function(host) {
                var lat = host.info['location-latitude'];
                var lng = host.info['location-longitude'];
                if(lat && lng) {
                    test.map.markers.push({
                        id: host._id,
                        latitude: lat,
                        longitude: lng,
                    });
                }
            });
            //bounds = bounds.toJSON();
            //console.log("setting test.map");
            //test.map.bounds.northeast = {latitude: bounds.north, longitude: bounds.east};
            //test.map.bounds.southwest = {latitude: bounds.south, longitude: bounds.west};
            //console.dir(test.map.bounds);
        });
    }

    $scope.add = function() {
        $scope.selected = configs.add();
        $scope.closesubbar();
        $location.update_path("/configs");
    }
    $scope.addtest = function() {
        var test = {
            name: "",
            desc: "",
            enabled: true,
            service_type: "owamp",
            mesh_type: "mesh",
        }
        reset_map(test);
        $scope.selected.tests.push(test);
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
        var select = "sitename hostname lsid";
        var find = {};
        if(query) {
            find["services.type"] = test.service_type,
            find.$or = [
                {hostname: {$regex: query}},
                {sitename: {$regex: query}},
                {lsid: {$regex: query}},
            ];
        } else {
            if(test && test.center) find._id = test.center;
            else return;
        }
        return $http.get(appconf.api+'/hosts?select='+encodeURIComponent(select)+
            '&sort=sitename hostname&find='+encodeURIComponent(JSON.stringify(find)))
        .then(function(res) {
            $scope.hosts = res.data.hosts;
        });
    };

    function load_hosts(test, cb) {
        var hostids = [];
        if(test.agroup) $scope.gethostgroup(test.agroup).hosts.forEach(function(id) {
            hostids.push(id);
        });
        if(test.bgroup) $scope.gethostgroup(test.bgroup).hosts.forEach(function(id) {
            hostids.push(id);
        });
        if(test.center) hostids.push(test.center);

        //load hosts from hostids
        var select = "sitename hostname lsid info.location-latitude info.location-longitude";
        var find = {_id: {$in: hostids}};
        return $http.get(appconf.api+'/hosts?select='+encodeURIComponent(select)+
            '&find='+encodeURIComponent(JSON.stringify(find)))
        .then(function(res) {
            cb(res.data.hosts);
        });
    }

    $scope.refreshNAHosts = function(test) {
        reset_map(test);
        load_hosts(test, function(hosts) {
            $scope.na_hosts = hosts;
        });
    }

    $scope.refreshAutoHosts = function(query) {
        var select = "sitename hostname lsid";
        var find = {};
        if(query) {
            find.$or = [
                {hostname: {$regex: query}},
                {sitename: {$regex: query}},
                {lsid: {$regex: query}},
            ];
        } else return;
        return $http.get(appconf.api+'/hosts?select='+encodeURIComponent(select)+
            '&sort=sitename hostname&find='+encodeURIComponent(JSON.stringify(find)))
        .then(function(res) {
            $scope.hosts = res.data.hosts;
        });
    };

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
                config.ma_urls = config.ma_urls.join("\n");
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
        $http.put(appconf.api+'/configs/import', {url: $scope.importer_url})
        .then(function(res) {
            console.dir(res.data.tests);
            testspecs.clear();
            testspecs.getAll().then(function(_testspecs) {
                $scope.testspecs = _testspecs;
                if ( "config_params" in res.data ) {
                    if ( ( "archives" in res.data.config_params ) && ( res.data.config_params.archives.length > 0  ) ) {
                        $scope.selected.ma_urls = res.data.config_params.archives.join("\n");
                    }
                    if ( "description" in res.data.config_params ) {
                        $scope.selected.desc = res.data.config_params.description;
                    }
                }
                hostgroups.clear();
                hostgroups.getAll().then(function(_hostgroups) {
                    $scope.hostgroups = _hostgroups;

                    //now show tests
                    res.data.tests.forEach(function(test) {
                        $scope.refreshNAHosts(test);
                        $scope.refreshHosts(null, test);
                        reset_map(test);
                        $scope.selected.tests.push(test);
                    });
                    $scope.form.$setDirty();
                    toaster.success(res.data.msg);
                })
            });
        }).catch(function(res) {
            console.error(res);
            toaster.error("Oops. Failed to import specified URL.");
        });
    }
});


