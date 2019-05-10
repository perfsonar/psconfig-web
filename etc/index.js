"use strict";
const fs = require("fs");
const winston = require("winston");
const os = require("os");

// Publisher api (will run on a different container from admin container)
// Note: you *must* update the "url" with your hostname in place of <hostname>

exports.pub = {
    host: "0.0.0.0",
    port: 8080,
    url: "http://<pwa_hostname>/pwa/pub/",
};

// Mongo DB to use (the default should work fine, unless you specifically need a different db)
exports.mongodb = "mongodb://mongo/pwa";


// PWA general settings

exports.meshconfig = {
    login_url: "/pwa/auth/",

    // service-types to support
    service_types: {
        "owamp": {label: "Latency"},
        "bwctl": {label: "Throughput"},
        "traceroute": {label: "Traceroute"},
        "ping": {label: "Ping"},
    },

    // Supported mesh types
    mesh_types: {
        "mesh": {label: "Mesh"},
        "disjoint": {label: "Disjoint"}
    },


    // Default values for various new entities created via the GUI
    // Each time a new testspec is created, many parameters have default values -- for instance, test duration
    // These defaults are specified here; they should work fine in most cases, but you can tweak them if necessary 
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
                ipv4_only: true
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
                schedule_type: "continuous"
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
                timeout: 60
            },
            ping: {
                test_interval: 1
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
            client_cpu_affinity: 4
        },
        owamp: {
            tos_bits: 4,
            output_raw: 4
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
            wait: 4
        },
        ping: {
            tool: 4,
            tos_bits: 4,
            flow_label: 4,
            hostnames: 4,
            suppress_loopback: 4,
            deadline: 4,
            timeout: 4
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
        // Global LS queries
        // if hostname collision happens, the first datasource will take precedence
     	
	// Example: here, we are creating a label based on querying the Global LS for a given community
	// Fake institution "Widget Factory"
	// Note the "label" should be short as it will display for each host in the GUI and there is limited space
/*
        "widgetfactory": {
            label: "widget",
            type: "global-sls",
            activehosts_url: "http://ps1.es.net:8096/lookup/activehosts.json",
            query: "?type=service&group-communities=*WIDGET,*widget&group-communities-operator=any",
        },
*/
        // Global LS instance (by default, this is the only LS specified)
        "gls": {
            label: "GLS",
            type: "global-sls",
            activehosts_url: "http://ps1.es.net:8096/lookup/activehosts.json",
            query: "?type=service",
        }

        // Private sLS instance
        // only uncomment this if you are running a private sLS instance
        /*
        "private": {
            label: "private", 
            type: "sls",
            url: "http://sls:8090/lookup/records/?type=service", 
        },
        */
    }
}


//admin api
exports.admin = {
    //api server host/port (don't change this for docker)
    host: "0.0.0.0",
    port: 8080,

    //authentication service public key to verify jwt token generated by it
    jwt: { pub: fs.readFileSync(__dirname+"/auth/auth.pub") }

}

exports.common = {
    //needed to access auth service to pull profile
    auth_api: "http://sca-auth:8080",
    auth_jwt: fs.readFileSync(__dirname+"/auth/user.jwt").toString().trim()
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
                level: "info",
                colorize: true
            }),

            /*
            //store all warnings / errors in error.log
            new (winston.transports.File)({ 
                filename: "error.log",
                level: "warn"
            })
            */
        ]
    }
}

