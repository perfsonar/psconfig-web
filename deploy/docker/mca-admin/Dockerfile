FROM node:6

MAINTAINER Soichi Hayashi <hayashis@iu.edu>

RUN apt-get update && \
    apt-get install -y git && \
    npm install http-server -g && \
    npm install pm2 -g && \
    pm2 install pm2-logrotate

#can't pull content from parent directory.. so let's pull from git 
#which means I have to git push before I can rebuild it..
RUN git clone https://github.com/soichih/meshconfig-admin.git /app #mark2
RUN cd /app && npm install --production
RUN cd /app/ui && npm install --production

EXPOSE 80 
EXPOSE 8080

ADD start.sh /
CMD ["/start.sh"]
