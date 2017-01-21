#!/bin/bash

echo "starting mcadmin/mccache api servers"
pm2 start /app/api/mcadmin.js
pm2 start /app/api/mccache.js

echo "starting http-server for ui"
http-server -p 80 -a 0.0.0.0 /app/ui
#pm2 start http-server -- -p 80 -a 0.0.0.0 -d false /app/ui

