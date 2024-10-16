# Run Service

The Run Service is hosted on a EC2 instance on AWS.

No Docker is involved (at least locally) here, as it requires manual configurations on the server to get it up and running.

Some scripts have been written to "automate" the setup process, and is being used in the launch configurations when EC2 instances are set up on AWS.

`setup.sh`: This is the file that contains the main commands that are needed to set up an EC2 instance running Amazon Linux 2023 on AWS.

`startup.sh`: This is the file that contains the other commands that are needed to start up the Judge0 servers when an instance reboots. This script mainly runs Docker Compose as provided the Judge0 code repository, executing the commands needed to run the containers.

`judge0.conf`: This file represents the Judge0 config files used for setting up the server; secrets are redacted here, make sure to insert your own secrets. Refer to the file for more information on what secrets you need to provide.
