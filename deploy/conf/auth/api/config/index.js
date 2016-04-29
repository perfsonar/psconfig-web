
var fs = require('fs');
var winston = require('winston');

exports.auth = {
    //user scopes to give to all new users
    default_scopes: {
        sca: ["user"], //needed for most sca service
        mca: ["user"], //needed because mca depends on it
    },

    //isser to use for generated jwt token
    iss: "https://pub-test1.sca.iu.edu/auth",
    //ttl for jwt
    ttl: 24*3600*1000, //1 day
    
    public_key: fs.readFileSync(__dirname+'/auth.pub'),
    private_key: fs.readFileSync(__dirname+'/auth.key'),
    
    //option for jwt.sign
    sign_opt: {algorithm: 'RS256'},
};

//comment this out if you don't want to confirm email
exports.email_confirmation = {
    //url: 'https://soichi7.ppa.iu.edu/auth/#/confirm_email', //TODO I should be able to construct this myself
    subject: 'MeshConfig Admin - Account Confirmation',
    from: 'hayashis@iu.edu',  //iu mail server will reject if this is non-repliable address/
};

//for user/pass login
exports.local = {
};

exports.x509 = {
    //http header to look for x509 DN. You have to configure your webserver to set ssl_dn on your header like..
    //for nginx 
    //          set proxy_set_header ssl_dn $ssl_client_s_dn
    //for apache, 
    //          RequestHeader set ssl_dn "%{SSL_CLIENT_S_DN}s"
    //          RequestHeader set ssl_verify "%{SSL_CLIENT_VERIFY}s"
    dn_header: 'ssl_dn',
    allow_origin: '*', 
};

exports.db = {
    "dialect": "sqlite", 
    "storage": "/var/lib/mca/auth.sqlite",
    "logging": false
}

//comment this out to disable iucas auth
exports.iucas = {
};

exports.express = {
    //web server port
    port: 12000,
    //host: "0.0.0.0",
};

exports.logger = {
    winston: {
        transports: [
            //display all logs to console
            new winston.transports.Console({
                timestamp: function() {
                    return Date.now(); //show time in unix timestamp
                },
                level: 'debug',
                colorize: true
            }),

            //store all warnings / errors in error.log
            new (winston.transports.File)({
                filename: 'error.log',
                level: 'warn'
            })
        ]
    },

    //logfile to store all requests (and its results) in json
    request: {
        transports: [
            new (winston.transports.File)({
                filename: 'request.log',
                json: true
            })
            /* (not sure how to get this working)
            new (winston.transports.Logstash)({
                port: 28777,
                node_name: 'isdp-soichi-dev',
                host: 'soichi7.ppa.iu.edu'
            })
            */
        ]
    }
}

