# Retrieve the ECS compatible AMIs
data "aws_ami" "ecs_ami" {
  most_recent = true

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }

  filter {
    name   = "name"
    values = ["al2023-ami-ecs-hvm-*-arm64-ebs"]
  }

  owners = ["amazon"]
}

# Retrieve the usual AL2023 AMIs
data "aws_ami" "ec2_ami" {
  most_recent = true

  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64-ebs"]
  }

  owners = ["amazon"]
}

# Create the launch templates used for both ECS and EC2 deployment
resource "aws_launch_template" "ecs_launch_template" {
  name                   = "peerprep-ecs-launch-template"
  image_id               = data.aws_ami.ecs_ami.id
  instance_type          = "t4g.small"
  key_name               = aws_key_pair.default.key_name
  vpc_security_group_ids = [aws_security_group.PeerPrepInternalEC2SG]
  user_data              = var.ECS_LAUNCH_TEMPLATE_USER_DATA

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_ecs_policy
  }

  monitoring {
    enabled = true
  }
}

resource "aws_launch_template" "run_service_launch_template" {
  name                   = "peerprep-run-service-launch-template"
  image_id               = data.aws_ami.ecs_ami.id
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.default.key_name
  vpc_security_group_ids = [aws_security_group.PeerPrepRunServiceSG]
  user_data              = var.EC2_RUN_SERVICE_LAUNCH_TEMPLATE_USER_DATA

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_ecs_policy
  }

  monitoring {
    enabled = true
  }
}
