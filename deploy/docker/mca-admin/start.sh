#!/bin/bash

echo "starting mcadmin/mccache api servers"
pm2 start /app/api/mcadmin.js #--watch /app/api/config
pm2 start /app/api/mccache.js #--watch /app/api/config

echo "starting http-server for ui"
pm2 start http-server --name ui -- -p 80 -a 0.0.0.0 -d false /app/ui 

pm2 logs
