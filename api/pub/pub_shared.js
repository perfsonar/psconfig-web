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

exports.format_archive = function( archive_obj ) {
    log_json("formatting archive obj ...", archive_obj);
    var out = {};
    var name = archive_obj.name + "-" + archive_obj._id;
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


            break;
        case "rabbitmq":
            row.archiver = "rabbitmq";
            row.data = archive_obj.data;
            /*
            {


            };
            */
            break;
        case "rawjson":
            console.log("PARSEC", JSON.parse( archive_obj.data.archiver_custom_json ));
            out = _.extend( row, JSON.parse( archive_obj.data.archiver_custom_json ));
            //row.data = JSON.parse( archive_obj.data.archiver_custom_json );
            console.log("ROW", out);
            break;

    }
    console.log("formatted output: ", out);
    return out;

};

function log_json( message, json_text ) {
    logger.debug(message, JSON.stringify(json_text, null, 3));
}
