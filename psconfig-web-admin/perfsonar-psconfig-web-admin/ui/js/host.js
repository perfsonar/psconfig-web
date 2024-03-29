app.controller(
    "HostsController",
    function (
        $scope,
        appconf,
        toaster,
        $http,
        serverconf,
        $location,
        scaMessage,
        hosts,
        $modal,
        $routeParams,
        users,
        $cookies,
        archives
    ) {
        scaMessage.show(toaster);
        serverconf.then(function (_serverconf) {
            $scope.serverconf = _serverconf;
        });
        $scope.appconf = appconf;
        $scope.active_menu = "hosts";
        $scope.loading = true;
        $scope.hosts_filter = $cookies.get("hosts_filter");
        $scope.address_families = [
            { id: "4", name: "ipv4" },
            { id: "6", name: "ipv6" },
        ];
        $scope.selectedFamily = [];
        $scope.newAddressFamily = $scope.address_families[0];
        $scope.newAddress = "";

        $scope.refreshHosts = function (query, service) {
            var select = "sitename hostname lsid services";
            var find = {};
            if (query) {
                find.$or = [
                    { hostname: { $regex: query } },
                    { sitename: { $regex: query } },
                    { lsid: { $regex: query } },
                ];
            } else {
                /*
            //only search for what's already selected
            */
                if (service && service.ma) find._id = service.ma;
                else return;
            }
            //console.dir(find);
            return $http
                .get(
                    appconf.api +
                        "/hosts?select=" +
                        encodeURIComponent(select) +
                        "&sort=sitename hostname&find=" +
                        encodeURIComponent(JSON.stringify(find))
                )
                .then(function (res) {});
        };

        //load users for admin
        users.getAll().then(function (_users) {
            archives.getAll().then(function (_archives) {
                $scope.all_archives = _archives;
                console.log("all_archives", _archives);

                $scope.users = _users;
                hosts.getAll().then(function (_hosts) {
                    $scope.hosts = _hosts;
                    $scope.loading = false;
                    console.log("all hosts", _hosts);
                    // TODO: load all archives here

                    //select specified host
                    if ($routeParams.id) {
                        _hosts.forEach(function (host) {
                            if (host._id == $routeParams.id) {
                                $scope.select(host);
                            }
                        });
                        //scroll element to view - after this apply cycle is complete
                        setTimeout(function () {
                            var item = document.getElementById($routeParams.id);
                            if (item) item.scrollIntoView(true);
                        }, 0);
                    } else $scope.select(_hosts[0]); //select first one then
                });
            });
        });

        $scope.selected = null;
        $scope.select = function (host) {
            $scope.selected = host;

            hosts.getDetail(host).then(function (_host) {
                find_missing_services();
                $scope.addresses = _host.addresses;

                $scope.addresses.forEach(function (address, i) {
                    $scope.address_families.forEach(function (family, j) {
                        if (family.id == address.family) {
                            $scope.selectedFamily[i] =
                                $scope.address_families[j];
                        }
                    });
                });

                $scope.refreshHosts();
            });

            //load hostgroups that this host is member of
            $http
                .get(
                    appconf.api +
                        "/hostgroups?select=" +
                        encodeURIComponent("name desc service_type") +
                        "&find=" +
                        encodeURIComponent(JSON.stringify({ hosts: host._id }))
                )
                .then(function (res) {
                    $scope.hostgroups = res.data.hostgroups;

                    //then load tests that these hostgroups are used in
                    var hostgroup_ids = $scope.hostgroups.map(function (
                        hostgroup
                    ) {
                        return hostgroup._id;
                    });
                    //console.dir(hostgroup_ids);
                    $http
                        .get(
                            appconf.api +
                                "/configs?populate=" +
                                encodeURIComponent("tests.testspec") +
                                "&select=" +
                                encodeURIComponent("name desc url tests") +
                                "&find=" +
                                encodeURIComponent(
                                    JSON.stringify({
                                        $or: [
                                            {
                                                "tests.agroup": {
                                                    $in: hostgroup_ids,
                                                },
                                            },
                                            {
                                                "tests.bgroup": {
                                                    $in: hostgroup_ids,
                                                },
                                            },
                                            { "tests.center": host._id },
                                        ],
                                    })
                                )
                        )
                        .then(function (res) {
                            $scope.configs = res.data.configs;
                        });
                });

            //hide subbar if shown
            if ($(".subbar").hasClass("subbar-shown")) {
                $(".subbar").removeClass("subbar-shown");
            }

            $scope.addresses = host.addresses;

            $scope.closesubbar();
            $location.update_path("/hosts/" + host._id);
            window.scrollTo(0, 0);
        };
        $scope.add = function () {
            $scope.selected = hosts.add();
            $scope.closesubbar();
            $location.update_path("/hosts");
            find_missing_services();
            clear_addresses();
        };

        function clear_addresses() {
            $scope.addresses = [];
            $scope.selectedFamily = [];
        }

        $scope.setFamilyValue = function (formFamily, index) {
            var options = $scope.address_families;

            var addresses = $scope.addresses;
            var address = addresses[index];

            for (var i in options) {
                var opt = options[i];
                if (formFamily != null && formFamily[index].id == opt.id) {
                    $scope.selectedFamily[index] = opt;
                    $scope.addresses[index].family = opt.id;
                    return $scope.selectedFamily;
                }
            }
            //$scope.selectedOption = $scope.options[1];

            //var def = $scope.serverconf.defaults.testspecs[type];
            //$scope.selected.specs = angular.copy(def);
        };

        $scope.filter_hosts = function (hosts) {
            if (!hosts) return; //not loaded yet?
            $cookies.put("hosts_filter", $scope.hosts_filter);

            return hosts.filter(function (host) {
                if ($scope.selected == host) return true; //always show selected one
                if (!$scope.hosts_filter) return true; //show all

                if (!host.hostname) {
                    console.log("host with invalid hostname");
                    console.dir(host);
                    return false; //shouldn't happen but it does..
                }

                var hostname = host.hostname.toLowerCase();
                var sitename = host.sitename.toLowerCase();
                var lsid = host.lsid ? host.lsid.toLowerCase() : "adhoc";

                //all tokens must match somewhere
                var tokens = $scope.hosts_filter.toLowerCase().split(" ");
                var accept = true;
                tokens.forEach(function (token) {
                    var match = false;
                    if (~hostname.indexOf(token)) match = true;
                    if (~sitename.indexOf(token)) match = true;
                    if (lsid && ~lsid.indexOf(token)) match = true;
                    if (!match) accept = false;
                });
                return accept;
            });
        };

        function find_missing_services() {
            //find service that are not yet added
            $scope.missing_services = [];
            for (var id in $scope.serverconf.service_types) {
                //see if this service is already registered
                var missing = true;
                $scope.selected.services.forEach(function (used_service) {
                    if (used_service.type == id) missing = false;
                });
                if (missing)
                    $scope.missing_services.push({
                        id: id,
                        label: $scope.serverconf.service_types[id].label,
                    });
            }

            //also inject MA service
            var found_ma = false;
            $scope.selected.services.forEach(function (used_service) {
                if (used_service.type == "ma") found_ma = true;
            });
            if (!found_ma)
                $scope.missing_services.push({
                    id: "ma",
                    label: "Measurement Archive",
                });
        }

        $scope.addservice = function () {
            $scope.selected.services.push({
                type: $scope.addservice_item.id,
                //name: "tdb..", //TODO is service name used? maybe I should deprecate?
                locator: $scope.addservice_item.locator,
            });
            find_missing_services();
            $scope.addservice_item = null;
        };
        $scope.removeservice = function (service) {
            var id = $scope.selected.services.indexOf(service);
            $scope.selected.services.splice(id, 1);
            find_missing_services();
            $scope.form.$setDirty();
        };

        function clean_spec(specs) {
            for (var k in specs) {
                if (specs[k] === "") delete specs[k];
            }
        }

        $scope.submit = function () {
            //remove parameter set to empty string
            clean_spec($scope.selected.info);
            clean_spec($scope.selected.location);

            if (!$scope.selected._id) {
                hosts
                    .create($scope.selected)
                    .then(function (host) {
                        toaster.success("Host created successfully!");
                        $scope.form.$setPristine();
                        $location.update_path("/hosts/" + host._id);
                    })
                    .catch($scope.toast_error);
            } else {
                hosts
                    .update($scope.selected)
                    .then(function (host) {
                        toaster.success("Host updated successfully!");
                        host.ma_urls = host.ma_urls.join("\n");
                        $scope.form.$setPristine();
                    })
                    .catch($scope.toast_error);
            }
        };
        $scope.cancel = function () {
            location.reload();
        };
        $scope.remove = function () {
            hosts
                .remove($scope.selected)
                .then(function () {
                    toaster.success("Removed successfully");
                    $scope.selected = null;
                })
                .catch($scope.toast_error);
        };
        $scope.addAddress = function (event, address, addressFamily) {
            var newAddr = { address: address, family: addressFamily };
            event.preventDefault();
            $scope.addresses.push(newAddr);
            $scope.address_families.forEach(function (family, j) {
                if (family.id == addressFamily) {
                    $scope.selectedFamily.push($scope.address_families[j]);
                }
            });
        };
        $scope.clearNewAddress = function () {
            $scope.newAddress = "";
            // TODO: fix that the new address field is not getting cleared
        };
        $scope.removeAddress = function (index) {
            try {
                $scope.addresses.splice(index, 1);
                $scope.selectedFamily.splice(index, 1);
                $scope.form.$setDirty();
                $timeout(function () {
                    toaster.success("Removed address successfully");
                }, 0);
            } catch (error) {
                $scope.toast_error(error);
            }
        };

        $scope.click_hostgroup = function (hostgroup) {
            $location.path("/hostgroups/" + hostgroup._id);
        };
        $scope.click_config = function (config) {
            $location.path("/configs/" + config._id);
        };
    }
);
