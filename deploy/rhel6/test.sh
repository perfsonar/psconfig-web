#docker pull centos:6
#docker rm -f mca-deptest-rhel6

echo "yum localinstall /root/rpmbuild/RPMS/x86_64/mca-1.0-1.el6.x86_64.rpm"
docker run --rm -it mca.rhel6 bash
