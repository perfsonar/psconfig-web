
//TODO - I am not sure if this is really worth existing
app.factory('profile', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);
    var pub = {fullname: null};

    $http.get(appconf.profile_api+'/public/'+user.sub)
    .success(function(profile, status, headers, config) {
        for(var k in profile) {
            pub[k] = profile[k];
        }
    });
    return {
        pub: pub,
    }
}]);

/*
//TODO - I am not sure if this is really worth existing
app.factory('menu', ['appconf', '$http', 'jwtHelper', function(appconf, $http, jwtHelper) {
    var menu = [];

    function getMenu = function() {
        return $http.get(appconf.shared_api+'/menu')
    }
    return {
        getMenu: getMenu
    }
}]);
*/

app.controller('HeaderController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper',
function($scope, appconf, $route, toaster, $http, jwtHelper) {
    $scope.title = appconf.title;
}]);

app.controller('AboutController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'profile', 
function($scope, appconf, $route, toaster, $http, jwtHelper, profile) {
    $scope.profile = profile.pub;

    $http.get(appconf.shared_api+'/menu', {cache: true})
    .then(function(res) {
        if(res.status != 200) return toaster.error("Failed to load menu");
        res.data.forEach(function(m) {
            switch(m.id) {
            case 'top':
                console.dir(m);
                $scope.top_menu = m;
                break;
            /*
            case 'topright':
                $scope.topright_menu = m;
                break;
            */
            case 'settings':
                $scope.settings_menu = m;
                break;
            }
        });
    });

}]);

app.controller('DashboardController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper',
function($scope, appconf, $route, toaster, $http, jwtHelper) {
    //nothing yet.
}]);

/*
app.controller('SettingsController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper',
function($scope, appconf, $route, toaster, $http, jwtHelper) {
    $scope.form_profile = {}; //to be loaded later
    $scope.user = null;

    var jwt = localStorage.getItem(appconf.jwt_id);
    var user = jwtHelper.decodeToken(jwt);

    $http.get(appconf.profile_api+'/public/'+user.sub)
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
    
}]);
*/
