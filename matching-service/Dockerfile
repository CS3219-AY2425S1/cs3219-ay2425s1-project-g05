# PeerPrep Matching Service Dockerfile
# 
# References:
# https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs

FROM node:20

# expose 8002 port for access to the container
EXPOSE 8002

# Set work dir to prevent retarts
WORKDIR /matching-service

# copy all files into the Docker container
COPY . .

# install node libraries
RUN npm install

# execute the server
CMD ["node", "server.js"]
