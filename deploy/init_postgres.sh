#!/bin/bash

if [ ! -d /var/lib/pgsql/data]; then;
    service postgresql initdb
fi
service postgresql start
su - postgres -c "echo \"CREATE ROLE mcadmin PASSWORD 'md5b5f5ba1a423792b526f799ae4eb3d59e' SUPERUSER CREATEDB CREATEROLE INHERIT LOGIN;\" | psql"

