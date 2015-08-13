'use strict';

angular.module('app.config', [])
//constant *service*
.constant('appconf', {
    title: 'Profile Service',
    admin_email: 'hayashis@iu.edu',
    version: '0.0.1',

    //url base for sca-profile api
    api: 'https://soichi7.ppa.iu.edu/api/profile',

    //authentcation service API to refresh token, etc.
    auth_api: 'https://soichi7.ppa.iu.edu/api/auth',
    //authentication service URL to jump if user needs to login
    auth_url: 'https://soichi7.ppa.iu.edu/auth',

    jwt_id: 'jwt'
});

