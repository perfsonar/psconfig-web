
angular.module('app.config', []).constant('appconf', {
    //title to display
    title: 'psConfig Web Admin',

    //url base for pwa api
    api: '/pwa/api/pwa',

    base_url: '/pwa';

    //url base for pwa publisher
    //TODO: make this more configurable #97
    //pub_url: 'http://'+location.hostname+location.pathname+'pwa/pub/',
    pub_url: base_url + '/pub/',

    //authentcation service API / UI
    auth_api: '/pwa/api/auth',
    auth_url: '/pwa/auth/',

    google_map_api: 'AIzaSyBhCVWYLcFh8NSpy4bRSuJpdE962x4KUpE',

    jwt_id: 'jwt',
});

