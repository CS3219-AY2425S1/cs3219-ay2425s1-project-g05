resource "aws_key_pair" "default" {
  key_name   = "PeerPrep-EC2"
  public_key = var.SSH_PUBLIC_KEY
}