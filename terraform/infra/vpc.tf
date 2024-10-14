# Reuse the default VPC created
resource "aws_default_vpc" "default" {}

# Reuse the default AZs created
resource "aws_default_subnet" "az1" {
  availability_zone = "ap-southeast-1a"
}

resource "aws_default_subnet" "az2" {
  availability_zone = "ap-southeast-1b"
}

resource "aws_default_subnet" "az3" {
  availability_zone = "ap-southeast-1c"
}
