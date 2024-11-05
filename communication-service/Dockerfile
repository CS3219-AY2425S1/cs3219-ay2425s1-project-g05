# PeerPrep Communication Service Dockerfile
# 
# References:
# https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs

FROM node:20

# expose 8005 port for access to the container
EXPOSE 8005

# Set work dir to prevent retarts
WORKDIR /communication-service

# copy all files into the Docker container
COPY . .

# install node libraries
RUN npm install

# execute the server
CMD ["node", "server.js"]
