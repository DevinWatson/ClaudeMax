---
name: aws-wavelength
description: Use when designing, provisioning, securing, or operating AWS Wavelength — Wavelength Zones embedded in telco 5G networks, carrier gateways, VPC extension to the edge, ultra-low-latency mobile/edge workloads, and the subset of services (EC2/EBS/ECS/EKS) available at the edge (AWS Wavelength). Loads the Wavelength knowledge: how to opt into a Zone, extend a VPC with Wavelength subnets, route through the carrier gateway, and verify edge instances and mobile reachability. Consumed by the Wavelength specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they design 5G edge.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, wavelength, 5g, edge, low-latency, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Wavelength

AWS compute and storage deployed inside telecom carriers' 5G networks (Wavelength Zones) so that
mobile/edge traffic reaches your app without leaving the carrier network — single-digit-ms
latency. Use it for AR/VR, real-time gaming, live video, connected vehicles, and ML inference at
the mobile edge; reach for Outposts/Local Zones when you do not need the carrier-network path.

## Core concepts and components
- **Wavelength Zone** — an AWS compute pool embedded in a carrier's data center, homed to a
  parent Region; you must opt the account into the Zone before use.
- **Carrier gateway (CAGW)** — routes traffic between Wavelength subnets and the carrier's mobile
  network (and outbound internet via the carrier), the edge analog of an IGW.
- **Wavelength subnets** — VPC subnets in the Zone; the VPC spans the Region and the edge.
- **Carrier IP** — an address from the carrier network range assigned for mobile reachability.
- **Supported services** — EC2, EBS, ECS, EKS, plus VPC features; a limited subset vs the Region.

## Configuration and sizing
- Limited instance-type selection per Zone — design for the available families; keep latency-
  critical components at the edge and everything else in the Region.
- Architect a Region "anchor" tier; the edge should hold only the latency-sensitive workload.

## Security and IAM
- Same IAM/KMS as the Region. Lock security groups; the carrier gateway changes the exposure
  model — traffic arrives from the mobile network, so scope ingress to carrier ranges.
- Encrypt EBS; treat carrier-IP-exposed instances like internet-facing hosts.

## Cost levers
- EC2/EBS in a Zone is priced at a premium over the Region — keep only latency-critical compute
  at the edge, autoscale it down off-peak, and offload bulk/batch to the Region.

## Scaling and limits
- Fewer instance types and lower capacity than a Region; not all services exist at the edge. One
  Zone serves one metro/carrier footprint — multi-metro coverage needs multiple Zones.

## Operating procedure
1. **Provision** — opt into the Wavelength Zone, create Wavelength subnets and a carrier gateway,
   and launch EC2/EKS into the Zone via Terraform `aws_subnet` (Zone) + `aws_ec2_carrier_gateway`
   or `aws ec2 create-carrier-gateway`.
2. **Configure** — add carrier-gateway routes, assign carrier IPs to edge instances, and wire the
   Region anchor tier.
3. **Secure** — IAM/KMS as in-Region, SGs scoped to carrier ranges, encrypted EBS.
4. **Verify** — apply [[verify-by-running]]: launch a test instance into the Zone subnet, confirm
   it is `running` with a carrier IP via `aws ec2 describe-instances`, confirm the carrier-gateway
   route exists, and validate reachability from a device on the carrier's 5G network.

## Inputs
Latency target and metro/carrier coverage, which components must run at the edge vs Region,
mobile traffic profile, available instance types in the target Zone, anchor-tier design.

## Output
A Wavelength subnet + carrier-gateway design, edge vs Region component split, carrier-IP
assignment plan, and verification of a running edge instance and carrier-network reachability.

## Notes
- Gotchas: must opt into the Zone first; carrier gateway (not IGW) handles edge ingress/egress;
  limited instance types and services; carrier IPs come from the carrier's pool; latency benefit
  only applies to traffic originating on that carrier's 5G network.
- IaC/CLI: Terraform `aws_ec2_carrier_gateway`, `aws_subnet` (with the Wavelength Zone id),
  `aws_route` (to the CAGW), `aws_instance`. CLI `aws ec2 create-carrier-gateway`,
  `describe-carrier-gateways`, `modify-availability-zone-group` (opt-in), `describe-instances`.
  CloudFormation `AWS::EC2::CarrierGateway`.
