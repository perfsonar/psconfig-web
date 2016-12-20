
app.controller('HeaderController', function($scope, appconf, $route, serverconf, jwtHelper, $location) {
    $scope.title = appconf.title; //used?
    serverconf.then(function(_c) { $scope.serverconf = _c; });
    $scope.active_menu = "unknown";
    $scope.appconf = appconf;

    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt) {
        var expdate = jwtHelper.getTokenExpirationDate(jwt);
        if(expdate < Date.now()) {
            localStorage.removeItem(appconf.jwt_id);
        } else {
            $scope.user = jwtHelper.decodeToken(jwt);
        }
    }

    //open another page inside the app.
    $scope.openpage = function(page) {
        //hide subbar if it's hidden optionally for narrow view
        if($(".subbar").hasClass("subbar-shown")) {
            $(".subbar").removeClass("subbar-shown");
        }

        console.log("path to "+page);
        $location.path(page);
        window.scrollTo(0,0);

    }
    $scope.back = function() {
        window.history.back();
    }

    //relocate out of the app..
    $scope.relocate = function(url, newtab) {
        if(newtab) return window.open(url, '_blank');
        document.location = url;
    }

    //when page is narrow, this button shows up and allows sidebar to be displayed
    $scope.opensubbar = function() {
        $(".subbar").toggleClass('animated slideInLeft subbar-shown');
    }

    $scope.toast_error = function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    }
});

app.controller('AboutController', 
function($scope, appconf, serverconf, scaMessage, toaster) {
    scaMessage.show(toaster);
    $scope.appconf = appconf;
    $scope.active_menu = "about";
});


