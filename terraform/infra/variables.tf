variable "ECS_DESIRED_CLUSTER_CAPACITY" {
  type    = number
  default = 1
}

variable "SSH_PUBLIC_KEY" {
  type    = string
  default = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC/mTlRD0cSh+ZDFeS/16YtxLUgrRVxC3TnVKNA1B+glziLiQZB8H/bxQHBwxhTK05lWXV4EM5VqLaJBgc5N5ebuRe5RB6YRZXzliPFTar0PS4Ct3z20lY106ZdWIxRqhtS8hcirQgey7zJMEm5G/egwH9BdVcCLZX+c5o/wFnY/trVXDeOq/Jx9wBSoiOt7+8XcGrf4Sl6oFM0wyX0gbV1NsosN1FckgyLqxN8kZkWlKdl+wNJmOFSU/Gi96aibiwt9bV52A/sXnQb9WaRSP74s0QIS7tmr7MXZfEAVm2eAE6ynyx8Tu9IEjRi8XXd/rTOTmjuBiPC32dz49sgwNH9"
}

variable "ECS_CLUSTER_NAME" {
  type    = string
  default = "peerprep-compute-cluster"
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
      # install dependencies
      sudo yum -y install wget unzip docker;

      # enable docker
      sudo systemctl enable docker;

      # setup grub2
      # fix given by https://github.com/judge0/judge0/issues/325
      sudo echo GRUB_CMDLINE_LINUX=\"systemd.unified_cgroup_hierarchy=0\" >> /etc/default/grub;

      # update-grub
      sudo echo '#!/bin/sh
      set -e
      sudo grub2-mkconfig -o /boot/grub2/grub.cfg "$@"' > /usr/sbin/update-grub;
      sudo chown root:root /usr/sbin/update-grub;
      sudo chmod 755 /usr/sbin/update-grub;
      sudo update-grub;

      # create startup script
      sudo echo '#!/bin/bash
      # enable docker
      sudo systemctl start docker;

      # start judge0
      cd judge0-v1.13.1;

      # start the services
      sudo docker-compose up -d db redis;
      sleep 10s;

      sudo docker-compose up -d;
      sleep 5s;
      ' > $HOME/startup.sh;
      chmod +x $HOME/script.sh

      # create systemd service to enable startup script to execute on boot
      sudo echo '
      [Unit]
      Description=Judge0 API Startup
      After=docker.service

      [Service]
      Type=oneshot
      ExecStart=$HOME/startup.sh
      RemainAfterExit=yes

      [Install]
      WantedBy=multi-user.target
      ' > /etc/systemd/system/judge0.service;
      sudo systemctl enable judge0.service;

      # install docker compose
      # script taken from https://stackoverflow.com/questions/63708035/installing-docker-compose-on-amazon-ec2-linux-2-9kb-docker-compose-file
      sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose;
      sudo chmod +x /usr/local/bin/docker-compose;

      # get judge0 binaries
      wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip;
      unzip judge0-v1.13.1.zip;

      # restart to apply changes
      sudo reboot;
    EOF
  )
}

# export TF_VAR_ACCESS_TOKEN_SECRET=your_access_token_secret
# export TF_VAR_MONGO_PROD_URI=your_mongo_prod_uri
variable "ACCESS_TOKEN_SECRET" {
  sensitive = true
}

variable "MONGO_PROD_URI" {
  sensitive = true
}

variable "JWT_SECRET_KEY" {
  sensitive = true
}
