#DEBUG=profile:* env=dev PORT=12402 nodemon -i node_modules ./index.js

#run this for production
#sequelize db:migrate

pm2 delete mcadmin 
pm2 start mcadmin.js --watch --ignore-watch="\.log$ test/ .sh$ pub/"
pm2 delete mccache
pm2 start mccache.js --watch --ignore-watch="\.log$ test/ .sh$ pub/"

pm2 delete mcpub
#pm2 start mcpub.js -i 2  --watch --ignore-watch="\.log$ test/ .sh$"
pm2 start mcpub.js --watch --ignore-watch="\.log$ test/ .sh$ admin/"


#pm2 logs meshconfig
