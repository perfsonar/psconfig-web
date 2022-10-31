const moment = require("moment-interval");

exports.convert_tool = function (tool, reverse) {
    var tool_conversions = {
        "bwctl/nuttcp": "nuttcp",
        "bwctl/iperf": "iperf",
        "bwctl/iperf3": "iperf3",
        //    "bwctl/iperf3": "bwctliperf3"
    };
    // update tool names
    if (reverse) {
        tool_conversions = exports.swap(tool_conversions);
    }
    if (tool in tool_conversions) {
        tool = tool_conversions[tool];
    }
    return tool;
};

exports.convert_service_type = function (service_type, reverse) {
    var service_type_conversions = {
        throughput: "bwctl",
        latency: "owamp",
        latencybg: "owamp",
        ping: "rtt",
        traceroute: "traceroute",
    };

    if (reverse) {
        service_type_conversions = exports.swap(service_type_conversions);
    }

    if (service_type in service_type_conversions) {
        service_type = service_type_conversions[service_type];
    }
    return service_type;
};

exports.swap = function (json) {
    var ret = {};
    for (var key in json) {
        ret[json[key]] = key;
    }
    return ret;
};

exports.rename_underscores_to_dashes = function (obj) {
    for (var key in obj) {
        var newkey = key.replace(/_/g, "-");
        obj[newkey] = obj[key];
        if (key.match(/_/)) delete obj[key];
    }
};

exports.rename_dashes_to_underscores = function (obj) {
    for (var key in obj) {
        var newkey = key.replace(/-/g, "_");
        obj[newkey] = obj[key];
        if (key.match(/-/)) delete obj[key];
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
    var isoOut;
    if (dur == 0) {
        isoOut = "PT0S";
    } else {
        isoOut = moment.duration(dur * 1000); // moment.duration expects milliseconds
        isoOut = isoOut.toISOString();
    }
    return isoOut;
};

exports.iso8601_to_seconds = function (iso) {
    var mom = moment.duration(iso);
    var seconds = mom.asSeconds();
    return seconds;
};
