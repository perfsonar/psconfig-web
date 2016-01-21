#docker pull centos:6
docker build -t mca.rhel6.test test

docker rm -f mca-rhel6-test
docker run \
    --name mca-rhel6-test \
    -p 0.0.0.0:14080:80 \
    -p 0.0.0.0:14443:443 \
    -p 0.0.0.0:14943:9443 \
    -d mca.rhel6.test tail -f /etc/issue

docker exec -it mca-rhel6-test /etc/init.d/mca setup
echo "test it via https://soichi7.ppa.iu.edu:14443/meshconfig/admin/"

