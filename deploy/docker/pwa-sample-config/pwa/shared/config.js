(function() {
    'use strict';
    var sca = angular.module('sca-shared.menu', []);

    sca.constant('scaSharedConfig', {
        shared_url: '/shared',  //path to shared ui resources (defaults to "../shared")
    });

    sca.constant('scaSettingsMenu', [
        {
            id: "account",
            label: "Account",
            url: "/auth/#!/settings/account",
            show: function(scope) {
                if(~scope.sca.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "groups",
            label: "Groups",
            url: "/auth/#!/groups",
        },
        {
            id: "users",
            label: "Users",
            url: "/auth/#!/admin/users",
            show: function(scope) {
                if(~scope.sca.indexOf('admin')) return true;
                return false;
            },
        },
        {
            id: "signout",
            label: "Signout",
            pullright: true,
            url: "/auth/#!/signout",
        },
    ]);

    sca.constant('scaAdminMenu', [
        {
            id: "adminusers",
            label: "Users",
            url: "/auth/#!/admin/users",
            show: function(scope) {
                if(~scope.sca.indexOf('admin')) return true;
                return false;
            }
        },
    ]);

})();
