#rpmbuild -ba mca.spec
docker build -t mca.rhel6.build rpm
 
echo "pulling rpm out of it"
rm test/x86_64/*
id=`docker create mca.rhel6.build`
docker cp $id:/root/rpmbuild/RPMS/x86_64 test
docker rm $id
ls -la test/x86_64
