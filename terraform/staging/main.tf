terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.33.0"
    }
  }

  backend "s3" {
    bucket         = "peerprep-g05-staging"
    key            = "state"
    region         = "ap-southeast-1"
    dynamodb_table = "peerprep-staging-lock"
    encrypt        = true

  }
}

provider "aws" {
  region = var.AWS_REGION
}

module "infra" {
  source = "../infra"
  ECS_LAUNCH_TEMPLATE_USER_DATA = var.ECS_LAUNCH_TEMPLATE_USER_DATA
  EC2_RUN_SERVICE_LAUNCH_TEMPLATE_USER_DATA = var.EC2_RUN_SERVICE_LAUNCH_TEMPLATE_USER_DATA
}
