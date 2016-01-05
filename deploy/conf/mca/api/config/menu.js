
//menu for meshconfig admin.. it could be stored as part of ui config..
module.exports = [
    {
        id: "about",
        label: "About",
        url: "/meshconfig/admin/#/about",
        /* always display
        scope: function(scope) {
            if(~scope.mca.indexOf('user')) return true;
            return false;
        }
        */
    },
    {
        id: "configs",
        label: "Configs",
        url: "/meshconfig/admin/#/configs",
        /* guest gets to see list of all configs currently defined
        scope: function(scope) {
            if(~scope.mca.indexOf('user')) return true;
            return false;
        }
        */
    },      
    {
        id: "testspecs",
        label: "Test Specs",
        url: "/meshconfig/admin/#/testspecs",
        scope: function(scope) {
            if(~scope.mca.indexOf('user')) return true;
            return false;
        }
    },
    {
        id: "hostgroups",
        label: "Host Groups",
        url: "/meshconfig/#/hostgroups",
        scope: function(scope) {
            if(~scope.mca.indexOf('user')) return true;
            return false;
        }
    },
    {
        id: "services",
        label: "Hosts",
        url: "/meshconfig/#/services",
        scope: function(scope) {
            if(~scope.mca.indexOf('user')) return true;
            return false;
        }
    },
]


