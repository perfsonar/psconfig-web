var exports = {};

var archive_checks = [];


archive_checks.push(
    {
        name:"Esmond Test1",
        in: {"_id":"5f3429c4a6655378f2afc972","admins":["1"],"desc":"New Testspec","name":"srv.newa.ilight.net REUSABLE ESMONDz","archiver":"esmond","data":{"_url":"https://srv.newa.ilight.net/esmond/perfsonar/archive"},"create_date":"2020-08-12T17:41:24.150Z","update_date":"2020-08-17T15:33:44.312Z","__v":0},
    out: {"srv.newa.ilight.net REUSABLE ESMONDz-5f3429c4a6655378f2afc972":{"archiver":"esmond","data":{"url":"https://srv.newa.ilight.net/esmond/perfsonar/archive","measurement-agent":"{% scheduled_by_address %}"}}}
    }
);
archive_checks.push(
    {
        name:"Test2",
        in: 
            {"_id":"5efb409a47117561c498000a","admins":["1"],"desc":"New Testspec","name":"rabbit2","archiver":"rabbitmq","data":{"_url":"amqp://rabbithost.example.org:12345","_password":"123","_username":"mj82"},"create_date":"2020-06-30T13:39:38.383Z","update_date":"2020-08-18T15:14:44.449Z","__v":0},
        out:
            {"rabbit2-5efb409a47117561c498000a":{"archiver":"rabbitmq","data":{"_url":"amqp://mj82:123@rabbithost.example.org:12345"}}}
    }
    );
archive_checks.push(
    {
        name:"Rabbit with username/pass",
        in:
        {"_id":"5efb409a47117561c498000a","admins":["1"],"desc":"New Testspec","name":"rabbit2","archiver":"rabbitmq","data":{"_url":"amqp://mj82:123@rabbithost.example.org:12345"},"create_date":"2020-06-30T13:39:38.383Z","update_date":"2020-08-18T15:14:44.449Z","__v":0},
    out: 
        {"rabbit2-5efb409a47117561c498000a":{"archiver":"rabbitmq","data":{"_url":"amqp://mj82:123@rabbithost.example.org:12345"}}}
    }
    );
archive_checks.push(        
    {
        name: "Rabbit SSL with username/pass",
        in: {"_id":"5ef6106042e7f049ba97671a","admins":["1"],"desc":"New Testspec","name":"config-archive1","archiver":"rabbitmq","data":{"_url":"amqps://rabbithost.example.org:12345","_username":"asdf","_password":"qwerty","exchange_key":"asdf","routing_key":"ere","connection_lifetime":2},"create_date":"2020-06-26T15:12:32.463Z","update_date":"2020-09-01T15:27:27.019Z","__v":0},
    out:
{"config-archive1-5ef6106042e7f049ba97671a":{"archiver":"rabbitmq","data":{"_url":"amqps://asdf:qwerty@rabbithost.example.org:12345","exchange_key":"asdf","routing_key":"ere","connection_lifetime":2,"schema":2}}}
}
);

console.log("archive_checks", archive_checks);

exports.archive_checks = archive_checks;

module.exports = exports;
