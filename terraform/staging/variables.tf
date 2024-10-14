variable "AWS_REGION" {
  type    = string
  default = "ap-southeast-1"
}

variable "SSH_PUBLIC_KEY" {
  type    = string
  default = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC/mTlRD0cSh+ZDFeS/16YtxLUgrRVxC3TnVKNA1B+glziLiQZB8H/bxQHBwxhTK05lWXV4EM5VqLaJBgc5N5ebuRe5RB6YRZXzliPFTar0PS4Ct3z20lY106ZdWIxRqhtS8hcirQgey7zJMEm5G/egwH9BdVcCLZX+c5o/wFnY/trVXDeOq/Jx9wBSoiOt7+8XcGrf4Sl6oFM0wyX0gbV1NsosN1FckgyLqxN8kZkWlKdl+wNJmOFSU/Gi96aibiwt9bV52A/sXnQb9WaRSP74s0QIS7tmr7MXZfEAVm2eAE6ynyx8Tu9IEjRi8XXd/rTOTmjuBiPC32dz49sgwNH9"
}

variable "ECS_LAUNCH_TEMPLATE_USER_DATA" {
  type = string
  default = base64encode(<<-EOF
      #!/bin/bash
      echo ECS_CLUSTER=${aws_ecs_cluster.default.name} >> /etc/ecs/ecs.config
    EOF
  )
}

variable "EC2_RUN_SERVICE_LAUNCH_TEMPLATE_USER_DATA" {
  type = string
  default = base64encode(<<-EOF
      #!/bin/bash 
      # use this code as the code for the launch template of the EC2 instances registered to the 
      # ECS run cluster
      echo ECS_CLUSTER=${aws_ecs_cluster.default.name} >> /etc/ecs/ecs.config

      # install dependencies
      sudo yum -y install wget unzip docker

      # start docker engine
      sudo systemctl start docker

      # install docker compose
      # script taken from https://stackoverflow.com/questions/63708035/installing-docker-compose-on-amazon-ec2-linux-2-9kb-docker-compose-file
      sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
      sudo chmod +x /usr/local/bin/docker-compose

      # get judge0 binaries
      wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
      unzip judge0-v1.13.1.zip

      # start judge0
      cd judge0-v1.13.1
      sudo docker-compose up -d db redis
      sleep 10s
      sudo docker-compose up -d
      sleep 5s
    EOF
  )
}
