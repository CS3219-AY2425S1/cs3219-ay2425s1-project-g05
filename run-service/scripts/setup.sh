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
cd $HOME/judge0-v1.13.1;

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

# update the config file, assuming that your environment variables are set
cd judge0-v1.13.1;
echo "AUTHN_TOKEN=$AUTHN_TOKEN
AUTHZ_TOKEN=$AUTHZ_TOKEN
REDIS_PASSWORD=$REDIS_PASSWORD
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
" >> judge0.conf;

# restart to apply changes, NECESSARY TO ENSURE THAT GRUB2 IS UPDATED
sudo reboot;
