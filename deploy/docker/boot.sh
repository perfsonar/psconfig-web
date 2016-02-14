#!/bin/bash

#create mca user/db
#if [ ! -f /root/mca.pgpasswd ]; then
#    echo $RANDOM.$RANDOM.$RANDOM > /root/mca.pgpasswd
#    su - postgres -c "psql -c \"CREATE ROLE mca PASSWORD '$(cat /root/mca.pgpasswd)' CREATEDB INHERIT LOGIN;\""
#    su - postgres -c "psql -c \"CREATE DATABASE mcadmin OWNER mca\""
#    echo "//autogeneated by mca rpm" > /opt/mca/mca/api/config/db.js
#    echo "module.exports = 'postgres://mca:$(cat /root/mca.pgpasswd)@localhost/mcadmin'" >> /opt/mca/mca/api/config/db.js
#fi

#psql -h postgres -U postgres -c "CREATE DATABASE mcadmin"
createdb -h postgres -U postgres mcadmin
echo "module.exports = 'postgres://postgres@postgres/mcadmin'" >> /opt/mca/mca/api/config/db.js

#generate auth service token
if [ ! -f /opt/mca/auth/api/config/auth.pub ]; then
    cd /opt/mca/auth/api/config && ./genkey.sh
fi

#generate auth.jwt for mca admin
if [ ! -f /opt/mca/mca/api/config/auth.jwt ]; then
    cd /opt/mca/auth/bin && ./auth.js issue --scopes '{ "mca": [] }' --sub 'mca_service' --out /opt/mca/mca/api/config/auth.jwt
fi

#start apache
httpd 

#finally, start the mca services
pm2 start /opt/mca/mca.json --no-daemon

