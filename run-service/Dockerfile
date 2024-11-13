# PeerPrep Run Service
# 
# This file is used for creating a PUBLIC container using PUBLICY
# available images.
# 
# References:
# https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs

FROM node:20

# expose 8007 port for access to the container
ENV PORT=8007
EXPOSE 8007

# set workdir to prevent the container from restarting
WORKDIR /app

# copy all files into the Docker container
COPY . .

# install node libraries
RUN npm install

# execute the server; use dev command instead
CMD ["node", "server.js"]