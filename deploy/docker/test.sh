#docker network create mca

docker rm -f mca-admin1
docker run \
    --restart=always \
    --net mca \
    --name mca-admin1 \
    -v `pwd`/config:/app/api/config \
    -p 10080:80 \
    -p 18080:8080 \
    -d perfsonar/mca-admin

docker rm -f mca-pub1
docker run \
    --restart=always \
    --net mca \
    --name mca-pub1 \
    -v `pwd`/config:/app/api/config \
    -p 18081:8080 \
    -d perfsonar/mca-pub

#docker exec -it mca-admin1 bash

