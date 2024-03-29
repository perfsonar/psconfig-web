"use strict";
const fs = require("fs");
const winston = require("winston");
const os = require("os");

exports.meshconfig = {
    login_url: "/pwa/auth",

    //service-types to support
    service_types: {
        owamp: { label: "Latency" },
        bwctl: { label: "Throughput" },
        traceroute: { label: "Traceroute" },
        ping: { label: "Ping" },
    },

    //mesh types
    mesh_types: {
        mesh: { label: "Mesh" },
        disjoint: { label: "Disjoint" },
        //"star": {label: "Star"},
        //"ordered_mesh": {label: "Ordered Mesh"},
    },

    //defaults values for various new entities
    defaults: {
        testspecs: {
            bwctl: {
                tool: "bwctl/iperf3",
                protocol: "tcp",
                interval: 14400,
                duration: 20,
                random_start_percentage: 10,
                omit_interval: 5,
                force_bidirectional: false,
                ipv4_only: true,
            },
            owamp: {
                packet_interval: 0.1,
                sample_count: 600,
                packet_padding: 0,
                bucket_width: 0.001,
                force_bidirectional: false,
                ipv4_only: true,
                interval: 3600,
                duration: 30,
                tool: "owping",
                schedule_type: "continuous",
            },
            traceroute: {
                tool: "traceroute",
                test_interval: 600,
                random_start_percentage: 10,
                protocol: "icmp",
                first_ttl: 1,
                packet_size: 1200,
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
        },
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
    sls_cache_frequency: 60 * 1000 * 10, //every 10 minutes
};

exports.datasource = {
    //amount of time between each cache
    delay: 1000 * 3600,

    //ls endpoints to pull host information from
    lses: {
        //Global LS
        //if hostname collision happens, first datasource will take precedence
        atlas: {
            label: "ATLAS",
            type: "global-sls",
            activehosts_url: "http://ps1.es.net:8096/lookup/activehosts.json",
            query: "?type=service&group-communities=*ATLAS,*atlas&group-communities-operator=any",
        },
        /*
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
        "test": {
            label: 'test',
            type: 'global-sls',
            activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json',
            query: '?type=service&group-communities=pS-Testbed&group-communities-operator=any',
        },
        */

        gls: {
            label: "GLS",
            type: "global-sls",
            activehosts_url: "http://ps1.es.net:8096/lookup/activehosts.json",
            query: "?type=service",
        },
        //sLS instance
        //only uncomment this if you are running a private sLS instance
        /*
        "gocdb-oim": {
            label: 'GOCDB-OIM', 
            type: 'sls',
            url: 'http://sls:8090/lookup/records/?type=service', 
            //exclude: [], //TODO - allow user to remove certain service from appearing in the UI
        },
        */
    },
};

exports.mongodb = "mongodb://localhost/pwa-test1";
//exports.mongodb = "mongodb://mongo/mca-osg-2019-03-04";
//exports.mongodb = "mongodb://mongo/mca-osg";

//admin api
exports.admin = {
    //api server host/port (don't change this for docker)
    host: "localhost",
    port: 8080,

    //authentication service public key to verify jwt token generated by it
    //jwt: { pub: fs.readFileSync('/etc/mca/auth/auth.pub') },
    jwt: {
        pub: fs.readFileSync("/home/grigutis/src/sca-auth/api/config/auth.pub"),
    },
};

//publisher api (will run on a different container from admin container)
exports.pub = {
    host: "localhost",
    port: 8082,
    url: "/pwa/pub/",
    //url: 'http://mca-dev.grnoc.iu.edu/pwa/pub/',
    default_config_format: "psconfig",
};

exports.common = {
    //needed to access auth service to pull profile
    auth_api: "http://sca-auth:12000",
    //auth_api: 'http://sca-auth:8081',
    //auth_api: 'http://sca-auth:8080',
    auth_jwt: fs.readFileSync("/etc/pwa/auth/user.jwt").toString().trim(),
};

exports.logger = {
    winston: {
        transports: [
            //display all logs to console
            new winston.transports.Console({
                timestamp: function () {
                    var d = new Date();
                    return d.toString();
                },
                level: "debug",
                colorize: true,
            }),

            /*
            //store all warnings / errors in error.log
            new (winston.transports.File)({ 
                filename: 'error.log',
                level: 'warn'
            })
            */
        ],
    },
};
