

/* sqlite - you can only run single instance if you use sqlite (dev/test purpose only)
module.exports = {
    dialect: 'sqlite',
    storage: "/usr/local/tmp/meshconfig.sqlite",
    logging: function(str) {
        //ignore 
    }
}
*/

module.exports = 'postgres://mcadmin:asdfajksdhlfuawehklsdbdnjlbsehrg@localhost:15432/mcadmin';

