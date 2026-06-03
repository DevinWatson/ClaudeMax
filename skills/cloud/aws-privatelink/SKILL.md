---
name: aws-privatelink
description: Use when designing, provisioning, securing, or operating AWS PrivateLink — private connectivity from a VPC to AWS services, partner SaaS, or your own services without the internet (AWS PrivateLink). Loads the PrivateLink knowledge: interface VPC endpoints (ENIs with private IPs + private DNS) vs gateway endpoints (S3/DynamoDB, route-table based, free), VPC endpoint services backed by a Network Load Balancer with allow-listed principals and acceptance, the consumer/provider model across accounts, endpoint policies, private-DNS names and domain verification, and why PrivateLink avoids the overlapping-CIDR and transitive-routing limits of peering/TGW. Covers how to consume a service privately, publish your own service, scope access by principal/policy, and verify private resolution and reachability. Consumed by the AWS PrivateLink specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology — this owns the PrivateLink service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, privatelink, networking, vpc-endpoints, endpoint-service, nlb]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS PrivateLink

**Private, unidirectional** connectivity from a consumer VPC to a service — an AWS service, a partner
SaaS offering, or another team's service — over the AWS network, exposed as an **ENI with a private
IP** inside the consumer's subnets. No internet gateway, NAT, VPC peering, or VPN required, and no
CIDR-overlap concerns.

## Core concepts and components
- **Interface VPC endpoint** — an ENI (with a private IP per AZ) in the consumer VPC that fronts the
  target service; reached via the service's **private DNS name**. Powered by PrivateLink.
- **Gateway endpoint** — a route-table target for **S3 and DynamoDB only**; free, no ENI. (Not
  PrivateLink, but the sibling private-access mechanism.)
- **VPC endpoint service (provider side)** — you publish a service behind a **Network Load Balancer**
  (or GWLB), register it as an endpoint service, and **allow-list consumer principals**; new
  connections are auto-accepted or require manual **acceptance**.
- **Consumer/provider model** — works across accounts and VPCs; the connection is one-directional
  (consumer → provider). Each side keeps its own private IP space.
- **Endpoint policy** — an IAM resource policy on the interface endpoint restricting which API
  actions/resources are reachable (e.g. only one S3 bucket).
- **Private DNS** — enabling it overrides the public service DNS so existing clients transparently use
  the endpoint; for custom services you verify domain ownership.

## Configuration and sizing
- Place an interface endpoint ENI in each AZ you serve (charged per-AZ-hour). Enable **private DNS**
  for AWS services so SDKs need no change. For your own service, front it with an NLB across AZs and
  set connection acceptance + allow-listed principals. Scale is governed by the NLB on the provider
  side.

## Security and IAM
- Attach a tight **endpoint policy** (default is allow-all — restrict to needed actions/resources).
  On the provider side, allow-list only specific account/role ARNs and prefer manual acceptance for
  sensitive services. Endpoint security groups gate which clients can reach the ENI. PrivateLink
  keeps traffic off the internet entirely. Gate `ec2:*VpcEndpoint*` /
  `ec2:*VpcEndpointServiceConfiguration*` with least-privilege IAM; enable CloudTrail.

## Cost levers
- Interface endpoints are charged per-AZ-hour + per-GB processed; gateway endpoints (S3/DynamoDB) are
  free and avoid NAT data charges. Consolidate endpoints, remove unused AZ placements, and prefer
  gateway endpoints for S3/DynamoDB to cut both endpoint and NAT costs.

## Scaling and limits
- Watch endpoints-per-VPC, principals-per-endpoint-service, and per-AZ ENI limits. PrivateLink is
  unidirectional and avoids the transitive-routing/CIDR-overlap limits of peering and TGW, but does
  not provide bidirectional network reachability.

## Operating procedure
1. **Provision** — create the interface endpoint (consumer) via Terraform `aws_vpc_endpoint`
   (`vpc_endpoint_type = "Interface"`) or `aws ec2 create-vpc-endpoint`; on the provider side create
   an NLB + `aws_vpc_endpoint_service`.
2. **Configure** — select subnets/AZs and security groups, enable private DNS, attach the endpoint
   policy; provider: allow-listed principals, acceptance behavior, private-DNS domain verification.
3. **Secure** — least-privilege endpoint policy, allow-listed principals + manual acceptance for
   sensitive services, endpoint SGs.
4. **Verify** — apply [[verify-by-running]]: `describe-vpc-endpoints` shows state `available`; the
   service's private DNS name resolves to the endpoint's private IPs inside the VPC; a client reaches
   the service privately while public egress is unnecessary; the provider sees the connection
   accepted from the allowed principal — capture the actual output.

## Inputs
Target service (AWS / SaaS / own), AZs to serve, private-DNS requirement, endpoint-policy scope; for
a published service: the NLB, allow-listed principals, acceptance behavior, custom DNS domain.

## Output
A PrivateLink definition (interface/gateway endpoint with SGs, subnets, private DNS, endpoint policy)
and/or an endpoint service (NLB, allow-list, acceptance), plus verification of private resolution and
reachability.

## Notes
- Gotchas: enabling private DNS overrides the public name VPC-wide — verify clients expect that;
  endpoint policy defaults to allow-all (tighten it); gateway endpoints work only for S3/DynamoDB and
  are route-table based, not ENIs; the connection is unidirectional (provider can't initiate to
  consumer); each in-use AZ ENI is billed; the provider NLB's target health gates reachability.
- IaC/CLI: Terraform `aws_vpc_endpoint`, `aws_vpc_endpoint_service`,
  `aws_vpc_endpoint_connection_accepter`, `aws_vpc_endpoint_service_allowed_principal`,
  `aws_vpc_endpoint_policy`. CLI `aws ec2 create-vpc-endpoint`,
  `create-vpc-endpoint-service-configuration`, `modify-vpc-endpoint-service-permissions`,
  `describe-vpc-endpoints`, `accept-vpc-endpoint-connections`. CloudFormation
  `AWS::EC2::VPCEndpoint`, `AWS::EC2::VPCEndpointService`, `AWS::EC2::VPCEndpointServicePermissions`.
