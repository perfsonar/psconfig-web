
angular.module('app.config', []).constant('appconf', {
    //title to display
    title: 'psConfig Web Admin',

    //url base for pwa api
    api: '../pwa/api/pwa',

    //url base for pwa publisher
    //TODO: make this more configurable #97
    pub_url: 'http://'+location.hostname+location.pathname+'pwa/pub/',

    //authentcation service API / UI
    auth_api: '../api/auth',
    auth_url: '../auth',

    google_map_api: 'AIzaSyBhCVWYLcFh8NSpy4bRSuJpdE962x4KUpE',

    jwt_id: 'jwt',
});

