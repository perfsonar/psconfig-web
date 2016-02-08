docker build --no-cache -t mca.rhel7.test test

docker rm -f mca-rhel7-test
docker run \
    --name mca-rhel7-test \
    -p 0.0.0.0:15080:80 \
    -p 0.0.0.0:15443:443 \
    -p 0.0.0.0:15943:9443 \
    --privileged \
    -d mca.rhel7.test /usr/sbin/init
#-d mca.rhel7.test tail -f /etc/issue

echo "running setup"
docker exec -it mca-rhel7-test /opt/mca/mca/deploy/rhel7/setup.sh
echo "test it via https://soichi7.ppa.iu.edu:15443/meshconfig/admin/"

