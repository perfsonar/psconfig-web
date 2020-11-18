app.controller('ConfigsController',
function($scope, appconf, toaster, $http, $location, scaMessage, users, hosts, hostgroups, configs, $routeParams, testspecs, archives) {
    scaMessage.show(toaster);
    $scope.active_menu = "configs";
    $scope.show_map = false;
    $scope.importStatus = {};
    $scope.importer_url = null;

    //start loading things (should I parallelize)
    users.getAll().then(function(_users) {
        $scope.users = _users;

        testspecs.getAll().then(function(_testspecs) {
            $scope.testspecs = _testspecs;

            hostgroups.getAll().then(function(_hostgroups) {
                $scope.hostgroups = _hostgroups;

                archives.getAll().then(function(_archives) {
                    $scope.all_archives = _archives;

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
        var test = {
            name: "",
            desc: "",
            enabled: true,
            service_type: "owamp",
            mesh_type: "mesh",
        }
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
            //console.log("config to update", config);
            var importer_content = config.importer_content;
            //console.log("importer_content", importer_content);
                //console.log("ma_custom before: ", config.ma_custom_json);
                if ( ( "ma_urls" in config ) && _.isArray( config.ma_urls ) ) {
                    config.ma_urls = config.ma_urls.join("\n");
                }
                var custom_json = config.ma_custom_json;
                //console.log("custom_MA json", custom_json);

                
                if(isJSON(config.ma_custom_json)){
                    config.ma_custom_json = custom_json;
                    //console.log("ma_custom after: ", config.ma_custom_json);
                    toaster.success("config updated successfully!");
                    $scope.form.$setPristine();
                }
                else{
                    throw "Invalid custom JSON";
                }
            }).catch( function( err ) {
                //console.log("err", err);
                $scope.toast_error(err);
            });
        }
    }
    
    function isJSON(archive){
	if(!archive) return true;
	try{
        	JSON.parse(archive);
    	}
    	catch(err){
        	return false;
    	}
    	return true;
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

    $scope.setImportType = function( status ) {
        var name = status.name;
        var val = status.value;
        $scope[ name ] = val;
        $scope.$apply();

    };

    $scope.myFileSelected = null;
    $scope.fileSelected = function (element) {
            $scope.myFileSelected = element.files[0];
            if ( $scope.myFileSelected ) {
                $scope.fileIsSelected = true;

            }
            $scope.$apply();
    };

    $scope.import = function() {
        var uri = appconf.api+'/configs/import';
        var data;
        var reqOptions = {};
        var userFile = $scope.myFileSelected;
        var importStatus = $scope.importStatus;
        // urlOpen: false
        // uploadOpen: true
        // rawOpen: false
        //data._pwa_import= {};
        if ( importStatus.rawOpen && $scope.importer_content ) {
            data = {"content": JSON.parse($scope.importer_content)};
            uri += 'JSON';
        } else if ( importStatus.urlOpen && $scope.importer_url ) {
            data = {"url": $scope.importer_url};
        }  else if ( importStatus.uploadOpen && userFile ) {
            //data = {"url": $scope._pwa_import.importer_url};
            var formData = new FormData();
            //formData.append('file', element[0].files[0]);
            //TODO: fix formData
            formData.append('file', userFile);
            formData.append("content", "{}");
            data = formData;
            uri += "File";
            reqOptions.headers = {'Content-Type': undefined , transformRequest: angular.identity};
        }

        //console.log("data", data);
        $http.put(uri, data, reqOptions)
        .then(function(res) {
            console.log(res.data.tests);
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
                        $scope.selected.tests.push(test);
                    });
                    $scope.form.$setDirty();
                    toaster.success(res.data.msg);
                })
            });
        }).catch(function(res) {
            console.error(res);
            console.log("Oops. Failed to import specified URL.");

            toaster.error("Oops. Failed to import specified URL.", res.data.message);
        });
    }
});


