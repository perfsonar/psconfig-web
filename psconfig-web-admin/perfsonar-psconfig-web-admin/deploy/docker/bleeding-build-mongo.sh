#!/usr/bin/bash
VERSION=`cat bleeding-version`

echo "preparing pwa-mongo version $VERSION"

docker build pwa-mongo --network host -t perfsonar/pwa-mongo:$VERSION --no-cache --force-rm

if [ ! $? -eq 0 ]; then
    echo "failed to build"
    exit
fi

#docker tag perfsonar/pwa-mongo perfsonar/pwa-mongo:$VERSION
docker push perfsonar/pwa-mongo:$VERSION

#docker tag perfsonar/pwa-mongo perfsonar/pwa-mongo:latest
#docker push perfsonar/pwa-mongo:latest

