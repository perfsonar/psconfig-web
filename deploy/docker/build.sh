
docker build mca-pub -t soichih/mca-pub
docker tag soichih/mca-pub soichih/mca-pub:3.0.1
docker push soichih/mca-pub

docker build mca-admin -t soichih/mca-admin
docker tag soichih/mca-admin soichih/mca-admin:3.0.0
docker push soichih/mca-admin
