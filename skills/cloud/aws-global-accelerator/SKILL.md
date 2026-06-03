---
name: aws-global-accelerator
description: Use when designing, provisioning, securing, or operating AWS Global Accelerator — the edge service that fronts apps with static anycast IPs and routes users over the AWS backbone to the nearest healthy regional endpoint (AWS Global Accelerator). Loads the GA knowledge: standard vs custom-routing accelerators, two static anycast IPs (BYOIP), TCP/UDP listeners, endpoint groups per region with traffic dials and per-endpoint weights, endpoint types (ALB/NLB/EIP/EC2), client affinity, health checks and fast regional failover, and the difference from CloudFront (TCP/UDP + static IPs vs HTTP caching). Covers how to get stable entry IPs, multi-region active/active or failover, weighted traffic shifting, and verify routing and failover. Consumed by the AWS Global Accelerator specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology — this owns the Global Accelerator service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, global-accelerator, networking, anycast, edge, failover]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Global Accelerator

An **edge networking** service that gives an application two **static anycast IP addresses** announced
from AWS edge locations worldwide and steers client traffic onto the **AWS global backbone** to the
nearest healthy regional endpoint — improving latency, jitter, and failover for TCP/UDP workloads.

## Core concepts and components
- **Accelerator** — the top-level resource. **Standard** routes to the optimal regional endpoint;
  **custom-routing** maps deterministic port ranges to specific EC2 instances/ports (e.g. gaming
  sessions, VoIP).
- **Static anycast IPs** — two IPs from AWS-owned pools (or **BYOIP**) that never change for the life
  of the accelerator, so DNS and allow-lists stay stable.
- **Listeners** — TCP and/or UDP with port ranges; **client affinity** (none or source-IP) controls
  stickiness.
- **Endpoint groups** — one per AWS Region; each has a **traffic dial** (0–100% of traffic admitted to
  that region) for blue/green or staged shifts.
- **Endpoints** — ALB, NLB, Elastic IP, or EC2 within a group, each with a **weight** for in-region
  distribution. Health checks drive sub-minute regional failover.

## Configuration and sizing
- No capacity to size — it scales at the edge. Tune the **traffic dial** per region for active/active
  ratios or failover (set standby region to 0%), and **endpoint weights** for in-region splits. For
  ALB/NLB endpoints, GA leverages their health; for EIP/EC2 set GA health-check protocol/port/path.
  Use custom-routing when clients must reach a specific instance deterministically.

## Security and IAM
- Front ALB/NLB so security groups and WAF (on the ALB) still apply; GA preserves client IP to ALB.
  Use BYOIP for fixed allow-lists. Standard accelerators integrate with AWS Shield (DDoS at edge).
  Gate `globalaccelerator:*` with least-privilege IAM; enable CloudTrail and flow logs.

## Cost levers
- Charged a fixed hourly fee per accelerator + a **data-transfer-premium (DTP)** per GB that varies by
  source/destination region. Delete idle accelerators, and weigh GA's DTP vs CloudFront/Route 53
  latency routing for HTTP — GA is for TCP/UDP non-HTTP and static-IP needs, not HTTP caching.

## Scaling and limits
- Watch accelerators-per-account, listeners-per-accelerator, endpoint-groups-per-listener, and
  endpoints-per-group limits. Anycast scales automatically; regional capacity is bounded by the
  backing ALB/NLB/EC2.

## Operating procedure
1. **Provision** — create the accelerator and listeners via Terraform
   `aws_globalaccelerator_accelerator` / `aws_globalaccelerator_listener` or
   `aws globalaccelerator create-accelerator` / `create-listener`.
2. **Configure** — add an endpoint group per region with traffic dials, attach endpoints (ALB/NLB/EIP)
   with weights, set health-check params and client affinity.
3. **Secure** — keep SG/WAF on the ALB, use BYOIP for allow-lists, enable Shield + flow logs.
4. **Verify** — apply [[verify-by-running]]: `describe-accelerator` shows the two static IPs and
   `Enabled`; `list-endpoint-groups` shows endpoints `HEALTHY`; a client reaches the nearest region;
   setting a region's traffic dial to 0 (or failing its endpoint) shifts traffic to the other region
   — capture the actual output.

## Inputs
Protocol/ports, regions to serve, endpoint type (ALB/NLB/EIP/EC2), active/active vs failover ratios,
client-IP stickiness needs, BYOIP requirement, custom-routing (deterministic) need.

## Output
A Global Accelerator definition (two static IPs, listeners, endpoint groups with traffic dials,
weighted endpoints, health checks), plus verification of routing and regional failover.

## Notes
- Gotchas: the two static IPs are the stable contract — point DNS at them, not at regional endpoints;
  traffic dial is a percentage of admitted traffic, not a hard cap; standard GA does not cache or
  understand HTTP (use CloudFront for that); custom-routing requires VPC subnet endpoints and explicit
  port mappings; DTP pricing can be significant for high-volume cross-region flows.
- IaC/CLI: Terraform `aws_globalaccelerator_accelerator`, `aws_globalaccelerator_listener`,
  `aws_globalaccelerator_endpoint_group`, `aws_globalaccelerator_custom_routing_accelerator`. CLI
  `aws globalaccelerator create-accelerator`, `create-listener`, `create-endpoint-group`,
  `describe-accelerator`, `update-endpoint-group`. CloudFormation
  `AWS::GlobalAccelerator::Accelerator`, `AWS::GlobalAccelerator::Listener`,
  `AWS::GlobalAccelerator::EndpointGroup`.
