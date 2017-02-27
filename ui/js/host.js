
app.controller('HostsController', 
function($scope, appconf, toaster, $http, serverconf, $location, scaMessage, hosts, $modal, $routeParams, users, $cookies) {

    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });
    $scope.appconf = appconf;
    $scope.active_menu = "hosts";
    $scope.loading = true;
    $scope.hosts_filter = $cookies.get('hosts_filter');

    //load users for admin
    users.getAll().then(function(_users) {

        $scope.users = _users;
        hosts.getAll().then(function(_hosts) {
            $scope.hosts = _hosts;
            $scope.hosts_o = {};
            _hosts.forEach(function(host) {
                $scope.hosts_o[host._id] = host;
            });

            $scope.loading = false;

            //select specified host
            if($routeParams.id) {
                _hosts.forEach(function(host) {
                    if(host._id == $routeParams.id) {
                        $scope.select(host);
                    }
                });
                //scroll element to view - after this apply cycle is complete
                setTimeout(function() {
                    var item = document.getElementById($routeParams.id);
                    if(item) item.scrollIntoView(true);
                },0);
            } else $scope.select(_hosts[0]); //select first one then
        });
    });

    $scope.selected = null;
    $scope.select = function(host) {
        $scope.selected = host;

        hosts.getDetail(host).then(function(_host) {
            find_missing_services();    
        });

        //hide subbar if shown
        if($(".subbar").hasClass("subbar-shown")) {
            $(".subbar").removeClass("subbar-shown");
        }

        $scope.closesubbar();
        $location.update_path("/hosts/"+host._id);
        window.scrollTo(0,0);
    }
    $scope.add = function() {
        $scope.selected = hosts.add();
        $scope.closesubbar();
        $location.update_path("/hosts");
        find_missing_services();    
    }

    //apply host filter
    $scope.check_host_filter = function(host) {
        $cookies.put('hosts_filter', $scope.hosts_filter);
        if(!$scope.hosts_filter) return true;

        var hostname = host.hostname.toLowerCase();
        var sitename = host.sitename.toLowerCase();
        var lsid = (host.lsid?host.lsid.toLowerCase():"adhoc");
        var tokens = $scope.hosts_filter.toLowerCase().split(" ");
        //all tokens must match somewhere
        var accept = true;
        tokens.forEach(function(token) {
            var match = false;
            if(~hostname.indexOf(token)) match = true;
            if(~sitename.indexOf(token)) match = true;
            if(lsid && ~lsid.indexOf(token)) match = true;
            if(!match) accept = false;
        });
        return accept;
    }

    function find_missing_services() {
        //find service that are not yet added
        $scope.missing_services = [];
        for(var id in $scope.serverconf.service_types) {
            //see if this service is already registered
            var missing = true;
            $scope.selected.services.forEach(function(used_service) {
                if(used_service.type == id) missing = false;
            }); 
            if(missing) $scope.missing_services.push({
                id: id, 
                label: $scope.serverconf.service_types[id].label,
            });
        }

        //also inject MA service
        var found_ma = false;
        $scope.selected.services.forEach(function(used_service) {
            if(used_service.type == "ma") found_ma = true;
        });
        if(!found_ma) $scope.missing_services.push({
            id: "ma",
            label: "Measurement Archive",
        });
    }

    $scope.addservice = function() {
        $scope.selected.services.push({
            type: $scope.addservice_item.id,
            //name: "tdb..", //TODO is service name used? maybe I should deprecate?
            //locator: "",
        });
        find_missing_services();    
        $scope.addservice_item = null;
    }
    $scope.removeservice = function(service) {
        var id = $scope.selected.services.indexOf(service);
        $scope.selected.services.splice(id, 1);
        find_missing_services();    
        $scope.form.$setDirty();
    }

    function clean_spec(specs) {
        for(var k in specs) {
            if(specs[k] === '') delete specs[k];
        }
    }

    $scope.submit = function() {
        //remove parameter set to empty string
        clean_spec($scope.selected.info);
        clean_spec($scope.selected.location);

        if(!$scope.selected._id) {
            hosts.create($scope.selected).then(function(host) {
                toaster.success("Host created successfully!");
                $scope.form.$setPristine();
                $location.update_path("/hosts/"+host._id);
            }).catch($scope.toast_error);
        } else {
            hosts.update($scope.selected).then(function(host) {
                toaster.success("Host updated successfully!");
                $scope.form.$setPristine();
            }).catch($scope.toast_error);
        }
    }
    $scope.cancel = function() {
        location.reload();
    }
    $scope.remove = function() {
        hosts.remove($scope.selected).then(function() {
            toaster.success("Removed successfully");
            $scope.selected = null;
        }).catch($scope.toast_error);
    }
});

