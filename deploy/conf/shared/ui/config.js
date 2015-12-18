(function() {
    'use strict';
    var sca = angular.module('sca-shared.menu', []);
    sca.constant('scaMenu', [
        {
            id: "meshconfig",
            label: "MeshConfig Admin",
            url: "/meshconfig/admin"
        },
        {
            id: "user",
            //icon: "<img src='http://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=19'>",
            _label: {default: "Me", profile: "fullname"},
            props: { right: true },
            show: function(scope) {
                if(~scope.common.indexOf('user')) return true;
                return false;
            },
            submenu: [
                {
                    id: "settings",
                    label: "Settings",
                    url: "/meshconfig/profile",
                },
                { separator: true },
                //{ header: true, label: "Random Header Here" },
                {
                    id: "signout",
                    label: "Sign Out",
                    url: "/meshconfig/auth/#/signout",
                },
            ] 
        },
        {
            id: "signin",
            label: "Sign In",
            url: "/meshconfig/auth",
            show: function(scope) {
                if(~scope.common.indexOf('user')) return false;
                return true;
            },
            props: { right: true }
        },
        {
            id: "signup",
            label: "Sign Up",
            url: "/meshconfig/auth/#/signup",
            show: function(scope) {
                if(~scope.common.indexOf('user')) return false;
                return true;
            },
            props: { right: true }
        },
    ]);

    sca.constant('scaSettingsMenu', [
        {
            id: "profile",
            label: "Profile",
            url: "/meshconfig/profile",
            show: function(scope) {
                if(~scope.common.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "account",
            label: "Account",
            url: "/meshconfig/auth/#/settings",
            show: function(scope) {
                if(~scope.common.indexOf('user')) return true;
                return false;
            }
        },
    ]);

})();
