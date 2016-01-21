
docker rm -f mca-postgres1
docker run --name mca-postgres1 \
    --restart=always \
    -d postgres

echo "wait for postgres to startup completely"
sleep 5

docker rm -f mca1
docker run --name mca1 \
    --restart=always \
    --link mca-postgres1:postgres \
    -p 0.0.0.0:10080:80 \
    -p 0.0.0.0:10443:443 \
    -p 0.0.0.0:19443:9443 \
    -d soichih/mca

#docker logs -f mca1
echo "you can test it as https://soichi7.ppa.iu.edu:10443/meshconfig"
