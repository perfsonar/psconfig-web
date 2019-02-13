#!/bin/bash
pushd pwa-sample-config 
chown -R root:root *
tar cfz ../pwa.sample.tar.gz *
popd
