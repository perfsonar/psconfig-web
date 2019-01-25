#!/bin/bash
# Path where the certs should reside
CERT_PATH="/etc/pwa/nginx/certs"

# Only generate certs if the cert files do not already exist
if [ ! -f "$CERT_PATH/key.pem" ] && [ ! -f "$CERT_PATH/cert.pem" ] && [ ! -f "$CERT_PATH/trusted.pem"  ]; then
    echo "nginx SSL cert/key not found; auto-generated self-signed cert";
    # make sure the CERT_PATH exists
    mkdir -p "$CERT_PATH"
    # generate key/cert
    openssl req -x509 -nodes -days 10000 -newkey rsa:2048 -keyout "$CERT_PATH/key.pem" -out "$CERT_PATH/cert.pem" -batch
    # copy cert.pem to trusted.pm since we don't really have a trusted chain, and we need the file
    cp "$CERT_PATH/cert.pem" "$CERT_PATH/trusted.pem"
    # set proper permissions
    chmod 0640 "$CERT_PATH/*.pem"
else
    echo "Key/cert found; skipping self-signed cert generation"
fi
