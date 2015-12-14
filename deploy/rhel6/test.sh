#docker pull centos:6
docker rm -f mca-deptest-rhel6
docker run -v /home/hayashis/rpmbuild/RPMS:/rpm --name mca-deptest-rhel6 -d centos:6 tail -f /etc/issue
docker exec -it mca-deptest-rhel6 bash
