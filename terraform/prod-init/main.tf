provider "aws" {
  region = "ap-southeast-1"
}

# Create the S3 bucket for remote state management
resource "aws_s3_bucket" "production-bucket" {
  bucket = "peerprep-g05-production"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "production-bucket-versioning" {
  bucket = aws_s3_bucket.production-bucket

  versioning_configuration {
    status = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "production-bucket-encryption" {
  bucket = aws_s3_bucket.production-bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "production-bucket-privacy" {
  bucket                  = aws_s3_bucket.production-bucket
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Create the DynamoDB table used for state locking
resource "aws_dynamodb_table" "production-lock" {
  name           = "peerprep-production-lock"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "LockID"

  server_side_encryption {
    enabled = true
  }

  attribute {
    name = "LockID"
    type = "S"
  }
}

