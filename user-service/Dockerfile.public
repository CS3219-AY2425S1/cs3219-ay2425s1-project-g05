# PeerPrep User Service Dockerfile
# 
# This file is used for creating a PUBLIC container using PUBLICY
# available images.
# 
# References:
# https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs

FROM node:20

# expose 8001 port for access to the container
ENV PORT=8001
EXPOSE 8001

# Set work dir to prevent retarts
WORKDIR /user-service

# copy all files into the Docker container
COPY . .

# install node libraries
RUN npm install

# execute the server
CMD ["node", "server.js"]
