'use strict';
// contrib
const winston = require('winston');
const _ = require('underscore');

// mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);

exports.archive_extract_name = function( archive_obj ) {
    var name;
    name = archive_obj.name + "-" + archive_obj._id;
    return name;

};

exports.format_archive = function( archive_obj, id_override ) {
    log_json("formatting archive obj ...", archive_obj);
    var out = {};
    var name = id_override || archive_obj.name + "-" + archive_obj._id;

    //var name = archive_obj.name;
    out[ name ] = {};
    var row = out[name];

    switch ( archive_obj.archiver ) {
        case "esmond":
            row.archiver = "esmond";
            row.data = {
                "url": archive_obj.data._url,
                "measurement-agent": "{% scheduled_by_address %}"
            };
            delete out._url;
        
            break;
        case "rabbitmq":
            row.archiver = "rabbitmq";
            row.data = archive_obj.data;
            var url = row.data._url;
            var user = row.data._username;
            var password = row.data._password;

            if ( url && ( user || password ) ) {
                user = user || "";
                password = password || "";
                if ( url.match(/^ampqs?:\/\//) ) {
                    url = url.replace(/^(ampqs?:\/\/)(.+)$/, "$1" + user +":" + password + "@$2");
                    row.data._url = url;

                }
            
            }
            delete row.data._username;
            delete row.data._password;

            break;
        case "rawjson":
            console.log("PARSEC", JSON.parse( archive_obj.data.archiver_custom_json ));
            out = _.extend( row, JSON.parse( archive_obj.data.archiver_custom_json ));
            //row.data = JSON.parse( archive_obj.data.archiver_custom_json );
            console.log("ROW", out);
            break;

    }
    delete out.name;
    delete out.desc;

    console.log("formatted output: ", out);
    return out;

};

function log_json( message, json_text ) {
    logger.debug(message, JSON.stringify(json_text, null, 3));
}
