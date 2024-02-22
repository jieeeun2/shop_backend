#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

pm2 start src/index.js --name 'backendAPI'