
exports.convert_tool = function( tool, reverse ) {
    var tool_conversions = {
        "bwctl/nuttcp": "nuttcp",
        "bwctl/iperf": "iperf",
        "bwctl/iperf3": "iperf3",
    //    "bwctl/iperf3": "bwctliperf3"

    };
    // update tool names
    if ( reverse ) {
        tool_conversions = exports.swap( tool_conversions );
    }
    if ( tool in tool_conversions ) {
        console.log("changing tool ", tool, " to ", tool_conversions[tool]);
        tool = tool_conversions[ tool ];
    }
    return tool;

};

exports.swap = function (json){
  var ret = {};
  for(var key in json){
    ret[json[key]] = key;
  }
  return ret;
};

exports.rename_underscores_to_dashes = function( obj ) {
    for(var key in obj ) {
        var newkey = key.replace(/_/g, "-");
        obj[ newkey ] = obj[ key ];
        if (key.match(/_/) ) delete obj[ key ];
    }

};

exports.rename_dashes_to_underscores = function( obj ) {
    for(var key in obj ) {
        var newkey = key.replace(/-/g, "_");
        obj[ newkey ] = obj[ key ];
        if (key.match(/-/) ) delete obj[ key ];
    }

};

exports.rename_field = function( obj, oldname, newname ) {
    if ( typeof obj == "undefined" ) {
        return;
    }
    if ( oldname in obj ) {
        obj[ newname ] = obj[ oldname ];
        delete obj[ oldname ];
    }
    return obj;

};
