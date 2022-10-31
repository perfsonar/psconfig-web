#!/usr/bin/bash
echo "Building pwa-admin ..."
./build-admin.sh && echo "Building pwa-pub ..." && \
./build-pub.sh
