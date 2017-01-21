FROM node:6

MAINTAINER Soichi Hayashi <hayashis@iu.edu>

RUN apt-get update && \
    apt-get install -y git

#can't pull content from parent directory.. so let's pull from git 
#which means I have to git push before I can rebuild it..
RUN git clone https://github.com/soichih/meshconfig-admin.git /app

RUN cd /app && npm install --production

EXPOSE 8080

CMD ["node", "/app/api/mcpub.js"]
