# Create ECS Cluster
resource "aws_ecs_cluster" "peerprep" {
  name = var.ECS_CLUSTER_NAME

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = var.ECS_CLUSTER_NAME
  }
}

# Create the Cluster Providers
resource "aws_ecs_capacity_provider" "peerprep" {
  name = "peerprep-compute-provider"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.ecs.arn
    managed_termination_protection = "ENABLED"

    managed_scaling {
      maximum_scaling_step_size = var.ECS_DESIRED_CLUSTER_CAPACITY
      minimum_scaling_step_size = var.ECS_DESIRED_CLUSTER_CAPACITY
      status                    = "ENABLED"
      target_capacity           = var.ECS_DESIRED_CLUSTER_CAPACITY
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "peerprep" {
  cluster_name       = aws_ecs_cluster.peerprep.name
  capacity_providers = aws_ecs_capacity_provider.peerprep.name
}

# Define the services
resource "aws_ecs_service" "user-service" {
  name = "user-service-v1"
  iam_role = aws_iam_role.ec2_ecs_policy.arn
  cluster = aws_ecs_cluster.peerprep.id
  task_definition = aws_ecs_task_definition.user-service.arn
  desired_count = 1
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent = 100

  load_balancer {
    target_group_arn = aws_lb_target_group.user-service.arn
    container_name = "user-service"
    container_port = 8001
  }

  ordered_placement_strategy {
    type = "binpack"
    field = "memory"
  }

  ordered_placement_strategy {
    type = "spread"
    field = "attribute:ecs.availability-zone"
  }

  lifecycle {
    ignore_changes = [ desired_count ]
  }
}

resource "aws_ecs_service" "matching-service" {
  name = "matching-service-v1"
  iam_role = aws_iam_role.ec2_ecs_policy.arn
  cluster = aws_ecs_cluster.peerprep.id
  task_definition = aws_ecs_task_definition.matching-service.arn
  desired_count = 1
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent = 100

  load_balancer {
    target_group_arn = aws_lb_target_group.matching-service.arn
    container_name = "matching-service"
    container_port = 8002
  }

  ordered_placement_strategy {
    type = "binpack"
    field = "memory"
  }

  ordered_placement_strategy {
    type = "spread"
    field = "attribute:ecs.availability-zone"
  }

  lifecycle {
    ignore_changes = [ desired_count ]
  }
}

resource "aws_ecs_service" "question-service" {
  name = "question-service-v1"
  iam_role = aws_iam_role.ec2_ecs_policy.arn
  cluster = aws_ecs_cluster.peerprep.id
  task_definition = aws_ecs_task_definition.question-service.arn
  desired_count = 1
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent = 100

  load_balancer {
    target_group_arn = aws_lb_target_group.question-service.arn
    container_name = "question-service"
    container_port = 8003
  }

  ordered_placement_strategy {
    type = "binpack"
    field = "memory"
  }

  ordered_placement_strategy {
    type = "spread"
    field = "attribute:ecs.availability-zone"
  }

  lifecycle {
    ignore_changes = [ desired_count ]
  }
}

resource "aws_ecs_service" "collaboration-service" {
  name = "collaboration-service-v1"
  iam_role = aws_iam_role.ec2_ecs_policy.arn
  cluster = aws_ecs_cluster.peerprep.id
  task_definition = aws_ecs_task_definition.collaboration-service.arn
  desired_count = 1
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent = 100

  load_balancer {
    target_group_arn = aws_lb_target_group.collaboration-service.arn
    container_name = "question-service"
    container_port = 8004
  }

  ordered_placement_strategy {
    type = "binpack"
    field = "memory"
  }

  ordered_placement_strategy {
    type = "spread"
    field = "attribute:ecs.availability-zone"
  }

  lifecycle {
    ignore_changes = [ desired_count ]
  }
}

# Create the Task Definitions
resource "aws_ecs_task_definition" "user-service" {
  family = "peerprep-user-service"
  execution_role_arn = aws_iam_role.ecs_service_policy.arn
  task_role_arn = aws_iam_role.ecs_service_policy.arn
  cpu = "338"
  memory = "338"
  network_mode = "bridge"
  requires_compatibilities = ["EC2"]
  
  runtime_platform {
    cpu_architecture = "ARM64"
    operating_system_family = "LINUX"
  }
  
  container_definitions = jsonencode([
    {
      name = "user-service"
      image = "asdfghjklxd/peerprep-user-service:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8001
          hostPort = 8001
          protocol = "tcp"
          appProtocol = "http"
        }
      ]
      environment = [
        {
          name = "PORT"
          value = "8001"
        },
        {
          name = "ACCESS_TOKEN_SECRET"
          value = var.ACCESS_TOKEN_SECRET
        },
        {
          name = "MONGO_PROD_URI"
          value = var.MONGO_PROD_URI
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/peerprep-user-service"
          "mode"                  = "non-blocking"
          "awslogs-create-group"  = "true"
          "max-buffer-size"       = "25m"
          "awslogs-region"        = "ap-southeast-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

