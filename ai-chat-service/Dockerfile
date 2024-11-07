# PeerPrep AI Chat Service Dockerfile
# 
# References:
# https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs

FROM node:20

# expose 8008 port for access to the container
EXPOSE 8008

# Set work dir to prevent retarts
WORKDIR /ai-chat-service

# copy all files into the Docker container
COPY . .

# install node libraries
RUN npm install

# execute the server
CMD ["node", "server.js"]
