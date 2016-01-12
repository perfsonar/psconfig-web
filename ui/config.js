
angular.module('app.config', []).constant('appconf', {
    //title to display
    title: 'MeshConfig Admin',

    /*
    icon_url: 'images/logo.png',
    home_url: '#/',
    */

    //url base for meshconfig api
    api: '../api/meshconfig',

    //url base for meshconfig publisher
    //pub_url: './pub',
    pub_url: 'http://'+location.hostname+location.pathname+'pub',

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
            url: "#/about",
        },
        {
            id: "hostgroups",
            label: "Host Groups",
            url: "#/hostgroups",
            show: function(scope) {
                if(~scope.sca.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "testspecs",
            label: "Test Specs",
            url: "#/testspecs",
            show: function(scope) {
                if(~scope.sca.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "configs",
            label: "Configs",
            url: "#/configs",
        },              {
            id: "hosts",
            label: "Hosts",
            url: "#/hosts",
            show: function(scope) {
                if(~scope.sca.indexOf('user')) return true;
                return false;
            }
        },
    ]
});

