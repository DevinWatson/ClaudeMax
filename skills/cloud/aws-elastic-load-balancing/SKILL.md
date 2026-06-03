---
name: aws-elastic-load-balancing
description: Use when designing, provisioning, securing, or operating Elastic Load Balancing — the managed L4/L7 load balancers that distribute traffic across targets in a VPC (Elastic Load Balancing / ELB). Loads the ELB knowledge: Application Load Balancer (L7 host/path/header routing, listeners + rules, OIDC/Cognito auth, WAF), Network Load Balancer (L4 TCP/UDP/TLS, static IPs, source-IP preservation, PrivateLink backing), Gateway Load Balancer (L3 GENEVE appliance insertion), legacy Classic LB, target groups (instance/IP/Lambda), health checks, TLS termination with ACM, cross-zone, stickiness, deregistration delay, and access logs. Covers how to pick ALB vs NLB vs GWLB, route by content, terminate TLS, health-check correctly, and verify distribution and failover. Consumed by the ELB specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology — this owns the load-balancing service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, elastic-load-balancing, networking, alb, nlb, target-groups]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Elastic Load Balancing (ELB)

Managed **load balancers** that distribute incoming traffic across healthy targets (EC2, containers,
IPs, Lambda) within a VPC, across Availability Zones, with health checking and elastic scaling.

## Core concepts and components
- **Application Load Balancer (ALB)** — **L7** for HTTP/HTTPS. **Listeners** hold **rules** that route
  by host, path, header, method, query, or source IP to **target groups**; supports redirects/fixed
  responses, OIDC/Cognito **authentication**, sticky sessions, and **WAF**.
- **Network Load Balancer (NLB)** — **L4** for TCP/UDP/TLS; ultra-low latency, **static IP per AZ**
  (or EIP), preserves **source IP**, scales to millions of flows, and is the backing for PrivateLink
  endpoint services.
- **Gateway Load Balancer (GWLB)** — **L3** transparent insertion of third-party virtual appliances
  (firewalls/IDS) via **GENEVE** on port 6081; paired with GWLB endpoints.
- **Classic Load Balancer (CLB)** — legacy L4/L7; prefer ALB/NLB for new work.
- **Target groups** — group targets of type **instance**, **IP**, or **Lambda**; own the **health
  check** (protocol/path/port/thresholds) and protocol/port; one TG can back multiple LBs.
- **Listeners + TLS** — terminate HTTPS/TLS with **ACM** certs (SNI for multiple certs), pick security
  policies; ALB can also do end-to-end TLS to targets.
- **Cross-zone load balancing**, **stickiness**, **deregistration delay (connection draining)**, and
  **access logs** to S3.

## Configuration and sizing
- Pick **ALB** for HTTP content routing/auth, **NLB** for raw TCP/UDP, static IPs, or PrivateLink,
  **GWLB** for inline appliances. Deploy across ≥2 AZs in matching subnets. ELB scales automatically
  but a sudden spike needs pre-warming via gradual ramp. Tune health-check thresholds and
  deregistration delay to balance fast failover vs flapping. Enable cross-zone for even distribution
  (free on ALB; data-charged on NLB).

## Security and IAM
- Front ALBs with **WAF**, terminate TLS with ACM (modern security policy), and restrict the LB
  security group to expected ports/sources; lock target SGs to accept only from the LB SG. NLB
  preserves client IP — size target SGs accordingly. Enable **access logs**. Gate
  `elasticloadbalancing:*` with least-privilege IAM; enable CloudTrail.

## Cost levers
- Charged per LB-hour + **LCU/NLCU** capacity units (connections, new connections, bandwidth, rule
  evaluations). Consolidate apps behind one ALB with host/path rules, prune idle LBs, and account for
  NLB cross-zone data charges. Access logs add S3 cost.

## Scaling and limits
- Watch targets-per-target-group, rules-per-ALB-listener, certificates-per-listener, and target-groups
  limits. NLB needs a dedicated subnet IP per AZ; ALB consumes several IPs per subnet for scaling.

## Operating procedure
1. **Provision** — create the LB, target group(s), and listener(s) via Terraform `aws_lb` /
   `aws_lb_target_group` / `aws_lb_listener` (+ `aws_lb_listener_rule`) or
   `aws elbv2 create-load-balancer` / `create-target-group` / `create-listener`.
2. **Configure** — listener rules (host/path), TLS cert + policy, health checks, stickiness,
   cross-zone, deregistration delay, target registration; attach WAF to ALBs.
3. **Secure** — LB SG scoped to expected ports, target SG accepts only the LB SG, WAF + access logs,
   modern TLS policy.
4. **Verify** — apply [[verify-by-running]]: `describe-target-health` shows targets `healthy`; a
   request hits the LB and is routed by the expected rule to a target; failing one target shifts
   traffic to others (and across AZs); TLS terminates with the expected cert — capture the actual
   output.

## Inputs
Protocol/layer (HTTP vs TCP/UDP vs appliance), routing rules (host/path), AZs/subnets, target type
(instance/IP/Lambda), TLS cert (ACM) + policy, health-check spec, stickiness/draining, WAF needs.

## Output
An ELB definition (LB type, listeners + rules, target groups + health checks, TLS, stickiness/cross-
zone, WAF/access logs), plus verification of healthy distribution, content routing, and failover.

## Notes
- Gotchas: a target group's health check must match what the app actually serves (wrong path/port =
  all-unhealthy = 503); ALB needs ≥2 AZ subnets; NLB cross-zone is off by default and data-charged;
  NLB preserves client IP so target SGs must allow client CIDRs (not the LB); deregistration delay
  holds connections open during scale-in; SNI is required for multiple certs on one listener.
- IaC/CLI: Terraform `aws_lb`, `aws_lb_target_group`, `aws_lb_listener`, `aws_lb_listener_rule`,
  `aws_lb_target_group_attachment`, `aws_lb_listener_certificate`. CLI
  `aws elbv2 create-load-balancer`, `create-target-group`, `create-listener`, `create-rule`,
  `register-targets`, `describe-target-health`. CloudFormation
  `AWS::ElasticLoadBalancingV2::LoadBalancer`, `AWS::ElasticLoadBalancingV2::TargetGroup`,
  `AWS::ElasticLoadBalancingV2::Listener`, `AWS::ElasticLoadBalancingV2::ListenerRule`.
