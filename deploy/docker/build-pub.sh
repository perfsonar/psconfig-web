#!/usr/bin/bash
VERSION=`cat version`

echo "preparing pwa-pub version $VERSION"
rm -rf pwa-pub/tmp
mkdir pwa-pub/tmp
cp -r ../../api pwa-pub/tmp
rm -f pwa-pub/tmp/api/config.js
cp -r ../../package.json pwa-pub/tmp
rm -rf pwa-pub/tmp/api/config

docker build pwa-pub -t perfsonar/pwa-pub
#docker build pwa-pub -t perfsonar/pwa-pub:latest

if [ ! $? -eq 0 ]; then
    echo "failed to build"
    exit
fi

docker tag perfsonar/pwa-pub perfsonar/pwa-pub:latest
docker push perfsonar/pwa-pub:latest

docker tag perfsonar/pwa-pub perfsonar/pwa-pub:$VERSION
docker push perfsonar/pwa-pub:$VERSION
