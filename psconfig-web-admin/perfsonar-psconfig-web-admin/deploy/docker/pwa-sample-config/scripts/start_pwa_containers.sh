#!/usr/bin/bash

# Start mongo Docker container
docker run \
        --restart=always \
        --net pwa \
        --name mongo \
        -v /usr/local/data/mongo:/data/db \
        -d mongo

# Start Authentication Service container
docker run \
    --restart=always \
    --net pwa \
    --name sca-auth \
    -v /etc/pwa/auth:/app/api/config \
    -v /usr/local/data/auth:/db \
    -d perfsonar/sca-auth

# Start PWA Application container
docker run \
    --restart=always \
    --net pwa \
    --name pwa-admin1 \
    -v /etc/pwa:/app/api/config:ro \
    -d perfsonar/pwa-admin

# Start pwa-pub1 container
docker run \
   --restart=always \
   --net pwa \
   --name pwa-pub1 \
   -v /etc/pwa:/app/api/config:ro \
   -d perfsonar/pwa-pub

# Uncomment following lines for additional publishers (you can add as many as you like)
# Make sure to update the nginx config as well, if you modify this

#docker run \
#   --restart=always \
#   --net pwa \
#   --name pwa-pub2 \
#   -v /etc/pwa:/app/api/config:ro \
#   -d perfsonar/pwa-pub
#
#docker run \
#   --restart=always \
#   --net pwa \
#   --name pwa-pub3 \
#   -v /etc/pwa:/app/api/config:ro \
#   -d perfsonar/pwa-pub

# Start nginx container
docker run \
    --restart=always \
    --net pwa \
    --name nginx \
    -v /etc/pwa/shared:/shared:ro \
    -v /etc/pwa/nginx:/etc/nginx:ro \
    -v /etc/pwa/auth:/certs:ro \
    -p 80:80 \
    -p 443:443 \
    -p 9443:9443 \
    -d nginx

# Docker postfix container (optional)
# Uncomment this if you need to run a local mail server in a container, rather than specifying an SMTP server

#docker run \
#    --network pwa \
#    -d --name postfix \
#    -p 587:25 \
#    --restart always \
#    yorkshirekev/postfix HOSTNAME
