var winston = require('winston');

exports.winston = {
    transports: [
        //display all logs to console
        new winston.transports.Console({
            timestamp: function() {
                var d = new Date();
                return d.toString(); 
            },
            level: 'debug',
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
};


