resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 1
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.peerprep.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_autoscaling_group" "ecs" {
  name                  = "peerprep-ecs-asg"
  max_size              = 1
  min_size              = 1
  vpc_zone_identifier   = [aws_default_subnet.az1.id, aws_default_subnet.az2.id, aws_default_subnet.az3.id]
  health_check_type     = "EC2"
  protect_from_scale_in = true

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  launch_template {
    id      = aws_launch_template.ecs_launch_template.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 0
    }
  }

  lifecycle {
    create_before_destroy = false
  }

  tag {
    key                 = "Name"
    value               = "peerprep-ecs-asg"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_group" "ec2" {
  name                  = "peerprep-run-service-asg"
  max_size              = 1
  min_size              = 1
  vpc_zone_identifier   = [aws_default_subnet.az1.id, aws_default_subnet.az2.id, aws_default_subnet.az3.id]
  health_check_type     = "EC2"
  protect_from_scale_in = true

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  launch_template {
    id      = aws_launch_template.run_service_launch_template.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 0
    }
  }

  lifecycle {
    create_before_destroy = false
  }

  tag {
    key                 = "Name"
    value               = "peerprep-run-service-asg"
    propagate_at_launch = true
  }
}
