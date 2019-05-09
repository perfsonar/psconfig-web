(function() {
    'use strict';
    var sca = angular.module('sca-shared.menu', []);

    sca.constant('scaSharedConfig', {
        shared_url: '/pwa/shared',  //path to shared ui resources (defaults to "../shared")
    });

    sca.constant('scaSettingsMenu', [
        {
            id: "account",
            label: "Account",
            url: "/pwa/auth/#!/settings/account",
            show: function(scope) {
                if(~scope.sca.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "groups",
            label: "Groups",
            url: "/pwa/auth/#!/groups",
        },
        {
            id: "users",
            label: "Users",
            url: "/pwa/auth/#!/admin/users",
            show: function(scope) {
                if(~scope.sca.indexOf('admin')) return true;
                return false;
            },
        },
        {
            id: "signout",
            label: "Signout",
            pullright: true,
            url: "/pwa/auth/#!/signout",
        },
    ]);

    sca.constant('scaAdminMenu', [
        {
            id: "adminusers",
            label: "Users",
            url: "/pwa/auth/#!/admin/users",
            show: function(scope) {
                if(~scope.sca.indexOf('admin')) return true;
                return false;
            }
        },
    ]);

})();
