
angular.module('app.config', []).constant('appconf', {
    //title to display
    title: 'MeshConfig Admin',

    icon_url: 'images/logo.png',

    //url base for meshconfig api
    api: '../api/meshconfig',

    //url base for meshconfig publisher
    pub_url: './pub',

    profile_api: '../api/profile',
    profile_url: '../profile',

    //shared servive api and ui urls (for menus and stuff)
    shared_api: '../api/shared',
    shared_url: '../shared',

    //authentcation service API to refresh token, etc.
    auth_api: '../api/auth',
    //authentication service URL to jump if user needs to login
    auth_url: '../auth',

    jwt_id: 'jwt',
    
    menu: [
        {
            id: "about",
            label: "About",
            url: "/meshconfig/#/about",
        },
        {
            id: "configs",
            label: "Configs",
            url: "/meshconfig/#/configs",
        },      
        {
            id: "testspecs",
            label: "Test Specs",
            url: "/meshconfig/#/testspecs",
            show: function(scope) {
                if(~scope.common.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "hostgroups",
            label: "Host Groups",
            url: "/meshconfig/#/hostgroups",
            show: function(scope) {
                if(~scope.common.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "hosts",
            label: "Hosts",
            url: "/meshconfig/#/hosts",
            show: function(scope) {
                if(~scope.common.indexOf('user')) return true;
                return false;
            }
        },
    ]
});

