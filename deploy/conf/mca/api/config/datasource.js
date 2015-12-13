
exports.services = {
    "osg": {
        label: 'OSG', 
        type: 'global-sls',
        activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json', 
        query: '?type=service&group-communities=OSG',
        //cache: 1000*60*5, //refresh every 5 minutes (default 30 minutes)
    },

    "atlas": {
        label: 'ATLAS', 
        type: 'global-sls',
        activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json', 
        query: '?type=service&group-communities=ATLAS',
        //cache: 1000*60*5, //refresh every 5 minutes (default 30 minutes)
    },

    "cms": {
        label: 'CMS', 
        type: 'global-sls',
        activehosts_url: 'http://ps1.es.net:8096/lookup/activehosts.json', 
        query: '?type=service&group-communities=CMS',
        //cache: 1000*60*5, //refresh every 5 minutes (default 30 minutes)
    },
    
    //private sLS instance
    "wlcg": {
        label: 'WLCG', 
        type: 'sls',
        url: 'http://core-test1:8090/lookup/records/?type=service&group-communities=WLCG',
        cache: 1000*60*5, //refresh every 5 minutes (default 30 minutes)
        //exclude: [], //TODO - allow user to remove certain service from appearing in the UI
    },
};

