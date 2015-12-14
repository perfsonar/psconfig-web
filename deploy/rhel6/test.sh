#docker pull centos:6
#docker rm -f mca-deptest-rhel6

echo "rpms at /root/rpmbuild/RPMS"
docker run --rm -it mca.rhel6 bash
