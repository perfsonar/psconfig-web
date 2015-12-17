#rpmbuild -ba mca.spec
docker build -t mca.rhel6 .
 
#pull rpm out of it
id=$(docker create mca.rhel6)
docker cp $id:/root/rpmbuild/RPMS/x86_64 /tmp
docker rm $id
