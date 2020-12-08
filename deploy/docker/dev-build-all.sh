#!/usr/bin/bash
echo "Building pwa-admin DEV tag ..."
./dev-build-admin.sh && echo "Building pwa-pub ..." && \
./dev-build-pub.sh
