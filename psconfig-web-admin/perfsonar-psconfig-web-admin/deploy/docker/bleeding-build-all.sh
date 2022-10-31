#!/usr/bin/bash
echo "Building pwa-admin BLEEDING tag ..."
./bleeding-build-admin.sh && echo "Building pwa-pub ..." && \
./bleeding-build-pub.sh
