---
name: aws-vpc
description: Use when designing, provisioning, securing, or operating an Amazon VPC — the foundational private virtual network in which AWS resources run. Loads the VPC knowledge: CIDR planning, public/private/isolated subnets across AZs, route tables, Internet Gateway and egress-only IGW, NAT gateways, security groups (stateful) vs network ACLs (stateless), VPC peering and Transit Gateway, gateway and interface VPC endpoints (PrivateLink), DNS (resolver, private hosted zones), and flow logs. Covers how to lay out CIDRs and subnets, route public and private traffic, scope SGs/NACLs least-privilege, reach AWS APIs privately via endpoints, and verify reachability. Consumed by the VPC specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology via network-design — this owns the VPC service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, vpc, networking, subnets, security-groups, routing, endpoints]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon VPC

The foundational **private virtual network** that isolates your AWS resources at the IP layer. A
VPC is a CIDR block subdivided into subnets across Availability Zones, with routing, gateways, and
firewalls controlling how traffic flows in, out, and within. Almost every other AWS network service
(load balancers, RDS, EKS, endpoints) lives inside a VPC.

## Core concepts and components
- **CIDR + subnets** — the VPC owns an IPv4 (and optional IPv6) CIDR; **subnets** carve it per AZ.
  A subnet is **public** if its route table points `0.0.0.0/0` at an Internet Gateway, **private**
  if it routes egress via a NAT, **isolated** if it has no internet route.
- **Route tables** — per-subnet rules mapping destination CIDRs to targets (IGW, NAT, peering, TGW,
  endpoint). **Internet Gateway (IGW)** gives public bidirectional v4; **egress-only IGW** gives
  outbound-only IPv6.
- **NAT gateway** — managed outbound internet for private subnets (one per AZ for HA; charged
  hourly + per-GB).
- **Security groups** — **stateful**, attached to ENIs, allow-only, can reference other SGs.
  **Network ACLs** — **stateless**, subnet-level, allow + deny, evaluated in rule order.
- **Peering / Transit Gateway** — VPC-to-VPC (non-transitive) vs hub-and-spoke transitive routing.
- **VPC endpoints** — **gateway** endpoints (S3, DynamoDB; free, route-table based) and **interface**
  endpoints (PrivateLink ENIs) to reach AWS/3rd-party APIs without traversing the internet.
- **Flow logs** — capture accepted/rejected traffic metadata to CloudWatch/S3.

## Configuration and sizing
- Plan a non-overlapping CIDR (room for growth + future peering/TGW); reserve space for subnets in
  every AZ you use. Right-size subnets (AWS reserves 5 IPs per subnet). Use one NAT per AZ for
  production HA. Prefer SG-to-SG references over CIDR allow-lists.

## Security and IAM
- Default-deny posture: tight SGs (no `0.0.0.0/0` to admin ports), NACLs as a coarse backstop. Place
  data stores in **isolated/private** subnets. Use **interface/gateway endpoints** to keep AWS-API
  traffic off the internet. Enable **flow logs**. Gate `ec2:*Vpc*`/`ec2:*Subnet*`/`ec2:*SecurityGroup*`
  with least-privilege IAM; enable CloudTrail.

## Cost levers
- NAT gateways cost per hour + per GB — consolidate egress, use gateway endpoints for S3/DynamoDB to
  avoid NAT data charges, and consider a single shared egress for non-prod. Interface endpoints cost
  per hour per AZ. Cross-AZ and inter-VPC traffic incurs data charges.

## Scaling and limits
- Watch per-VPC limits (subnets, route-table entries, SGs per ENI, rules per SG, NACL rules) and IP
  exhaustion (size CIDRs generously or add secondary CIDRs). Peering is non-transitive — use Transit
  Gateway for many-VPC topologies.

## Operating procedure
1. **Provision** — create the VPC CIDR, subnets per AZ, IGW, and NAT via Terraform `aws_vpc` /
   `aws_subnet` / `aws_internet_gateway` / `aws_nat_gateway` or `aws ec2 create-vpc` / `create-subnet`.
2. **Configure** — route tables per subnet tier, gateway/interface endpoints, DNS settings,
   peering/TGW attachments, flow logs.
3. **Secure** — least-privilege SGs (SG references), NACL backstop, private placement for data,
   endpoints over public paths, flow logs + CloudTrail.
4. **Verify** — apply [[verify-by-running]]: `describe-subnets`/`describe-route-tables` confirm the
   tiering and routes; an instance in a private subnet reaches the internet via NAT and AWS APIs via
   the endpoint; a public-subnet host is reachable and a private store is NOT publicly reachable; SG
   reasoning and flow logs confirm the intended path.

## Inputs
CIDR plan + growth/peering needs, AZ count, subnet tiering (public/private/isolated), egress model
(NAT count), required AWS-API endpoints, peering/TGW topology, DNS requirements, logging.

## Output
A VPC definition (CIDR, subnets per AZ, IGW/NAT, route tables), SG/NACL rules, VPC endpoints, DNS
config, flow logs, and verification of the public/private/isolated reachability paths.

## Notes
- Gotchas: CIDRs can't be shrunk and overlapping CIDRs break peering/TGW — plan up front; SGs are
  stateful but NACLs are stateless (need explicit return rules incl. ephemeral ports); peering is
  non-transitive; deleting a NAT drops private egress; gateway endpoints work only for S3/DynamoDB;
  the 5 reserved IPs per subnet; default SG allows all intra-SG traffic.
- IaC/CLI: Terraform `aws_vpc`, `aws_subnet`, `aws_route_table`(+assoc), `aws_internet_gateway`,
  `aws_nat_gateway`, `aws_security_group`, `aws_network_acl`, `aws_vpc_endpoint`,
  `aws_vpc_peering_connection`, `aws_flow_log`. CLI `aws ec2 create-vpc`, `create-subnet`,
  `create-route`, `create-nat-gateway`, `create-vpc-endpoint`, `authorize-security-group-ingress`.
  CloudFormation `AWS::EC2::VPC`, `AWS::EC2::Subnet`, `AWS::EC2::RouteTable`,
  `AWS::EC2::SecurityGroup`, `AWS::EC2::VPCEndpoint`.
