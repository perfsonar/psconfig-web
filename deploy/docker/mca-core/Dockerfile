FROM node:6

MAINTAINER Soichi Hayashi <hayashis@iu.edu>

RUN apt-get update && \
    apt-get install -y git nginx && \
    service nginx stop

RUN git clone https://github.com/soichih/meshconfig-admin.git /mca
WORKDIR /mca
RUN npm install 

RUN cp /mca/deploy/docker/mca-core/nginx.conf /etc/nginx/nginx.conf
 
CMD ["nginx", "-g", "daemon off;"]
