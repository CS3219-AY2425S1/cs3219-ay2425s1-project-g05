#!/bin/bash
# enable docker
sudo systemctl start docker;

# start judge0
cd $HOME/judge0-v1.13.1;

# start the services
sudo docker-compose up -d db redis;
sleep 10s;

sudo docker-compose up -d;
sleep 5s;