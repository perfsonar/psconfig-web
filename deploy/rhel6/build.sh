
rm -rf _common
rm -rf _conf
cp -r ../common _common
cp -r ../conf _conf

docker build -t mca.rhel6.build .
 
echo "pulling rpm out of it"
rm test/x86_64/*
id=`docker create mca.rhel6.build`
docker cp $id:/root/rpmbuild/RPMS/x86_64 test
docker rm $id
ls -la test/x86_64


