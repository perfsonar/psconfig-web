'use strict';
const fs = require('fs');
const winston = require('winston');
const os = require('os');

exports.meshconfig = {
    login_url: '/auth',

    //service-types to support
    service_types: {
        "owamp": {label: "Latency"},
        "bwctl": {label: "Throughput"},
        "traceroute": {label: "Traceroute"},
        "ping": {label: "Pinger"},
    },

    //mesh types
    mesh_types: {
        "mesh": {label: "Mesh"},
        "disjoint": {label: "Disjoint"}
    },


    //defaults values for various new entities
    defaults: {
        testspecs: {
            bwctl: {
                tool: 'bwctl/iperf3',
                protocol: 'tcp',
                interval: 14400,
                duration: 20,
                random_start_percentage: 10,
                omit_interval: 5,
                force_bidirectional: false,
                ipv4_only: true,
            },
            owamp: {
                packet_interval: 0.1,
                loss_threshold: 10,
                session_count: 10800,
                sample_count: 600,
                packet_padding: 0,
                bucket_width: 0.001,
                force_bidirectional: false,
                ipv4_only: true,
                interval: 3600,
                duration: 60,
                tool: "owping",
            },
            traceroute: {
                tool: 'traceroute',
                test_interval: 600,
                random_start_percentage: 10,
                protocol: 'icmp',
                first_ttl: 1,
                packet_size: 1200, //TODO - set to somenumber
                force_bidirectional: false,
                ipv4_only: false,
                ipv6_only: false,

                pause: 0,
                waittime: 10,
                timeout: 60,
            },
            ping: {
                test_interval: 1,
            },
        }
    },

    //minumum option version catalog (used to suppress them for known v3 host)
    minver: {
        bwctl: {
            tcp_bandwidth: 4,
            mss: 4,
            dscp: 4,
            dynamic_window_size: 4,
            no_delay: 4,
            congestion: 4,
            flow_label: 4,
            server_cpu_affinity: 4,
            client_cpu_affinity: 4,
        },
        owamp: {
            tos_bits: 4,
            output_raw: 4,
        },
        traceroute: {
            tos_bits: 4,
            algorithm: 4,
            as: 4,
            fragment: 4,
            hostnames: 4,
            probe_type: 4,
            queries: 4,
            sendwait: 4,
            wait: 4,
        },
        ping: {
            tool: 4,
            tos_bits: 4,
            flow_label: 4,
            hostnames: 4,
            suppress_loopback: 4,
            deadline: 4,
            timeout: 4,
        },
    },

    //meshconfig admin loads sls content at startup, and then every once a while with following frequency
    sls_cache_frequency: 60*1000*10, //every 10 minutes
}

exports.datasource = {
    //amount of time between each cache
    delay: 1000*3600,

    //ls endpoints to pull host information from 
    lses: {
        //Global LS
        //if hostname collision happens, first datasource will take precedence
/*
        "atlas": {
            label: 'ATLAS',
            type: 'global-sls',
            activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json',
            query: '?type=service&group-communities=*ATLAS,*atlas&group-communities-operator=any',
        },
        "cms": {
            label: 'CMS',
            type: 'global-sls',
            activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json',
            query: '?type=service&group-communities=*CMS,*cms&group-communities-operator=any',
        },
        "osg": {
            label: 'OSG',
            type: 'global-sls',
            activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json',
            query: '?type=service&group-communities=OSG,opensciencegrid&group-communities-operator=any',
        },
*/
        //gLS instance
        "gls": {
            label: 'GLS',
            type: 'global-sls',
            activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json',
            query: '?type=service',
        }
/*
        "test": {
            label: 'test',
            type: 'global-sls',
            activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json',
            query: '?type=service&group-communities=pS-Testbed&group-communities-operator=any',
        },
*/

        // Private sLS instance
        // only uncomment this if you are running a private sLS instance
        /*
        "gocdb-oim": {
            label: 'GOCDB-OIM', 
            type: 'sls',
            url: 'http://sls:8090/lookup/records/?type=service', 
            //exclude: [], //TODO - allow user to remove certain service from appearing in the UI
        },
        */
    }
}

exports.mongodb = "mongodb://mongo/pwa";

//admin api
exports.admin = {
    //api server host/port (don't change this for docker)
    host: "0.0.0.0",
    port: 8080,

    //authentication service public key to verify jwt token generated by it
    jwt: { pub: fs.readFileSync(__dirname+'/auth/auth.pub') },

}

//publisher api (will run on a different container from admin container)
exports.pub = {
    host: "0.0.0.0",
    port: 8080,

    url: 'http://<pwa_hostname>/pub/',
};

exports.common = {
    //needed to access auth service to pull profile
    auth_api: 'http://sca-auth:8080',
    auth_jwt: fs.readFileSync(__dirname+'/auth/user.jwt').toString().trim(),
}

exports.logger = {
    winston: {
        transports: [
            //display all logs to console
            new winston.transports.Console({
                timestamp: function() {
                    var d = new Date();
                    return d.toString();
                },
                level: 'info',
                colorize: true
            }),

            /*
            //store all warnings / errors in error.log
            new (winston.transports.File)({ 
                filename: 'error.log',
                level: 'warn'
            })
            */
        ]
    }
}

