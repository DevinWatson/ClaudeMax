---
name: aws-transit-gateway
description: Use when designing, provisioning, securing, or operating AWS Transit Gateway — the regional hub-and-spoke router that interconnects many VPCs, VPNs, and on-prem links (AWS Transit Gateway). Loads the TGW knowledge: attachments (VPC, VPN, Direct Connect gateway, peering, Connect/GRE), TGW route tables and association vs propagation, blackhole routes, ECMP, appliance-mode for stateful inspection, inter-region peering, multicast, RAM sharing across accounts, and segmentation via multiple route tables (isolated vs shared domains). Covers how to replace a mesh of VPC peerings with a hub, isolate environments with route-table segmentation, route on-prem via VPN/DX, peer regions, and verify routes propagate and traffic flows. Consumed by the AWS Transit Gateway specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology — this owns the Transit Gateway service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, transit-gateway, networking, hub-and-spoke, routing, segmentation]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Transit Gateway

A **regional network hub** that connects VPCs, VPN connections, Direct Connect gateways, and other
Transit Gateways through a single router, replacing a brittle full mesh of VPC peerings with
**hub-and-spoke** transitive routing.

## Core concepts and components
- **Attachments** — what connects to the TGW: **VPC** (one or more subnets per AZ host the ENIs),
  **VPN**, **Direct Connect gateway**, **TGW peering** (intra/inter-region), and **Connect** (GRE +
  BGP to SD-WAN appliances).
- **TGW route tables** — control reachability. An attachment is **associated** with exactly one route
  table (which it consults for egress) and can **propagate** its routes (CIDRs/BGP) into one or more
  route tables. Association + propagation together define segmentation.
- **Segmentation** — use multiple route tables to build **isolated** domains (e.g. prod vs non-prod)
  and **shared-services** domains (everyone routes to a central inspection/services VPC).
- **Blackhole routes** — explicitly drop traffic to a CIDR.
- **ECMP** — load-spread across multiple equal-cost VPN/DX paths.
- **Appliance mode** — pins a flow's bidirectional traffic to the same AZ ENI so stateful firewalls
  in a centralized inspection VPC see both directions.
- **Inter-region peering** — encrypted TGW-to-TGW across regions. **RAM** shares a TGW across accounts.

## Configuration and sizing
- Give each VPC attachment a small dedicated subnet per AZ (TGW ENIs). Per-VPC bandwidth to a TGW is
  up to ~100 Gbps (burst). Plan route tables up front for the segmentation model; default route-table
  association/propagation can be disabled so attachments are placed deliberately. Use appliance-mode
  on inspection-VPC attachments to avoid asymmetric routing.

## Security and IAM
- Segment with route tables so spokes can't reach each other unless intended; route through a central
  inspection VPC (with Network Firewall / GWLB) for east-west filtering. Share via **RAM** with
  specific accounts/OUs, not broadly. Gate `ec2:*TransitGateway*` with least-privilege IAM; enable
  CloudTrail and TGW Flow Logs.

## Cost levers
- Charged per attachment-hour + per-GB data processed (and inter-region peering data). Consolidate
  attachments, avoid hairpinning through inspection when not required, and keep chatty workloads in
  the same region/VPC. Inter-region and cross-AZ traffic add data charges.

## Scaling and limits
- Watch attachments-per-TGW, routes-per-route-table, and bandwidth-per-attachment limits. TGW is
  transitive (unlike VPC peering) — but TGW **peering** is NOT transitive across three TGWs.

## Operating procedure
1. **Provision** — create the TGW and attachments via Terraform `aws_ec2_transit_gateway` /
   `aws_ec2_transit_gateway_vpc_attachment` or `aws ec2 create-transit-gateway` /
   `create-transit-gateway-vpc-attachment`.
2. **Configure** — build route tables, set associations + propagations per the segmentation model,
   add static/blackhole routes, enable appliance-mode for inspection attachments, set up peering/RAM.
3. **Secure** — route-table isolation, central inspection for east-west, RAM scoped to specific
   accounts, flow logs.
4. **Verify** — apply [[verify-by-running]]: `search-transit-gateway-routes` shows the expected
   active routes in each route table; spoke VPCs reach shared services but isolated spokes can NOT
   reach each other; on-prem CIDRs are propagated from the VPN/DX attachment; inspection sees both
   directions of a flow — capture the actual output.

## Inputs
List of VPCs/VPNs/DX to connect, segmentation model (isolated vs shared domains), on-prem CIDRs,
inspection requirement, multi-account (RAM) scope, inter-region needs.

## Output
A TGW definition (attachments, route tables with associations/propagations, blackhole/static routes,
appliance-mode, peering/RAM), plus verification that routes propagate and the segmentation holds.

## Notes
- Gotchas: default route-table association/propagation can silently make everything reachable —
  disable and place attachments deliberately; TGW peering is non-transitive; appliance-mode is
  required for symmetric flows through a stateful inspection VPC; each VPC attachment needs a subnet
  per AZ you want reachable; route propagation from VPN requires BGP.
- IaC/CLI: Terraform `aws_ec2_transit_gateway`, `aws_ec2_transit_gateway_vpc_attachment`,
  `aws_ec2_transit_gateway_route_table`, `aws_ec2_transit_gateway_route`,
  `aws_ec2_transit_gateway_route_table_association`, `aws_ec2_transit_gateway_route_table_propagation`,
  `aws_ec2_transit_gateway_peering_attachment`. CLI `aws ec2 create-transit-gateway`,
  `create-transit-gateway-vpc-attachment`, `create-transit-gateway-route`,
  `search-transit-gateway-routes`. CloudFormation `AWS::EC2::TransitGateway`,
  `AWS::EC2::TransitGatewayAttachment`, `AWS::EC2::TransitGatewayRouteTable`,
  `AWS::EC2::TransitGatewayRoute`.
