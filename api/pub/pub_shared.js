"use strict";
// contrib
const winston = require("winston");
const _ = require("underscore");
const moment = require("moment");

// mine
const config = require("../config");
const logger = new winston.Logger(config.logger.winston);

exports.archive_extract_name = function (archive_obj) {
    var name;
    name = archive_obj.name + "-" + archive_obj._id;
    return name;
};

exports.format_archive = function (archive_obj, id_override) {
    //console.log("formatting archive obj ...\n", JSON.stringify(archive_obj));
    var out = {};
    var _id = archive_obj._id;
    var name = id_override || archive_obj.name + "-" + archive_obj._id;
    if (archive_obj.archiver == "rawjson") {
        name = archive_obj._id;
    }

    //var name = archive_obj.name;
    out[name] = {};
    var row = out[name];

    switch (archive_obj.archiver) {
        case "esmond":
            row.archiver = "esmond";
            row.data = {
                url: archive_obj.data._url,
                "measurement-agent": "{% scheduled_by_address %}",
            };
            if (
                "verify_ssl" in archive_obj.data &&
                archive_obj.data["verify_ssl"]
            ) {
                row.data["verify-ssl"] = archive_obj.data["verify_ssl"];
            }
            delete out._url;

            break;
        case "rabbitmq":
            row.archiver = "rabbitmq";
            row.data = archive_obj.data;
            var url = row.data._url;
            var user = row.data._username;
            var password = row.data._password;

            if (url && (user || password)) {
                user = user || "";
                password = password || "";
                if (url.match(/^amqps?:\/\//)) {
                    url = url.replace(
                        /^(amqps?:\/\/)(.+)$/,
                        "$1" + user + ":" + password + "@$2"
                    );
                    row.data._url = url;
                }
            }
            delete row.data._username;
            delete row.data._password;

            if (row.data && "connection_lifetime" in row.data) {
                var expires = row.data.connection_lifetime;
                expires = exports.seconds_to_iso8601(expires);
                row.data["connection-expires"] = expires;
                delete row.data.connection_lifetime;
                row.data.schema = 2;
            }
            //exports.rename_underscores_to_dashes( row.data );
            exports.rename_field(row.data, "exchange_key", "exchange");
            exports.rename_underscores_to_dashes(row.data, ["_url"]);

            break;
        case "rawjson":
            //out = {};
            console.log(
                "PARSE RAWJSON",
                JSON.parse(archive_obj.data.archiver_custom_json)
            );
            //var _id = archive_obj[_id];
            name = "custom-" + name;
            //row[ _id ] = {};
            out[name] = JSON.parse(archive_obj.data.archiver_custom_json);
            delete out[_id];
            //row.data = JSON.parse( archive_obj.data.archiver_custom_json );
            //exports.rename_field(row, _id, name);

            break;
    }
    delete out.name;
    delete out.desc;

    //console///.log("formatted output: ", out);
    return out;
};

exports.rename_underscores_to_dashes = function (obj, keysToIgnore) {
    for (var key in obj) {
        if (_.contains(keysToIgnore, key)) {
            continue;
        }
        var pattern = /_/g;
        //if ( preserveLeading ) {
        //    pattern = /(?!^)_/g;
        //}
        var newkey = key.replace(pattern, "-");
        obj[newkey] = obj[key];
        if (key.match(pattern)) delete obj[key];
    }
};

exports.rename_field = function (obj, oldname, newname) {
    if (typeof obj == "undefined") {
        return;
    }
    if (oldname in obj) {
        obj[newname] = obj[oldname];
        delete obj[oldname];
    }
    return obj;
};

exports.seconds_to_iso8601 = function (dur) {
    var isoOut = moment.duration(dur * 1000); // moment.duration expects milliseconds
    isoOut = isoOut.toISOString();
    return isoOut;
};

function log_json(message, json_text) {
    logger.debug(message, JSON.stringify(json_text, null, 3));
}
