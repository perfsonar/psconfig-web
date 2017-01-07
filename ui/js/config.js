
app.controller('ConfigsController', 
function($scope, appconf, toaster, $http, $location, scaMessage, users, hosts, hostgroups, configs, $routeParams, testspecs) {
    scaMessage.show(toaster);
    $scope.active_menu = "configs";

    //start loading things (should I parallelize)
    users.getAll().then(function(_users) {
        $scope.users = _users;

        testspecs.getAll().then(function(_testspecs) { 
            $scope.testspecs = _testspecs; 

            hosts.getAll().then(function(_hosts) {
                $scope.hosts = _hosts;

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
    });
    
    $scope.selected = null;
    $scope.select = function(config) {
        $scope.selected = config; 
        $scope.closesubbar();
        //hide subbar if it's hidden optionally for narrow view
        $location.update_path("/configs/"+config._id);
        window.scrollTo(0,0);

        /*
        //load dynamic hostgroups hosts
        $scope.selected.tests.forEach(function(test) {
            load_dynamic(test.agroup);
            load_dynamic(test.bgroup);
        });
        */
    }

    /*
    function load_dynamic(gid, cb) {
        if(!gid) return;
        var group = $scope.gethostgroup(gid);
        if(group.type == "dynamic") {
            console.log("dynamic group found");
            $http.get($scope.appconf.api+'/hostgroups/dynamic', {
                params: { type: group.service_type, js: group.host_filter, }
            })
            .then(function(res) {
                group.hosts = res.data.recs;
            }, function(res) {
                console.log("failed to run dynamic query");
            });       
        }
    }
    */

    $scope.add = function() {
        //$location.url("/config/new");
        $scope.selected = configs.add();
        $scope.closesubbar();
    }
    $scope.addtest = function() {
        $scope.selected.tests.push({
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

    $scope.getselectedhosts = function(test) {
        var hostids = [];
        if(test.agroup) $scope.gethostgroup(test.agroup).hosts.forEach(function(id) {
            hostids.push(id);
        });
        if(test.bgroup) $scope.gethostgroup(test.bgroup).hosts.forEach(function(id) {
            hostids.push(id);
        });
        //console.dir(hostids);

        //convert to host objects
        var hosts = [];
        if($scope.hosts) $scope.hosts.forEach(function(host) {
            if(~hostids.indexOf(host._id)) hosts.push(host);
        });
        return hosts;
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
            configs.create($scope.selected).then(function() {
                toaster.success("config created successfully!");
                $scope.form.$setPristine();
            }).catch(function(res) {
                toaster.error(res.data.message||res.data.errmsg); 
            });
        } else {
            configs.update($scope.selected).then(function() {
                toaster.success("config updated successfully!");
                $scope.form.$setPristine();
            }).catch(function(res) {
                toaster.error(res.data.message||res.data.errmsg); 
            });
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
        //document.location = appconf.pub_url+"auto/"+address;
    }
});


