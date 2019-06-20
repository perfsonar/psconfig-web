(function() {
    'use strict';
    var sca = angular.module('sca-shared.menu', []);

    const base_url = '/pwa';

    sca.constant('scaSharedConfig', {
        shared_url: base_url + '/shared',  //path to shared ui resources (defaults to "../shared")
    });

    sca.constant('scaSettingsMenu', [
        {
            id: "account",
            label: "Account",
            url: base_url + "/auth/#!/settings/account",
            show: function(scope) {
                if(~scope.sca.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "groups",
            label: "Groups",
            url: base_url + "/auth/#!/groups",
        },
        {
            id: "users",
            label: "Users",
            url: base_url + "/auth/#!/admin/users",
            show: function(scope) {
                if(~scope.sca.indexOf('admin')) return true;
                return false;
            },
        },
        {
            id: "signout",
            label: "Signout",
            pullright: true,
            url: base_url + "/auth/#!/signout",
        },
    ]);

    sca.constant('scaAdminMenu', [
        {
            id: "adminusers",
            label: "Users",
            url: base_url + "/auth/#!/admin/users",
            show: function(scope) {
                if(~scope.sca.indexOf('admin')) return true;
                return false;
            }
        },
    ]);

})();
