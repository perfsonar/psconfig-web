
#I have to move most of the app under pwa-admin so that docker won't complain about *outside of context*
echo "preparing pwa-admin"
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
rm -f pwa-admin/tmp/api/auth.pub
rm -f pwa-admin/tmp/api/auth.key
rm -f pwa-admin/tmp/api/user.jwt

docker build pwa-admin -t perfsonar/pwa-admin
if [ ! $? -eq 0 ]; then
    echo "failed to build"
    exit
fi

docker tag perfsonar/pwa-admin perfsonar/pwa-admin:4.0b1
docker push perfsonar/pwa-admin

echo "preparing pwa-pub"
rm -rf pwa-pub/tmp
mkdir pwa-pub/tmp
cp -r ../../api pwa-pub/tmp
rm -f pwa-pub/tmp/api/config.js
cp -r ../../package.json pwa-pub/tmp
rm -rf pwa-pub/tmp/api/config

docker build pwa-pub -t perfsonar/pwa-pub
if [ ! $? -eq 0 ]; then
    echo "failed to build"
    exit
fi

docker tag perfsonar/pwa-pub perfsonar/pwa-pub:4.0b1
docker push perfsonar/pwa-pub
