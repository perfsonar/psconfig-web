'use strict';

angular.module('app.config', [])
.constant('appconf', {

    title: 'MCA Authentication Service',

    admin_email: 'hayashis@iu.edu',
    logo_400_url: 'images/meshconfig_logo.jpg',

    oidc_logo: 'images/cilogon.png',

    //URL for auth service API
    api: '../api/auth',

    //URL for x509 validation API
    x509api: 'https://'+location.hostname+':9443',

    //default location to redirect after successful login
    //default_redirect_url: '../profile', 
    default_redirect_url: '/',

    jwt_id: 'jwt',
    iucas_url: 'https://cas.iu.edu/cas/login',

    jwt_whitelist: [location.hostname],

   //show/hide various login options
    show: {
        local: true,
        ldap: false,

        iucas: false,
        google: false,
        git: false,
        x509: true,
        github: false,
        facebook: false,

        oidc: true, //cilogon openid-connect service
        //oidc_selector: false, //show idp selector

        signup: true,
    },
});

