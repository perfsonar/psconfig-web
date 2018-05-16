#docker network create pwa

docker rm -f pwa-admin1
docker run \
    --restart=always \
    --net pwa \
    --name pwa-admin1 \
    -v `pwd`/config:/app/api/config \
    -p 10080:80 \
    -p 18080:8080 \
    -d perfsonar/pwa-admin

docker rm -f pwa-pub1
docker run \
    --restart=always \
    --net pwa \
    --name pwa-pub1 \
    -v `pwd`/config:/app/api/config \
    -p 18081:8080 \
    -d perfsonar/pwa-pub

#docker exec -it pwa-admin1 bash

