#!/bin/bash
pushd pwa-sample-config 
chown -R root:root pwa
tar cfz ../pwa.sample.tar.gz pwa
popd
