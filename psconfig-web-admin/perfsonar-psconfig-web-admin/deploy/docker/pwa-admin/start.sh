#!/bin/bash
echo "starting pwaadmin/pwacache api servers"
pm2 start /app/api/pwaadmin.js #--watch /app/api/config
pm2 start /app/api/pwacache.js #--watch /app/api/config

echo "starting http-server for ui"
pm2 start http-server --name ui -- -p 80 -a :: -d false /app/ui

pm2 logs
