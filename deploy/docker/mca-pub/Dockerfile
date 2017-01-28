FROM node:6
MAINTAINER Soichi Hayashi <hayashis@iu.edu>

EXPOSE 8080
CMD ["node", "/app/api/mcpub.js"]

ADD tmp/ /app
RUN cd /app && npm install --production

