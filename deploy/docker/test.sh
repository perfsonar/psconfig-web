#docker network create mca

#docker run \
#    --restart=always \
#    --net mca \
#    --name mca-mongo1 \
#    -d mongo

#docker rm -f sca-auth1
#docker run \
#    --restart=always \
#    --net mca \
#    --name sca-auth1 \
#    -v `pwd`/scaconfig/auth:/app/api/config \
#    -d soichih/sca-auth

#echo "pulling auth.pub and user.jwt from auth service"
#sleep 3
cp ./scaconfig/auth/auth.pub config
cp ./scaconfig/auth/user.jwt config

#docker rm -f sca-profile1
#docker run \
#    --restart=always \
#    --net mca \
#    --name sca-profile1 \
#    -v `pwd`/scaconfig/auth:/app/api/config \
#    -d soichih/sca-auth

docker rm -f mca-admin1
docker run \
    --restart=always \
    --net mca \
    --name mca-admin1 \
    -v `pwd`/config:/app/api/config \
    -p 10080:80 \
    -p 18080:8080 \
    -d soichih/mca-admin

docker rm -f mca-pub1
docker run \
    --restart=always \
    --net mca \
    --name mca-pub1 \
    -v `pwd`/config:/app/api/config \
    -p 18081:8080 \
    -d soichih/mca-pub

#docker exec -it mca-admin1 bash

