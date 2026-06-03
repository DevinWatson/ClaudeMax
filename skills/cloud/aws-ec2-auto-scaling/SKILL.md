---
name: aws-ec2-auto-scaling
description: Use when designing, configuring, or operating Amazon EC2 Auto Scaling — Auto Scaling groups (ASGs), launch templates, desired/min/max capacity, scaling policies (target tracking, step, simple, scheduled, predictive), health checks (EC2/ELB) and instance replacement, lifecycle hooks, instance refresh, mixed instances + Spot allocation, warm pools, and multi-AZ distribution (Amazon EC2 Auto Scaling). Loads the ASG-specific knowledge: how to define a group, choose scaling policies, wire health checks and refreshes, mix Spot, and verify scaling. Consumed by the EC2 Auto Scaling specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) for self-healing elastic EC2 fleets.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ec2-auto-scaling, asg, scaling-policy, spot, instance-refresh]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon EC2 Auto Scaling

Keeps a fleet of EC2 instances at the right size: it launches/terminates instances to hit a
desired capacity, replaces unhealthy ones, spreads across AZs, and scales on demand. Pair it with
EC2 (the instances) and a load balancer. Pick EC2 Auto Scaling when you run EC2 instances directly
and need elasticity + self-healing; you do NOT need it for Fargate/Lambda/App Runner (each has its
own scaling), and for application-level container scaling on EC2 use ECS service autoscaling /
capacity providers instead.

## Core concepts and components
- **Auto Scaling group (ASG)** — manages a set of instances across subnets/AZs with **min /
  desired / max** capacity from a **launch template**.
- **Scaling policies** — **target tracking** (hold a metric, e.g. 50% CPU or ALB
  RequestCountPerTarget), **step**, **simple**, **scheduled** (time-based), **predictive** (ML
  forecast).
- **Health checks** — EC2 status and/or ELB target health; unhealthy instances are terminated and
  replaced. **Lifecycle hooks** — pause launch/terminate for bootstrap/drain.
- **Instance refresh** — rolling replacement to a new launch-template version. **Mixed instances
  policy** — multiple types + On-Demand/Spot split with allocation strategies. **Warm pools** —
  pre-initialized stopped instances for fast scale-out.

## Configuration and sizing
- Set min/max as real bounds; let desired float under policy. Spread across ≥2–3 AZs for HA.
- Prefer target tracking on a leading metric (ALB request count or CPU) over simple/step. Add
  scheduled actions for known peaks; predictive for cyclical traffic.
- Tune cooldowns/warm-up so new instances are in service before more scale-out.

## Security and IAM
- The ASG uses the instance profile/security from its launch template — apply the EC2 least-
  privilege, IMDSv2, encrypted-EBS, tight-SG practices there.
- The Auto Scaling **service-linked role** manages scaling; lifecycle hooks may need an SNS/SQS
  target with scoped permissions.

## Cost levers
- **Mixed instances + Spot** (capacity-optimized) for big savings on stateless tiers, with an
  On-Demand base for stability. Scale in aggressively off-peak; scheduled scale-down for known
  idle windows; right-size the launch template instance types.

## Scaling and limits
- Capacity bounded by min/max and EC2 vCPU service quotas. Multi-AZ rebalancing maintains spread.
  Scale-in protection / termination policies control which instances go first.

## Operating procedure
1. **Provision** — create a versioned launch template, then an ASG across multiple subnets with
   min/desired/max via Terraform `aws_autoscaling_group` + `aws_launch_template` or
   `aws autoscaling create-auto-scaling-group`.
2. **Configure** — attach the ASG to the target group, set ELB health checks, add scaling
   policies (target tracking + scheduled), lifecycle hooks, and a mixed-instances/Spot policy.
3. **Secure** — least-privilege launch-template instance profile, IMDSv2, encrypted EBS, scoped
   SG; scope any lifecycle-hook notification targets.
4. **Verify** — apply [[verify-by-running]]: confirm `aws autoscaling describe-auto-scaling-groups`
   shows instances `InService` and `Healthy` across AZs; trigger or simulate load and confirm the
   policy adds/removes instances and the ALB target group stays healthy; run an instance refresh
   and confirm it completes.

## Inputs
Launch template (type/AMI/profile/SG), AZ/subnet set, min/desired/max, target metric + SLO,
known traffic schedule, Spot tolerance, health-check source, bootstrap/drain timing.

## Output
An ASG + launch-template definition with capacity bounds and AZ spread, scaling policies (with
rationale), health-check + lifecycle-hook config, mixed-instances/Spot strategy, and verification
evidence (scale-out/in + refresh).

## Notes
- Gotchas: ELB health check vs EC2 health check (use ELB so app-level failures replace
  instances); thrashing from too-tight cooldowns/aggressive step policies; instance refresh can
  cause capacity dips without proper min-healthy %/warm pool; Spot interruptions need stateless,
  drainable apps; desired set manually fights scaling policies; warm pools add cost.
- IaC/CLI: Terraform `aws_autoscaling_group`, `aws_launch_template`, `aws_autoscaling_policy`,
  `aws_autoscaling_schedule`, `aws_autoscaling_lifecycle_hook`. CLI `aws autoscaling
  create-auto-scaling-group`, `put-scaling-policy`, `start-instance-refresh`,
  `describe-auto-scaling-groups`. CloudFormation `AWS::AutoScaling::AutoScalingGroup`.
