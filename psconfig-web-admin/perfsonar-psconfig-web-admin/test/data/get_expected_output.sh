#!/usr/bin/bash

URL=$1
echo "Getting config at $URL";
NAME=${URL##h*/}
NAME=${NAME%\?*}-expected.json
echo "Name: $NAME";
CMD="wget --no-check-certificate -O $NAME $URL"
echo "COMMAND: $CMD"
`$CMD`
