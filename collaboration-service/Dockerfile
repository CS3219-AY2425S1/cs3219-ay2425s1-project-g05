# PeerPrep Collaboration Service Dockerfile
# 
# This file is used for creating a PUBLIC container using PUBLICY
# available images.
# 
# References:
# https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs

FROM node:20

# expose 8004 port for access to the container
EXPOSE 8004

# Set work dir to prevent retarts
WORKDIR /collaboration-service

# copy all files into the Docker container
COPY . .

# install node libraries
RUN npm install

# execute the server
CMD ["node", "server.js"]