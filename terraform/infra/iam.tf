# EC2/ECS Policies
data "aws_iam_policy_document" "ec2_ecs_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect = "Allow"

    principals {
      type = "Service"
      identifiers = [
        "ec2.amazonaws.com",
        "ecs.amazonaws.com",
        "ecs-tasks.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role" "ec2_ecs_policy" {
  name = "peerprep-ec2-ecs-iam-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_ecs_policy.json
}

resource "aws_iam_role_policy_attachement" "ec2_ecs_policy" {
  role = aws_iam_role.ec2_ecs_policy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_role_policy_attachment" "ecs_task_policy" {
  role = aws_iam_role.ec2_ecs_policy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_instance_profile" "ec2_ecs_policy" {
  name = "peerprep-ec2-ecs-iam-instance-role-profile"
  role = aws_iam_role.ec2_ecs_policy.name
}

# ECS Policies
data "aws_iam_policy_document" "ecs_service_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect = "Allow"

    principals {
      identifiers = [
        "ecs.amazonaws.com",
        "ecs-tasks.amazonaws.com"
      ]
      type = "Service"
    }
  }
}

data "aws_iam_policy_document" "ecs_service_role_policy" {
  statement {
    effect = "Allow"
    actions = [
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:Describe*",
      "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
      "elasticloadbalancing:DeregisterTargets",
      "elasticloadbalancing:Describe*",
      "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
      "elasticloadbalancing:RegisterTargets",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogStreams",
      "logs:PutSubscriptionFilter",
      "logs:PutLogEvents",
      "ecs:CreateCluster",
      "ecs:DeregisterContainerInstance",
      "ecs:DiscoverPollEndpoint",
      "ecs:Poll",
      "ecs:RegisterContainerInstance",
      "ecs:StartTelemetrySession",
      "ecs:UpdateContainerInstancesState",
      "ecs:Submit*",
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ecs:TagResource"
    ]
    condition {
      test = "ForAnyValue:StringEquals"
      variable = "ecs:CreateAction"
      values = ["CreateCluster", "RegisterContainerInstance"]
    }
    resources = ["*"]
  }
}

resource "aws_iam_role" "ecs_service_policy" {
  name = "peerprep-ecs-service-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_service_policy.json
}

resource "aws_iam_role_policy" "ecs_service_role_policy" {
  name = "peerprep-ecs-service-role-policy"
  role = aws_iam_role.ecs_service_policy
  policy = data.aws_iam_policy_document.ecs_service_role_policy.json
}

# API Gateway Policies
data "aws_iam_policy_document" "PeerPrepApiGatewayExecutionRole" {
  statement {
    effect = "Allow"
    actions = [
      "execute-api:Invoke",
      "execute-api:ManageConnections"
    ]
    resources = [
      "arn:aws:execute-api:*:*:*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "cloudformation:DescribeStacks",
      "cloudformation:ListStackResources",
      "cloudwatch:ListMetrics",
      "cloudwatch:GetMetricData",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSubnets",
      "ec2:DescribeVpcs",
      "kms:ListAliases",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:ListRoles",
      "lambda:*",
      "logs:DescribeLogGroups",
      "states:DescribeStateMachine",
      "states:ListStateMachines",
      "tag:GetResources",
      "xray:GetTraceSummaries",
      "xray:BatchGetTraces"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "iam:PassRole"
    ]
    resources = ["*"]
    condition {
      test = "ForAnyValue:StringEquals"
      variable = "iam:PassedToService"
      values = ["lambda.amazonaws.com"]
    }
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:DescribeLogStreams",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:log-group:/aws/lambda/*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "states:*"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role" "PeerPrepApiGatewayExecutionRole" {
  name = "PeerPrepApiGatewayExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.PeerPrepApiGatewayExecutionRole.json
}

resource "aws_iam_instance_profile" "PeerPrepApiGatewayExecutionRole" {
  name = "PeerPrepApiGatewayExecutionRole-instanceProfile"
  role = aws_iam_role.PeerPrepApiGatewayExecutionRole.name
}

data "aws_iam_policy_document" "PeerPrepLambdaExecutionAndLogsRole" {
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:*",
      "cloudwatch:GenerateQuery"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:Describe*",
      "logs:Get*",
      "logs:List*",
      "logs:StartQuery",
      "logs:StopQuery",
      "logs:TestMetricFilter",
      "logs:FilterLogEvents",
      "logs:StartLiveTail",
      "logs:StopLiveTail",
      "cloudwatch:GenerateQuery"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role" "PeerPrepLambdaExecutionAndLogsRole" {
  name = "PeerPrepLambdaExecutionAndLogsRole"
  assume_role_policy = data.aws_iam_policy_document.PeerPrepLambdaExecutionAndLogsRole.json
}

resource "aws_iam_instance_profile" "PeerPrepLambdaExecutionAndLogsRole" {
  name = "PeerPrepLambdaExecutionAndLogsRole-instanceProfile"
  role = aws_iam_role.PeerPrepLambdaExecutionAndLogsRole.name
}