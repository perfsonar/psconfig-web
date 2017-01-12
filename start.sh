#DEBUG=profile:* env=dev PORT=12402 nodemon -i node_modules ./index.js

#run this for production
#sequelize db:migrate

pm2 delete mcadmin 
pm2 start api/mcadmin.js --watch --ignore-watch="ui deploy \.log$ test .sh$ api/pub"

pm2 delete mccache
pm2 start api/mccache.js --watch --ignore-watch="ui deploy \.log$ test .sh$ api/pub"

pm2 delete mcpub
pm2 start api/mcpub.js --watch --ignore-watch="ui deploy \.log$ test .sh$ api/admin"

#pm2 logs meshconfig
