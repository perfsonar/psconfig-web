#!/bin/bash
#This script is used by "service mca setup" to setup DB / access tokens, etc..

#initialize postgresql (with md5 host auth)
su - postgres -c "initdb --auth-host=md5 -D /var/lib/pgsql/data"

#start postgresql and enable
systemctl start postgresql
systemctl enable postgresql

#create mca user/db
if [ ! -f /opt/mca/mca/api/config/db.js ]; then
    password=$RANDOM.$RANDOM.$RANDOM
    su - postgres -c "echo \"CREATE ROLE mca PASSWORD '$password' CREATEDB INHERIT LOGIN;\" > cmd"
    if [ $? -eq 0 ]; then
        su - postgres -c "psql -f cmd"
        su - postgres -c "rm cmd"
        su - postgres -c "psql -c 'CREATE DATABASE mcadmin OWNER mca'"
        echo "//autogeneated by mca rpm" > /opt/mca/mca/api/config/db.js
        echo "module.exports = 'postgres://mca:$password@localhost/mcadmin'" >> /opt/mca/mca/api/config/db.js
    fi
fi

#generate service tokens
if [ ! -f /opt/mca/auth/api/config/auth.pub ]; then
    cd /opt/mca/auth/api/config && ./genkey.sh
fi

if [ ! -f /opt/mca/mca/api/config/profile.jwt ]; then
    cd /opt/mca/auth/bin && ./auth.js issue --scopes '{ "mca": [] }' --sub 'mca_service' --out /opt/mca/mca/api/config/profile.jwt
fi

#need to disable mod_ssl default conf
mv /etc/httpd/conf.d/ssl.conf /etc/httpd/conf.d/ssl.conf.disabled

#install igtf certs
mkdir -p /etc/grid-security/certificates
cd /etc/grid-security/certificates && wget https://dist.igtf.net/distribution/current/accredited/igtf-preinstalled-bundle-classic.tar.gz && tar -xzf *.tar.gz

systemctl start httpd
systemctl enable httpd

#finally start mca
pm2 startup systemd
pm2 start /opt/mca/mca/deploy/common/mca.json
pm2 save


