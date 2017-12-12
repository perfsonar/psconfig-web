
angular.module('app.config', []).constant('appconf', {
    //title to display
    title: 'MeshConfig Admin',

    //url base for meshconfig api
    api: '../api/mca',

    //url base for meshconfig publisher
    pub_url: 'http://'+location.hostname+location.pathname+'pub/',

    //authentcation service API / UI
    auth_api: '../api/auth',
    auth_url: '../auth',

    google_map_api: 'AIzaSyBhCVWYLcFh8NSpy4bRSuJpdE962x4KUpE',

    jwt_id: 'jwt',
});

