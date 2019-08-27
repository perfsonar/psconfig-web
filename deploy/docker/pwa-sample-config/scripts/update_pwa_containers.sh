#!/usr/bin/bash

# Make sure the containers stopped/deleted/updated here match
# those started in "start_pwa_containers.sh"

docker stop pwa-admin1
docker stop sca-auth
docker stop pwa-pub1
#docker stop pwa-pub2
#docker stop pwa-pub3
docker stop mongo
docker stop nginx
#docker stop postfix

docker rm pwa-admin1
docker rm sca-auth
docker rm pwa-pub1
#docker rm pwa-pub2
#docker rm pwa-pub3
docker rm mongo
docker rm nginx
#docker rm postfix

docker pull perfsonar/pwa-admin
docker pull perfsonar/pwa-pub
docker pull perfsonar/sca-auth
docker pull mongo
docker pull nginx
docker pull yorkshirekev/postfix

./start_pwa_containers.sh


