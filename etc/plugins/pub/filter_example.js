var exports = {};

exports.process = function (request, psconfig_in, callback) {
    console.log("request", request);
    console.log("psconfig_in", psconfig_in);

    console.log("headers", request.headers);

    try {
        psconfig_in.archives["host-additional-archive0"].data.url =
            "asdf REPLACED BY PUBLISHER PLUGIN";
    } catch (e) {
        console.log("e", e);
        return callback({ message: e.name + ": " + e.message, code: 500 });
        //throw e;
    }
    return callback(null, psconfig_in);
};

module.exports = exports;
