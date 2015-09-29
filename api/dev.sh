#DEBUG=profile:* env=dev PORT=12402 nodemon -i node_modules ./index.js

pm2 delete meshconfig
pm2 start meshconfig.js --watch --ignore-watch="\.log$ test/ .sh$"

#pm2 logs meshconfig
