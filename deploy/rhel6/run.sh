#docker pull centos:6
#docker rm -f mca-deptest-rhel6

docker rm -f mca-rhel6
docker run \
    --name mca-rhel6 \
    -p 0.0.0.0:14080:80 \
    -p 0.0.0.0:14443:443 \
    -d mca.rhel6 tail -f /etc/issue

echo "to access it via https://soichi7.ppa.iu.edu:14443/meshconfig/admin/"
echo "you need to first interact with the container, then run /etc/init.d/mca setup"

