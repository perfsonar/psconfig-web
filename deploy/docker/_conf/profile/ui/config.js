angular.module('app.config', []).constant('appconf', {
    icon_url: '../admin/images/logo.png', 
    home_url: '../admin', 

    //url base for sca-profile api
    api: '../api/profile',

    //shared servive api and ui urls (for menus and stuff)
    shared_api: '../api/shared',
    shared_url: '../shared',

    //authentcation service API to refresh token, etc.
    auth_api: '../api/auth',
    //authentication service URL to jump if user needs to login
    auth_url: '../auth',

    jwt_id: 'jwt',
});

