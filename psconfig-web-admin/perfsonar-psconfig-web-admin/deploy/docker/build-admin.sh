#!/usr/bin/bash
VERSION=`cat version`

echo "preparing pwa-admin version $VERSION"
rm -rf pwa-admin/tmp
mkdir pwa-admin/tmp
cp -r ../../api pwa-admin/tmp
rm -f pwa-admin/tmp/api/config.js
rm -f pwa-admin/tmp/api/auth.pub
rm -f pwa-admin/tmp/api/auth.key
rm -f pwa-admin/tmp/api/user.jwt

cp -r ../../ui pwa-admin/tmp
cp -r ../../package.json pwa-admin/tmp
rm -rf pwa-admin/tmp/api/config
rm -rf pwa/admin/tmp/ui/node_modules/bootstrap/dist/css
rm -f pwa-admin/tmp/api/auth.pub
rm -f pwa-admin/tmp/api/auth.key
rm -f pwa-admin/tmp/api/user.jwt

docker build pwa-admin -t perfsonar/pwa-admin:$VERSION --no-cache --force-rm
if [ ! $? -eq 0 ]; then
    echo "failed to build"
    exit
fi

#docker tag perfsonar/pwa-admin perfsonar/pwa-admin:$VERSION
docker push perfsonar/pwa-admin:$VERSION

#docker tag perfsonar/pwa-admin perfsonar/pwa-admin:latest
#docker push perfsonar/pwa-admin:latest

