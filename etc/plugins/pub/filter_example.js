//use strict;

var exports = {};

exports.process = function( request, psconfig_in, callback ) {
    console.log("request", request);
    console.log("psconfig_in", psconfig_in);

    //delete psconfig_in.archives;
    //
    //
    psconfig_in.archives["host-additional-archive2-5efb409a47117561c498000a"].data._url = "NEW_URL";

    callback(null, psconfig_in);

};


module.exports = exports;
