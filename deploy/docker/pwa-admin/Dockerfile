FROM node:6

MAINTAINER Michael Johnson <mj82@globalnoc.iu.edu>

EXPOSE 80 
EXPOSE 8080

ADD start.sh /
CMD ["/start.sh"]

RUN apt-get update && \
    npm install http-server -g && \
    npm install pm2 -g && \
    npm install chalk@3.0.0 -g && \
    npm install node-gyp@3.8.0 -g && \
    npm install coffee-script@1.10.0 -g && \
    pm2 install pm2-logrotate

ADD tmp/ /app
RUN cd /app && npm install --production
RUN cd /app/ui && npm install --production

