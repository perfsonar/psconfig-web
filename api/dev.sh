#DEBUG=profile:* env=dev PORT=12402 nodemon -i node_modules ./index.js

pm2 start profile.js --watch

pm2 logs profile
