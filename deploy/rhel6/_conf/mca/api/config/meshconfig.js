
module.exports = {
    login_url: '/auth',

    /* I need to make auth service do this - probably by creating a some kind of cli tool or let user issue a rest call locally.
    //list of super admin usernames who can read/write everything
    super_admins: [
        "hayashis",
    ],
    */

    //service-types to support
    service_types: {
        "owamp": {label: "Latency"},
        "bwctl": {label: "Bandwidth"},
        "traceroute": {label: "Traceroute"},
        "ping": {label: "Pinger"},
    },

    //mesh types
    mesh_types: {
        "mesh": {label: "Mesh"},
        "disjoint": {label: "Disjoint"},
        "star": {label: "Star"},
        "ordered_mesh": {label: "Ordered Mesh"},
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
            pinger: {
                test_interval: 1,
            },
        }
    },

    //meshconfig admin loads sls content at startup, and then every once a while with following frequency
    sls_cache_frequency: 60*1000*10, //every 10 minutes
}


