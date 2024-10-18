# Security groups
resource "aws_security_group" "PeerPrepInternalEC2SG" {
  name        = "PeerPrepInternalEC2SG"
  description = "SG for internal EC2 Instances"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_default_vpc.default.cidr_block]
  }

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "PeerPrepInternalEC2SG"
  }
}

resource "aws_security_group" "PeerPrepRunServiceSG" {
  name        = "PeerPrepRunServiceSG"
  description = "SG for Run Service"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port   = 2358
    to_port     = 2358
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "PeerPrepRunServiceSG"
  }
}

resource "aws_security_group" "PeerPrepALBSG" {
  name        = "PeerPrepALBSG"
  description = "SG for ALB"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port   = 8000
    to_port     = 8008
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 2358
    to_port     = 2358
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
