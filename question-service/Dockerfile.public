# PeerPrep Question Service Dockerfile
# 
# This file is used for creating a PUBLIC container using PUBLICY
# available images.
# 
# References:
# https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs

FROM node:20

# expose 8003 port for access to the container
EXPOSE 8003

# Set work dir to prevent retarts
WORKDIR /question-service

# copy all files into the Docker container
COPY . .

# install node libraries
RUN npm install

# execute the server
CMD ["node", "index.js"]