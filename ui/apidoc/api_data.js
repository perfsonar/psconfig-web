define({ "api": [
  {
    "type": "get",
    "url": "/health",
    "title": "Get API status",
    "group": "Administrator",
    "description": "<p>Get current API status</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>'ok' or 'failed'</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/index.js",
    "groupTitle": "Administrator",
    "name": "GetHealth"
  },
  {
    "type": "delete",
    "url": "/configs/:id",
    "title": "Remove Config",
    "group": "Configs",
    "description": "<p>Remove registered meshconfig</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"status\": \"ok\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/configs.js",
    "groupTitle": "Configs",
    "name": "DeleteConfigsId"
  },
  {
    "type": "get",
    "url": "/configs",
    "title": "Query Configs",
    "group": "Configs",
    "description": "<p>Query registered meshconfigs and its basic details</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Mongo find query JSON.stringify &amp; encodeURIComponent-ed - defaults to {} To pass regex, you need to use {$regex: &quot;....&quot;} format instead of js: /.../</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Mongo sort object - defaults to _id. Enter in string format like &quot;-name%20desc&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to return (admins will always be added). Multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Maximum number of records to return - defaults to 100</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Record offset for pagination (default to 0)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "configs:",
            "description": "<p>List of meshconfig registrations, count: total number of meshconfig (for paging)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/configs.js",
    "groupTitle": "Configs",
    "name": "GetConfigs"
  },
  {
    "type": "post",
    "url": "/configs",
    "title": "New Config",
    "group": "Configs",
    "description": "<p>Register new meshconfig</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "url",
            "description": "<p>URL to expose this config (&quot;config&quot; will be published under &quot;/pub/config&quot;) - needs to be unique</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>Name of this meshconfig (will be published on the meshconfig)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description for this meshconfig (MCA use only)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": true,
            "field": "tests",
            "description": "<p>Array of test objects (TODO - need documentation)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>Array of admin IDs</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Config",
            "description": "<p>created</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/configs.js",
    "groupTitle": "Configs",
    "name": "PostConfigs"
  },
  {
    "type": "put",
    "url": "/configs/:id",
    "title": "Update Config",
    "group": "Configs",
    "description": "<p>Update registered meshconfig</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "url",
            "description": "<p>URL to expose this config (&quot;config&quot; will be published under &quot;/pub/config&quot;)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>Name of this meshconfig (will be published on the meshconfig)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description for this meshconfig (MCA use only)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": true,
            "field": "tests",
            "description": "<p>Array of test objects (TODO - need documentation)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>Array of admin IDs</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Config",
            "description": "<p>updated</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/configs.js",
    "groupTitle": "Configs",
    "name": "PutConfigsId"
  },
  {
    "type": "delete",
    "url": "/hostgroups/:id",
    "title": "Remove Hostgroup",
    "group": "Hostgroups",
    "description": "<p>Remove a Hostgroup registration - if it's not used by any test</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"status\": \"ok\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/hostgroups.js",
    "groupTitle": "Hostgroups",
    "name": "DeleteHostgroupsId"
  },
  {
    "type": "get",
    "url": "/hostgroups",
    "title": "Query Hostgroups",
    "group": "Hostgroups",
    "description": "<p>Query hostgroups registered by users</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Mongo find query JSON.stringify &amp; encodeURIComponent-ed - defaults to {} To pass regex, you need to use {$regex: &quot;....&quot;} format instead of js: /.../</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Mongo sort object - defaults to _id. Enter in string format like &quot;-name%20desc&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to return (admins will always be added). Multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Maximum number of records to return - defaults to 100</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Record offset for pagination (default to 0)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "hostgroups:",
            "description": "<p>list of hostgroupx, and count: total number of hostgroup (for paging)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/hostgroups.js",
    "groupTitle": "Hostgroups",
    "name": "GetHostgroups"
  },
  {
    "type": "post",
    "url": "/hostgroups",
    "title": "New Hostgroup",
    "group": "Hostgroups",
    "description": "<p>Register New Hostgroup</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "service_type",
            "description": "<p>Service Type (bwctl, owamp, traceroute, ping, etc..)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "type",
            "description": "<p>Host group type (static, or dynamic)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "hosts",
            "description": "<p>Array of host IDs for static host group. (For dynamic host, this field is used to store <em>currently</em> resolved hosts (auto-updated periodically)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "host_filter",
            "description": "<p>Dynamic hostgroup script (only for dynamic hsot group)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>Array of admin IDs</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Hostgroup",
            "description": "<p>created</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/hostgroups.js",
    "groupTitle": "Hostgroups",
    "name": "PostHostgroups"
  },
  {
    "type": "put",
    "url": "/hostgroups/:id",
    "title": "Update Hostgroup",
    "group": "Hostgroups",
    "description": "<p>Update registered hostgroup</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "service_type",
            "description": "<p>] Service Type (bwctl, owamp, traceroute, ping, etc..) You can only change this if this hostgroup is not used by any config</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>Name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "type",
            "description": "<p>Host group type (static, or dynamic)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "hosts",
            "description": "<p>Array of host IDs for static host group. (For dynamic host, this field is used to store <em>currently</em> resolved hosts (auto-updated periodically)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "host_filter",
            "description": "<p>Dynamic hostgroup script (only for dynamic hsot group)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>Array of admin IDs</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Hostgroup",
            "description": "<p>updated</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/hostgroups.js",
    "groupTitle": "Hostgroups",
    "name": "PutHostgroupsId"
  },
  {
    "type": "delete",
    "url": "/configs/:id",
    "title": "Remove hosts",
    "group": "Hosts",
    "description": "<p>Remove host registration - if it's not used by any hostgroup / config. Also, if it's not adhoc, the host will be reregistered again by cache service.</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"status\": \"ok\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/hosts.js",
    "groupTitle": "Hosts",
    "name": "DeleteConfigsId"
  },
  {
    "type": "get",
    "url": "/hosts",
    "title": "Query Hosts",
    "group": "Hosts",
    "description": "<p>Query hosts known to MCA</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Mongo find query JSON.stringify &amp; encodeURIComponent-ed - defaults to {} To pass regex, you need to use {$regex: &quot;....&quot;} format instead of js: /.../</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Mongo sort object - defaults to _id. Enter in string format like &quot;-name%20desc&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to return (admins will always be added). Multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Maximum number of records to return - defaults to 100</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Record offset for pagination (default to 0)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "hosts:",
            "description": "<p>List of host objects(hosts:), count: total number of hosts (for paging)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/hosts.js",
    "groupTitle": "Hosts",
    "name": "GetHosts"
  },
  {
    "type": "post",
    "url": "/hosts",
    "title": "New Adhoc Host",
    "group": "Hosts",
    "description": "<p>Register new adhoc host</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "services",
            "description": "<p>List of service objects for this host (TODO - need documentation)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "toolkit_url",
            "description": "<p>(default: use hostname) URL to show for MadDash (leave it not set for &quot;auto&quot;)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>host description used in meshconfig - sitename will be used if missing</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": true,
            "field": "no_agent",
            "description": "<p>Set to true if this host should not read the meshconfig (passive) (default: false)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "hostname",
            "description": "<p>(Adhoc only) hostname</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "sitename",
            "description": "<p>(Adhoc only) sitename to show to assist hostname lookup inside MCA</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "info",
            "description": "<p>(Adhoc only) host information (key/value pairs of various info - TODO document)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "communities",
            "description": "<p>(Adhoc only) list of community names that this host is registered in LS</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>Array of admin IDs who can update information on this host (default to submitter)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Adhoc",
            "description": "<p>host registered</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/hosts.js",
    "groupTitle": "Hosts",
    "name": "PostHosts"
  },
  {
    "type": "put",
    "url": "/hosts/:id",
    "title": "Update host",
    "group": "Hosts",
    "description": "<p>Update host registration (non-Adhoc host can only update services, no_agent, desc, and toolkit_url)</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "services",
            "description": "<p>List of service objects for this host (TODO - need documentation)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": true,
            "field": "toolkit_url",
            "description": "<p>(default: use hostname) URL to show for MadDash</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>host description used in meshconfig - sitename will be used if missing</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": true,
            "field": "no_agent",
            "description": "<p>Set to true if this host should not read the meshconfig (passive) (default: false)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "hostname",
            "description": "<p>(Adhoc only) hostname</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "sitename",
            "description": "<p>(Adhoc only) sitename to show to assist hostname lookup inside MCA</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "info",
            "description": "<p>(Adhoc only) host information (key/value pairs of various info - TODO document)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "communities",
            "description": "<p>(Adhoc only) list of community names that this host is registered in LS</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>Array of admin IDs who can update information on this host</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Host",
            "description": "<p>updated</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/hosts.js",
    "groupTitle": "Hosts",
    "name": "PutHostsId"
  },
  {
    "group": "Publisher",
    "type": "get",
    "url": "/auto/:address",
    "title": "Download auto-meshconfig",
    "description": "<p>Construct meshconfig on-the-fly by aggregating all tests that includes the host specified</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "address",
            "description": "<p>Hostname of the toolkit instance to generate auto-meshconfig for.</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "ma_override",
            "description": "<p>Override all MA endpoints in this meshconfig with this hostname</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "host_version",
            "description": "<p>Override the host version provided via sLS (like.. to suppress v4 options)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/pub/controllers.js",
    "groupTitle": "Publisher",
    "name": "GetAutoAddress"
  },
  {
    "group": "Publisher",
    "type": "get",
    "url": "/config",
    "title": "Enumerate meshconfig URLs",
    "description": "<p>Query registered meshconfigs URLs and its basic details</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Mongo find query JSON.stringify &amp; encodeURIComponent-ed - defaults to {} To pass regex, you need to use {$regex: &quot;....&quot;} format instead of js: /.../</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "ma_override",
            "description": "<p>Override all MA endpoints in this meshconfig with this hostname</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "host_version",
            "description": "<p>Override the host version provided via sLS (like.. to suppress v4 options)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "List",
            "description": "<p>of object containing &quot;include&quot; parameter with meshconfig URL (format adhears to meshconfig_agent</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/pub/controllers.js",
    "groupTitle": "Publisher",
    "name": "GetConfig"
  },
  {
    "group": "Publisher",
    "type": "get",
    "url": "/config/:url",
    "title": "Download meshconfig",
    "description": "<p>Generate meshconfig that can be consumed by 3rd party tools (like meshconfig_generator for toolkit)</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "url",
            "description": "<p>url for registered meshconfig</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "ma_override",
            "description": "<p>Override all MA endpoints in this meshconfig with this hostname</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "host_version",
            "description": "<p>Override the host version provided via sLS (like.. to suppress v4 options)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/pub/controllers.js",
    "groupTitle": "Publisher",
    "name": "GetConfigUrl"
  },
  {
    "group": "Publisher",
    "type": "get",
    "url": "/health",
    "title": "Get API status for publisher",
    "description": "<p>Get current API status for MCA publisher</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>'ok' or 'failed'</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/pub/controllers.js",
    "groupTitle": "Publisher",
    "name": "GetHealth"
  },
  {
    "type": "delete",
    "url": "/testspecs/:id",
    "title": "Remove testspec",
    "group": "Testspecs",
    "description": "<p>Remove testspec registration - if it's not used by any test</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"status\": \"ok\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/testspecs.js",
    "groupTitle": "Testspecs",
    "name": "DeleteTestspecsId"
  },
  {
    "type": "get",
    "url": "/testspecs",
    "title": "Query Testspecs",
    "group": "Testspecs",
    "description": "<p>Query testspecs registered by users</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Mongo find query JSON.stringify &amp; encodeURIComponent-ed - defaults to {} To pass regex, you need to use {$regex: &quot;....&quot;} format instead of js: /.../</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Mongo sort object - defaults to _id. Enter in string format like &quot;-name%20desc&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to return (admins will always be added). Multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Maximum number of records to return - defaults to 100</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Record offset for pagination (default to 0)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "hosts:",
            "description": "<p>List of testspecs objects(testspecs:), count: total number of testspecs (for paging)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/testspecs.js",
    "groupTitle": "Testspecs",
    "name": "GetTestspecs"
  },
  {
    "type": "post",
    "url": "/testspecs",
    "title": "New testspec",
    "group": "Testspecs",
    "description": "<p>Register new testspec</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "service_type",
            "description": "<p>Service Type (bwctl, owamp, traceroute, ping, etc..)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "specs",
            "description": "<p>Spec details (key/value pairs)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>Array of admin IDs</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Testspec",
            "description": "<p>registered</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/testspecs.js",
    "groupTitle": "Testspecs",
    "name": "PostTestspecs"
  },
  {
    "type": "put",
    "url": "/testspecs/:id",
    "title": "Update testspec",
    "group": "Testspecs",
    "description": "<p>Update testspec information (service_type can be changed if it's not used by any test)</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "service_type",
            "description": "<p>Service Type (bwctl, owamp, traceroute, ping, etc..)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>Name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "specs",
            "description": "<p>Spec details (key/value pairs)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>Array of admin IDs</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Testspec",
            "description": "<p>updated</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/admin/controllers/testspecs.js",
    "groupTitle": "Testspecs",
    "name": "PutTestspecsId"
  }
] });
