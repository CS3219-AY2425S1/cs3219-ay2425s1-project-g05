# https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs
FROM public.ecr.aws/docker/library/node:20

# expose 8003 port for access to the container
EXPOSE 8003

# copy all files into the Docker container
COPY . .

# install node libraries
RUN npm install

# execute the server
CMD ["node", "index.js"]