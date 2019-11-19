
app.controller('ArchivesController',
function($scope, $route, toaster, $http, jwtHelper, $location, serverconf, scaMessage, users, archives, $modal, $routeParams, $cookies) {
    scaMessage.show(toaster);
    $scope.active_menu = "archives";
    $scope.filter = $cookies.get('testspecs_filter');

    users.getAll().then(function(_users) {
        $scope.users = _users;
        archives.getAll().then(function(_archives) {

            const archiversObj = {
                "esmond": {"aid": "esmond", "label":"Esmond"},
                "rabbitmq": {"aid":"rabbitmq", "label":"RabbitMQ"},
                "rawjson": {"aid":"rawjson", label:"Raw JSON"}
            };
            const archiversArr = Object.keys( archiversObj );
            $scope.serverconf.archivers = archiversObj;
            $scope.archives = _archives;
            //find task specified
            if($routeParams.id) {
                $scope.archives.forEach(function(archive) {
                    if(archive._id == $routeParams.id) $scope.select(archive);
                });
            } else {
                //select first one
                if($scope.archives.length > 0) $scope.select($scope.archives[0]);
            }
        });
    });

    $scope.selected = null;

    $scope.select = function(archive) {
        console.log("archives", archives);
        console.log("$scope.archives", $scope.archives);
        console.log("$scope.serverconf", $scope.serverconf);
        //TODO - maybe I should catch $dirty flag here.. but what about page nagivation?
        //archive.schedule_type = archive.schedule_type || 'continuous';
        $scope.selected = archive;

        $scope.closesubbar();
        $location.update_path("/archives/"+archive._id);
        window.scrollTo(0,0);

        //$scope.setdefault(archive.archiver);

        //$scope.minver = $scope.serverconf.minver[archive.service_type];
    };

    $scope.setdefault = function(archiver) {
        var def = $scope.serverconf.defaults.archives[archiver];
        $scope.selected.data = $.extend( true, {}, def, $scope.selected.data );
    };

    $scope.filter_archives = function(archives) {
        console.log("filtering archives", archives);
        if(!archives) return; //no loaded yet?
        $cookies.put('archives_filter', $scope.filter);

        return archives.filter(function(archive) {
            if($scope.selected == archive) return true; //always show selected one
            if(!$scope.filter) return true; //show all

            var name = archive.name.toLowerCase();
            var type = archive.service_type.toLowerCase();

            //all tokens must match somewhere
            var tokens = $scope.filter.toLowerCase().split(" ");
            var accept = true;
            tokens.forEach(function(token) {
                var match = false;
                if(~name.indexOf(token)) match = true;
                if(~type.indexOf(token)) match = true;
                if(!match) accept = false;
            });
            return accept;
        });
    };

});
