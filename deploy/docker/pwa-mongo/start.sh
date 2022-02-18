#!/bin/bash
  
# turn on bash's job control
set -m
  
# Start the downgrade process
# It'll wait until the main mongod process is available
wait-for-it localhost:27017 -- mongo /downgrade_mongodb.js &

# Start the primary
mongod
