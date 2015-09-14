

app.controller('SettingsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper',
function($scope, appconf, $route, toaster, $http, jwtHelper) {
    $scope.form_profile = {}; //to be loaded later
    $scope.user = null;

    /* now performed via router config
    //forward to auth page if jwt is missing
    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt == null || jwtHelper.isTokenExpired(jwt)) {
        localStorage.setItem('post_auth_redirect', window.location.toString());
        window.location = appconf.auth_url;
        return;
    }
    */
    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);

    $http.get(appconf.api+'/public/'+user.sub)
    .success(function(profile, status, headers, config) {
        $scope.form_profile = profile;
    })
    .error(function(data, status, headers, config) {
        if(data && data.message) {
            toaster.error(data.message);
        }
    }); 

    //load user info
    $http.get(appconf.auth_api+'/me')
    .success(function(info) {
        $scope.user = info;
    });
    
    //load menu (TODO - turn this into a service?)
    $http.get(appconf.shared_api+'/menu')
    .success(function(menu) {
        $scope.menu = menu;

        /*
        //massage menu before setting
        var user_menu = findMenuItem('user', menu);
        //user_menu.label = $scope.form_profile.fullname;
        user_menu.label = function() { return "yoo";};
        */

        //split menu into each menues
        menu.forEach(function(m) {
            switch(m.id) {
            case 'top': 
                $scope.top_menu = m;
                break;
            case 'settings':
                $scope.settings_menu = m;
                break;
            }
        });
    });

    $scope.submit_profile = function() {
        $http.put(appconf.api+'/public/'+user.sub, $scope.form_profile)
        .success(function(data, status, headers, config) {
            toaster.success(data.message);
        })
        .error(function(data, status, headers, config) {
            toaster.error(data.message);
        });         
    }

    /*
    function findMenuItem(id, ms) {
        for(var i = 0;i< ms.length;++i) {
            var m = ms[i]; 
            if(m.id == id) return m;
            if(m.submenu) {
                var found = findMenuItem(id, m.submenu); //recurse into submenu
                if(found != null) {
                    return found;
                }
            }
        }
        return null;
    }
    */
    
}]);

