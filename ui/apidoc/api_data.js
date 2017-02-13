define({ "api": [
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
            "description": "<p>List of host objects, count: total number of meshconfig (for paging)</p>"
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
    "description": "<p>Update host registration (non-Adhoc host can only update services, no_agent, and toolkit_url)</p>",
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
    "group": "System",
    "type": "get",
    "url": "/health",
    "title": "Get API status",
    "description": "<p>Get current API status</p>",
    "name": "GetHealth",
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
    "groupTitle": "System"
  }
] });
