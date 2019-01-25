#!/bin/bash
echo "generating certs, if necessary"
/app/bin/generate_nginx_cert.sh

echo "starting pwaadmin/pwacache api servers"
pm2 start /app/api/pwaadmin.js #--watch /app/api/config
pm2 start /app/api/pwacache.js #--watch /app/api/config

echo "starting http-server for ui"
pm2 start http-server --name ui -- -p 80 -a 0.0.0.0 -d false /app/ui 

pm2 logs
