'use strict';

//this is checked in to git as default
//nothing sensitive should go here (since it will be published via web server anyway)

angular.module('app.config', [])
//constant *service*
.constant('appconf', {

    title: 'Authentication Service',

    icon_url: '../admin/images/logo.png',
    home_url: '../admin',

    admin_email: 'hayashis@iu.edu',
    logo_400_url: 'images/perfsonar400x86.png',

    //URL for auth service API
    api: '../api/auth',
    
    //URL for x509 validation API
    //x509api: '../api/auth',
    x509api: 'https://'+document.location.hostname+':9443/meshconfig/api/auth',

    //shared servive api and ui urls (for menus and stuff)
    shared_api: '../api/shared',
    shared_url: '../shared',

    profile_api: '../api/profile',

    //default location to redirect after successful login
    default_redirect_url: '../profile', 
    //default_redirect_url: '#/welcome',

    jwt_id: 'jwt',
    iucas_url: 'https://cas.iu.edu/cas/login',
});

