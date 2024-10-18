resource "aws_api_gateway_rest_api" "apigw" {
  name        = "API Gateway"
  description = "Main API Gateway for PeerPrep"
  body = jsonencode({
    openapi = "3.0.1"

    info = {
      title       = "API Gateway"
      description = "Main API Gateway for PeerPrep"
      version     = "1.0.2"
    }

    paths = {
      "/api/matching-service"                     = {}
      "/api/question-service/id/{id}"             = {}
      "/api/question-service/random"              = {}
      "/api/collaboration-service"                = {}
      "/api/collaboration-service/create-room"    = {}
      "/api/user-service/users/logout"            = {}
      "/api/user-service/users/changeDisplayName" = {}
      "/api/user-service/users/login"             = {}
      "/api/collaboration-service/users"          = {}
      "/api/question-service/filter"              = {}
      "/api/collaboration-service/deregister"     = {}
      "/api/collaboration-service/rooms"          = {}
      "/api/question-service"                     = {}
      "/api/collaboration-service/users/{id}"     = {}
      "/api/run-service/execute"                  = {}
      "/api/collaboration-service/register"       = {}
      "/api/question-service/categories"          = {}
      "/api/run-service"                          = {}
      "/api/user-service/users/changePassword"    = {}
      "/api/user-service/users"                   = {}
    }

    components = {
      schemas = {}
      securitySchemes = {
        PeerPrepJWTAuthorizer = {
          type = "apiKey"
          name = "Cookie"
          in : "header"
          x-amazon-apigateway-authtype = "custom"
          x-amazon-apigateway-authorizer = {
            authorizerUri                = "arn:aws:apigateway:ap-southeast-1:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-1:730335480348:function:jwtAuthoriser/invocations"
            authorizerResultTtlInSeconds = 300
            identitySource               = "method.request.header.Cookie"
            type                         = "request"
          }
        }
      }
    }
  })
}

