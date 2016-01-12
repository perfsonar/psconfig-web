#rpmbuild -ba mca.spec
docker build -t mca.rhel6.build rpm
 
#pull rpm out of it
id=`docker create mca.rhel6.build`
rm test/x86_64/*
docker cp $id:/root/rpmbuild/RPMS/x86_64 test
docker rm $id
