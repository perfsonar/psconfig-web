
#this depends on soichih/mca containing the latest content
#run build_docker_container.sh first (which also depends on github!)

rm -rf _common
rm -rf _conf
cp -r ../common _common
cp -r ../conf _conf

#docker build --no-cache -t mca.rhel7.build .
docker build -t mca.rhel7.build .

echo "pulling rpm out of it"
rm -rf test/x86_64
id=`docker create mca.rhel7.build`
docker cp $id:/root/rpmbuild/RPMS/x86_64 test/x86_64
docker rm $id
