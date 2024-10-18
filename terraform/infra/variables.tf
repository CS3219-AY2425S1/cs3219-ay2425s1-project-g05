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
  type    = string
  default = "IyEvYmluL2Jhc2gKZWNobyBFQ1NfQ0xVU1RFUj0ke2F3c19lY3NfY2x1c3Rlci5kZWZhdWx0Lm5hbWV9ID4+IC9ldGMvZWNzL2Vjcy5jb25maWc="
}

# default = base64encode(<<-EOF
#       #!/bin/bash
#       echo ECS_CLUSTER=${aws_ecs_cluster.default.name} >> /etc/ecs/ecs.config
#     EOF
#   )

variable "EC2_RUN_SERVICE_LAUNCH_TEMPLATE_USER_DATA" {
  type    = string
  default = "IyEvYmluL2Jhc2gKIyBpbnN0YWxsIGRlcGVuZGVuY2llcwpzdWRvIHl1bSAteSBpbnN0YWxsIHdnZXQgdW56aXAgZG9ja2VyOwoKIyBlbmFibGUgZG9ja2VyCnN1ZG8gc3lzdGVtY3RsIGVuYWJsZSBkb2NrZXI7CgojIHNldHVwIGdydWIyCiMgZml4IGdpdmVuIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9qdWRnZTAvanVkZ2UwL2lzc3Vlcy8zMjUKc3VkbyBlY2hvIEdSVUJfQ01ETElORV9MSU5VWD1cInN5c3RlbWQudW5pZmllZF9jZ3JvdXBfaGllcmFyY2h5PTBcIiA+PiAvZXRjL2RlZmF1bHQvZ3J1YjsKCiMgdXBkYXRlLWdydWIKc3VkbyBlY2hvICcjIS9iaW4vc2gKc2V0IC1lCnN1ZG8gZ3J1YjItbWtjb25maWcgLW8gL2Jvb3QvZ3J1YjIvZ3J1Yi5jZmcgIiRAIicgPiAvdXNyL3NiaW4vdXBkYXRlLWdydWI7CnN1ZG8gY2hvd24gcm9vdDpyb290IC91c3Ivc2Jpbi91cGRhdGUtZ3J1YjsKc3VkbyBjaG1vZCA3NTUgL3Vzci9zYmluL3VwZGF0ZS1ncnViOwpzdWRvIHVwZGF0ZS1ncnViOwoKIyBjcmVhdGUgc3RhcnR1cCBzY3JpcHQKc3VkbyBlY2hvICcjIS9iaW4vYmFzaAojIGVuYWJsZSBkb2NrZXIKc3VkbyBzeXN0ZW1jdGwgc3RhcnQgZG9ja2VyOwoKIyBzdGFydCBqdWRnZTAKY2QganVkZ2UwLXYxLjEzLjE7CgojIHN0YXJ0IHRoZSBzZXJ2aWNlcwpzdWRvIGRvY2tlci1jb21wb3NlIHVwIC1kIGRiIHJlZGlzOwpzbGVlcCAxMHM7CgpzdWRvIGRvY2tlci1jb21wb3NlIHVwIC1kOwpzbGVlcCA1czsKJyA+ICRIT01FL3N0YXJ0dXAuc2g7CmNobW9kICt4ICRIT01FL3NjcmlwdC5zaAoKIyBjcmVhdGUgc3lzdGVtZCBzZXJ2aWNlIHRvIGVuYWJsZSBzdGFydHVwIHNjcmlwdCB0byBleGVjdXRlIG9uIGJvb3QKc3VkbyBlY2hvICcKW1VuaXRdCkRlc2NyaXB0aW9uPUp1ZGdlMCBBUEkgU3RhcnR1cApBZnRlcj1kb2NrZXIuc2VydmljZQoKW1NlcnZpY2VdClR5cGU9b25lc2hvdApFeGVjU3RhcnQ9JEhPTUUvc3RhcnR1cC5zaApSZW1haW5BZnRlckV4aXQ9eWVzCgpbSW5zdGFsbF0KV2FudGVkQnk9bXVsdGktdXNlci50YXJnZXQKJyA+IC9ldGMvc3lzdGVtZC9zeXN0ZW0vanVkZ2UwLnNlcnZpY2U7CnN1ZG8gc3lzdGVtY3RsIGVuYWJsZSBqdWRnZTAuc2VydmljZTsKCiMgaW5zdGFsbCBkb2NrZXIgY29tcG9zZQojIHNjcmlwdCB0YWtlbiBmcm9tIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzYzNzA4MDM1L2luc3RhbGxpbmctZG9ja2VyLWNvbXBvc2Utb24tYW1hem9uLWVjMi1saW51eC0yLTlrYi1kb2NrZXItY29tcG9zZS1maWxlCnN1ZG8gY3VybCAtTCBodHRwczovL2dpdGh1Yi5jb20vZG9ja2VyL2NvbXBvc2UvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2RvY2tlci1jb21wb3NlLSQodW5hbWUgLXMpLSQodW5hbWUgLW0pIC1vIC91c3IvbG9jYWwvYmluL2RvY2tlci1jb21wb3NlOwpzdWRvIGNobW9kICt4IC91c3IvbG9jYWwvYmluL2RvY2tlci1jb21wb3NlOwoKIyBnZXQganVkZ2UwIGJpbmFyaWVzCndnZXQgaHR0cHM6Ly9naXRodWIuY29tL2p1ZGdlMC9qdWRnZTAvcmVsZWFzZXMvZG93bmxvYWQvdjEuMTMuMS9qdWRnZTAtdjEuMTMuMS56aXA7CnVuemlwIGp1ZGdlMC12MS4xMy4xLnppcDsKCiMgcmVzdGFydCB0byBhcHBseSBjaGFuZ2VzCnN1ZG8gcmVib290Ow=="
}

# default = base64encode(<<-EOF
# #!/bin/bash
# # install dependencies
# sudo yum -y install wget unzip docker;

# # enable docker
# sudo systemctl enable docker;

# # setup grub2
# # fix given by https://github.com/judge0/judge0/issues/325
# sudo echo GRUB_CMDLINE_LINUX=\"systemd.unified_cgroup_hierarchy=0\" >> /etc/default/grub;

# # update-grub
# sudo echo '#!/bin/sh
# set -e
# sudo grub2-mkconfig -o /boot/grub2/grub.cfg "$@"' > /usr/sbin/update-grub;
# sudo chown root:root /usr/sbin/update-grub;
# sudo chmod 755 /usr/sbin/update-grub;
# sudo update-grub;

# # create startup script
# sudo echo '#!/bin/bash
# # enable docker
# sudo systemctl start docker;

# # start judge0
# cd judge0-v1.13.1;

# # start the services
# sudo docker-compose up -d db redis;
# sleep 10s;

# sudo docker-compose up -d;
# sleep 5s;
# ' > $HOME/startup.sh;
# chmod +x $HOME/script.sh

# # create systemd service to enable startup script to execute on boot
# sudo echo '
# [Unit]
# Description=Judge0 API Startup
# After=docker.service

# [Service]
# Type=oneshot
# ExecStart=$HOME/startup.sh
# RemainAfterExit=yes

# [Install]
# WantedBy=multi-user.target
# ' > /etc/systemd/system/judge0.service;
# sudo systemctl enable judge0.service;

# # install docker compose
# # script taken from https://stackoverflow.com/questions/63708035/installing-docker-compose-on-amazon-ec2-linux-2-9kb-docker-compose-file
# sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose;
# sudo chmod +x /usr/local/bin/docker-compose;

# # get judge0 binaries
# wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip;
# unzip judge0-v1.13.1.zip;

# # restart to apply changes
# sudo reboot;
#     EOF
#   )

# export TF_VAR_ACCESS_TOKEN_SECRET=your_access_token_secret
# export TF_VAR_MONGO_PROD_URI=your_mongo_prod_uri
variable "ACCESS_TOKEN_SECRET" {
  sensitive = true
}

# user service
variable "USER_SERVICE_PORT" {
  default = 8001
}

variable "USER_SERVICE_MONGO_PROD_URI" {
  sensitive = true
}

# question-service
variable "QUESTION_SERVICE_DEV_URI" {
  sensitive = true
}

variable "QUESTION_SERVICE_PORT" {
  default = 8003
}

# matching-service
variable "MATCHING_SERVICE_PORT" {
  default = 8002
}

variable "MATCHING_SERVICE_MONGO_PROD_URI" {
  sensitive = true
}

# collaboration-service
variable "COLLABORATION_SERVICE_HOST" {
  default = "0.0.0.0"
}

variable "COLLABORATION_SERVICE_PORT" {
  default = 8004
}

variable "COLLABORATION_REDIS_HOST" {
  default = "redis://redis.mrdqdr.ng.0001.apse1.cache.amazonaws.com:6379"
}

variable "COLLABORATION_REDIS_PORT" {
  default = 6379
}
