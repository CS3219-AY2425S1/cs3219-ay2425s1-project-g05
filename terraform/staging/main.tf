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
  QUESTION_SERVICE_DEV_URI = var.QUESTION_SERVICE_DEV_URI
  USER_SERVICE_MONGO_PROD_URI = var.USER_SERVICE_MONGO_PROD_URI
  MATCHING_SERVICE_MONGO_PROD_URI = var.MATCHING_SERVICE_MONGO_PROD_URI
  ACCESS_TOKEN_SECRET = var.ACCESS_TOKEN_SECRET
}
