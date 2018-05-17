#DEBUG=profile:* env=dev PORT=12402 nodemon -i node_modules ./index.js

#run this for production
#sequelize db:migrate

pm2 delete pwaadmin 
pm2 start api/pwaadmin.js --watch --ignore-watch="ui deploy \.log$ test .sh$ api/pub"

pm2 delete pwacache
pm2 start api/pwacache.js --watch --ignore-watch="ui deploy \.log$ test .sh$ api/pub"

pm2 delete pwapub
pm2 start api/pwapub.js --watch --ignore-watch="ui deploy \.log$ test .sh$ api/admin"

#pm2 logs meshconfig
