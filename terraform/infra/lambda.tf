resource "aws_lambda_function" "jwt" {
  filename      = "../../lambda/lambda.zip"
  function_name = "jwt"
  role          = aws_iam_role.PeerPrepLambdaExecutionAndLogsRole.arn
  handler       = "lambda.lambda_handler"

  source_code_hash = filebase64sha256("../../lambda/lambda.zip")

  runtime = "python3.10"

  environment {
    variables = {
      JWT_SECRET = var.ACCESS_TOKEN_SECRET
    }
  }
}
