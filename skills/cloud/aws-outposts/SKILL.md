---
name: aws-outposts
description: Use when designing, provisioning, securing, or operating AWS Outposts — Outpost racks and servers, capacity (instance/EBS) planning, local gateway and VPC extension, service link to the parent Region, supported on-prem services (EC2/EBS/ECS/EKS/RDS/S3 on Outposts), and data-residency/low-latency workloads (AWS Outposts). Loads the Outposts knowledge: how to size an Outpost order, extend a VPC on-prem, wire the local gateway and service link, and verify capacity and connectivity. Consumed by the Outposts specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they design hybrid on-prem AWS.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, outposts, hybrid, on-premises, data-residency, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Outposts

Fully managed AWS infrastructure (racks or 1U/2U servers) installed in your own data center or
colo, running a subset of AWS services on-prem with the same APIs as the Region. Use it for
low-latency-to-local-systems, data-residency, or local-processing needs that cannot move to a
Region; reach for Local Zones/Wavelength when you want AWS-owned edge rather than your own site.

## Core concepts and components
- **Outpost** — a capacity pool (rack or server) homed (anchored) to a parent AWS Region/AZ.
- **Capacity** — pre-purchased fixed instance/EBS capacity; you choose an instance-type layout
  (configurable via capacity tasks). No elastic scale-out beyond what you ordered.
- **Service link** — the (redundant) network connection from the Outpost back to its parent
  Region for control-plane and some data-plane traffic.
- **Local gateway (LGW)** — routes traffic between Outpost subnets and your on-prem network.
- **Outpost subnets** — VPC subnets that live on the Outpost; the VPC spans Region + Outpost.
- **Supported services** — EC2, EBS, ECS, EKS, S3 on Outposts, RDS on Outposts, ELB, EMR, etc.

## Configuration and sizing
- Size capacity from steady demand plus headroom — you cannot burst past the order. Plan the
  instance-family mix up front; use capacity tasks to re-slice.
- Provision power, space, cooling, and redundant network to AWS spec before install.

## Security and IAM
- Same IAM/KMS model as the Region; data at rest on the Outpost is encrypted and the Nitro
  Security Key tying it to the Region means pulling a server renders data inaccessible.
- Secure the service link path and local gateway routing; treat the on-prem network edge as
  part of your trust boundary.

## Cost levers
- Billed as an up-front + monthly commitment for the ordered capacity regardless of usage —
  right-size the order; idle Outpost capacity is pure waste. Region data transfer still applies.

## Scaling and limits
- Hard-capped at ordered capacity; growth = a new order/expansion (lead time). If the service
  link drops, the Region control plane is unreachable though local instances keep running.

## Operating procedure
1. **Provision** — order the Outpost (rack/server) and capacity, complete site readiness, let
   AWS install; then create Outpost subnets and the local gateway route table via Terraform
   `aws_ec2_local_gateway_route` / `aws ec2` + `aws outposts` CLI.
2. **Configure** — extend the VPC with Outpost subnets, attach the LGW route table, launch
   supported services pinned to the Outpost ARN.
3. **Secure** — IAM/KMS as in-Region, redundant service link, locked LGW routing.
4. **Verify** — apply [[verify-by-running]]: `aws outposts get-outpost-instance-types` and
   `list-assets` to confirm capacity, launch a test EC2 into an Outpost subnet and confirm it
   reaches `running`, and confirm on-prem reachability through the local gateway.

## Inputs
Workloads requiring local/low-latency or residency, capacity demand + family mix, site facility
specs, parent Region/AZ, on-prem network/routing, which AWS services are needed locally.

## Output
A capacity order/layout, VPC + Outpost subnet + local-gateway design, service placement plan,
and verification of available capacity, a running instance, and local-gateway connectivity.

## Notes
- Gotchas: capacity is finite and fixed; service-link loss isolates the control plane; not all
  Region services run on Outposts (check the supported list); S3 on Outposts uses access points
  (different API surface); facility/network prerequisites are strict and gate installation.
- IaC/CLI: Terraform `aws_subnet` (with `outpost_arn`), `aws_ec2_local_gateway_route_table_vpc_association`,
  `aws_ec2_local_gateway_route`, `aws_ebs_volume`/`aws_instance` pinned to the Outpost.
  CLI `aws outposts list-outposts`, `get-outpost`, `list-assets`, `get-outpost-instance-types`.
  CloudFormation has limited Outposts support — provision capacity via the console/CLI order flow.
