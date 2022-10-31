#!/bin/bash
pushd pwa-sample-config 
#chown -R root:root *
tar --owner=root --group=root -czf ../pwa.sample.tar.gz *
popd
