
//just a service to load all users from auth service
app.factory('serverconf', ['appconf', '$http', function(appconf, $http) {
    return $http.get(appconf.api+'/config')
    .then(function(res) {
        return res.data;
    });
}]);

app.factory('hosts', function(appconf, $http, jwtHelper) {
    var hosts = [];
    //var all_promise = null;
    //var ma_promise = null;

    return {
        //return basic (uuid, sitename, hostname, lsid) host info for all hosts
        getAll: function(opts) { 
            //if(all_promise) return all_promise;
            var select = "sitename hostname lsid url update_date local_archives additional_archives";
            if(opts && opts.select) select = opts.select;
            return $http.get(appconf.api+'/hosts?select='+select+'&sort=sitename hostname&limit=3000')
            .then(function(res) {
                hosts = res.data.hosts;
                hosts.forEach(function(host) {
                    var d = new Date();
                    d.setHours(-24*7);
                    if(new Date(host.update_date) < d) { 
                        host._stale = true;
                    }
                });
                return res.data.hosts;
            });
        },

        //load host detail (add to existing host object)
        getDetail: function(host) {
            return $http.get(appconf.api+'/hosts?find='+JSON.stringify({_id: host._id})).then(function(res) {
                var _host = res.data.hosts[0];
                for(var k in _host) host[k] = _host[k]; //append info to host
                return host;
            });
        },

        /* deprecated
        //list of all hosts with MA service
        getMAs: function() {
            if(ma_promise) return ma_promise;
            ma_promise = $http.get(appconf.api+'/hosts?select=lsid sitename hostname&sort=sitename hostname&limit=3000&find='+JSON.stringify({
                "services.type": "ma"
            })).then(function(res) {
                //console.log("mas");
                //console.dir(res.data.hosts);
                return res.data.hosts;
            });
            return ma_promise;
        },
        */

        //CRUD
        add: function() {
            var host = {
                //hostname: "",
                admins: [],

                //let's add ma by default - to prevent user from forget registering it
                services: [{
                    "type": "ma", 
                }],

                info: {},
                location: {},
                communities: [],
                local_archives: [],
                additional_archives: []
            };
            
            //add user to admin
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                host.admins.push(user.sub.toString());
                host._canedit = true;
            }
            hosts.unshift(host);
            return host;
        },
        create: function(host) {
            return $http.post(appconf.api+'/hosts/', host)
            .then(function(res) {
                for(var k in res.data) host[k] = res.data[k];
                return host;
            });
        },
        update: function(host) {
            return $http.put(appconf.api+'/hosts/'+host._id, host)
            .then(function(res) {
                for(var k in res.data) host[k] = res.data[k];
                return host;
            });
        },
        remove: function(host) {
            return $http.delete(appconf.api+'/hosts/'+host._id)
            .then(function(res) {
                hosts.splice(hosts.indexOf(host), 1);
            });
        }
    }
});

app.factory('users', function(appconf, $http, jwtHelper) {
    var all_promise = null;
    return {
        //return basic (uuid, sitename, hostname, lsid) host info for all hosts
        getAll: function() { 
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.auth_api+'/profile')
            .then(function(res) {
                //convert IDs to string
                res.data.profiles.forEach(function(profile) {
                    profile.id = profile.id.toString();
                });
                return res.data.profiles;
            });
            return all_promise; 
        }
    }
});

app.factory('archives', function(appconf, $http, jwtHelper) {
    var archives = null;
    var all_promise = null;
    return {
        getAll: function() {
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.api+'/archives')
            .then(function(res) {
                archives = res.data.archives;
                //console.dir(archives);
                return res.data.archives;
            });
            return all_promise; 
        },
        clear: function() {
            //invalidate
            all_promise = null;
        },
        add: function() {
            var archive = {
                desc: "New Testspec",
                admins: [],
            };
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                archive.admins.push(user.sub.toString());
                archive._canedit = true;
            }
            archives.unshift(archive);
            return archive;
        },
        create: function(archive) {
            return $http.post(appconf.api+'/archives/', archive)
            .then(function(res) {
                archive._id = res.data._id;
                archive._canedit = res.data._canedit;
                archive.create_date = res.data.create_date;
                return archive;
            });
        },
        update: function(archive) {
            return $http.put(appconf.api+'/archives/'+archive._id, archive)
            .then(function(res) {
                archive._canedit = res.data._canedit;
                return archive;
            });
        },
        remove: function(archive) {
            return $http.delete(appconf.api+'/archives/'+archive._id)
            .then(function(res) {
                archives.splice(archives.indexOf(archive), 1);
            });
        }
    }
}); // end archives factory



app.factory('testspecs', function(appconf, $http, jwtHelper) {
    var testspecs = null;
    var all_promise = null;
    return {
        getAll: function() {
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.api+'/testspecs')
            .then(function(res) {
                testspecs = res.data.testspecs;
                //console.dir(testspecs);
                return res.data.testspecs;
            });
            return all_promise; 
        },
        clear: function() {
            //invalidate
            all_promise = null;
        },
        add: function() {
            var testspec = {
                desc: "New Testspec",
                admins: [],
            };
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                testspec.admins.push(user.sub.toString());
                testspec._canedit = true;
            }
            testspecs.unshift(testspec);
            return testspec;
        },
        create: function(testspec) {
            return $http.post(appconf.api+'/testspecs/', testspec)
            .then(function(res) {
                testspec._id = res.data._id;
                testspec._canedit = res.data._canedit;
                testspec.create_date = res.data.create_date;
                return testspec;
            });
        },
        update: function(testspec) {
            return $http.put(appconf.api+'/testspecs/'+testspec._id, testspec)
            .then(function(res) {
                testspec._canedit = res.data._canedit;
                return testspec;
            });
        },
        remove: function(testspec) {
            return $http.delete(appconf.api+'/testspecs/'+testspec._id)
            .then(function(res) {
                testspecs.splice(testspecs.indexOf(testspec), 1);
            });
        }
    }
});

app.factory('configs', function(appconf, $http, jwtHelper) {
    var configs = [];
    //var all_promise = null;
    var ma_promise = null;

    return {
        //return basic (uuid, sitename, hostname, lsid) config info for all configs
        getAll: function(opts) { 
            //if(all_promise) return all_promise;
            var select = "url name desc ma_urls archives ma_custom_json force_endpoint_mas admins tests create_date";
            if(opts && opts.select) select = opts.select;
            return $http.get(appconf.api+'/configs?select='+select+'&sort=desc&limit=100000')
            .then(function(res) {
                configs = res.data.configs;
                return res.data.configs;
            });
        },
        add: function() {
            var config = {
                desc: "New Config",
                admins: [],
                tests: [],
                archives: []
            };
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                config.admins.push(user.sub.toString());
                config._canedit = true;
            }
            configs.unshift(config);
            return config;
        },
        create: function(config) {
            return $http.post(appconf.api+'/configs/', config)
            .then(function(res) {
                config._id = res.data._id;
                config._canedit = res.data._canedit;
                config.create_date = res.data.create_date;
                return config;
            });
        },
        update: function(config) {
            return $http.put(appconf.api+'/configs/'+config._id, config)
            .then(function(res) {
                config._canedit = res.data._canedit;
                return config;
            });
        },
        remove: function(config) {
            return $http.delete(appconf.api+'/configs/'+config._id)
            .then(function(res) {
                configs.splice(configs.indexOf(config), 1);
            });
        }
    }
});

app.factory('hostgroups', function(appconf, $http, jwtHelper) {
    var hostgroups = null;
    var all_promise = null;
    return {
        getAll: function() {
            if(all_promise) return all_promise;
            all_promise = $http.get(appconf.api+'/hostgroups')
            .then(function(res) {
                hostgroups = res.data.hostgroups;
                return res.data.hostgroups;
            });
            return all_promise; 
        },
        clear: function() {
            //invalidate
            all_promise = null;
        },
        add: function() {
            var hostgroup = {
                desc: "New Hostgroup",
                admins: [],
                type: "static",
                hosts: [],
                host_filter: "return false; //select none",
            };
            var jwt = localStorage.getItem(appconf.jwt_id);
            if(jwt) {
                var user = jwtHelper.decodeToken(jwt);
                hostgroup.admins.push(user.sub.toString());
                hostgroup._canedit = true;
            }
            hostgroups.unshift(hostgroup);
            return hostgroup;
        },
        create: function(hostgroup) {
            return $http.post(appconf.api+'/hostgroups/', hostgroup)
            .then(function(res) {
                hostgroup._id = res.data._id;
                hostgroup._canedit = res.data._canedit;
                hostgroup.create_date = res.data.create_date;
                return hostgroup;
            });
        },
        update: function(hostgroup) {
            return $http.put(appconf.api+'/hostgroups/'+hostgroup._id, hostgroup)
            .then(function(res) {
                hostgroup._canedit = res.data._canedit;
                return hostgroup;
            });
        },
        remove: function(hostgroup) {
            return $http.delete(appconf.api+'/hostgroups/'+hostgroup._id)
            .then(function(res) {
                hostgroups.splice(hostgroups.indexOf(hostgroup), 1);
                //$scope.form.$setPristine();//ignore all changed made
            });
        }
    }
});

//TODO - deprecate this?
//load menu and profile by promise chaining
app.factory('menu', function(appconf, $http, jwtHelper, $sce, scaMessage, scaMenu) {

    var jwt = localStorage.getItem(appconf.jwt_id);
    var menu = {
        header: {},
        top: scaMenu,
        user: null, //to-be-loaded
    };
    if(appconf.icon_url) menu.header.icon = $sce.trustAsHtml("<img src=\""+appconf.icon_url+"\">");
    if(appconf.home_url) menu.header.url = appconf.home_url
    if(jwt) menu.user = jwtHelper.decodeToken(jwt);

    return menu;
});

