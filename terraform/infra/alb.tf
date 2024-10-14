# Create the ALB
resource "aws_alb" "alb" {
  name            = "peerprep-alb"
  security_groups = [aws_security_group.PeerPrepALBSG]
  subnets         = [aws_default_subnet.az1, aws_default_subnet.az2, aws_default_subnet.az3]
}

# Create the Listeners
resource "aws_alb_listener" "run-service" {
  load_balancer_arn = aws_alb.alb.arn
  port              = 2358
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.run-service.arn
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_listener" "user-service" {
  load_balancer_arn = aws_alb.alb.arn
  port              = 8001
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.user-service.arn
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_listener" "matching-service" {
  load_balancer_arn = aws_alb.alb.arn
  port              = 8002
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.matching-service.arn
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_listener" "question-service" {
  load_balancer_arn = aws_alb.alb.arn
  port              = 8003
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.question-service.arn
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_listener" "collaboration-service" {
  load_balancer_arn = aws_alb.alb.arn
  port              = 8004
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.collaboration-service.arn
  }

  depends_on = [aws_alb.alb]
}

# Create the Target Groups
resource "aws_alb_target_group" "run-service" {
  name                 = "run-service"
  port                 = 2358
  protocol             = "HTTP"
  vpc_id               = aws_default_vpc.default.id
  deregistration_delay = 300

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    matcher             = "200"
    path                = "/docs"
    port                = 2358
    protocol            = "HTTP"
    timeout             = 5
  }

  stickiness {
    cookie_duration = 86400
    cookie_name     = "X-PEERPREP-COOKIE"
    enabled         = true
    type            = "app_cookie"
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_target_group" "user-service" {
  name                 = "user-service"
  port                 = 8001
  protocol             = "HTTP"
  vpc_id               = aws_default_vpc.default.id
  deregistration_delay = 300

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    matcher             = "200"
    path                = "/healthz"
    port                = 8001
    protocol            = "HTTP"
    timeout             = 5
  }

  stickiness {
    cookie_duration = 86400
    cookie_name     = "X-PEERPREP-COOKIE"
    enabled         = true
    type            = "app_cookie"
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_target_group" "matching-service" {
  name                 = "matching-service"
  port                 = 8002
  protocol             = "HTTP"
  vpc_id               = aws_default_vpc.default.id
  deregistration_delay = 300

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    matcher             = "200"
    path                = "/healthz"
    port                = 8002
    protocol            = "HTTP"
    timeout             = 5
  }

  stickiness {
    cookie_duration = 86400
    cookie_name     = "X-PEERPREP-COOKIE"
    enabled         = true
    type            = "app_cookie"
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_target_group" "question-service" {
  name                 = "question-service"
  port                 = 8003
  protocol             = "HTTP"
  vpc_id               = aws_default_vpc.default.id
  deregistration_delay = 300

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    matcher             = "200"
    path                = "/healthz"
    port                = 8003
    protocol            = "HTTP"
    timeout             = 5
  }

  stickiness {
    cookie_duration = 86400
    cookie_name     = "X-PEERPREP-COOKIE"
    enabled         = true
    type            = "app_cookie"
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_target_group" "collaboration-service" {
  name                 = "collaboration-service"
  port                 = 8004
  protocol             = "HTTP"
  vpc_id               = aws_default_vpc.default.id
  deregistration_delay = 300

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    matcher             = "200"
    path                = "/healthz"
    port                = 8004
    protocol            = "HTTP"
    timeout             = 5
  }

  stickiness {
    cookie_duration = 86400
    cookie_name     = "X-PEERPREP-COOKIE"
    enabled         = true
    type            = "app_cookie"
  }

  depends_on = [aws_alb.alb]
}
