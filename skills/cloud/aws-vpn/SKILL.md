---
name: aws-vpn
description: Use when designing, provisioning, securing, or operating AWS VPN — encrypted IPsec connectivity into a VPC (AWS VPN). Loads the VPN knowledge: Site-to-Site VPN (customer gateways, virtual private gateways vs Transit Gateway attachments, IPsec tunnels with two endpoints per connection for HA, static vs BGP/dynamic routing, IKEv1/IKEv2, tunnel options and phase-1/phase-2 parameters), AWS Client VPN (managed OpenVPN endpoints, mutual TLS / SAML / AD auth, authorization rules, route tables, split vs full tunnel), accelerated VPN over Global Accelerator, DPD/dead-peer detection, and CloudWatch tunnel metrics. Covers how to terminate on-prem links, achieve tunnel HA, route via BGP, scope authorization, and verify tunnels are UP and routes propagate. Consumed by the AWS VPN specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology — this owns the VPN service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, vpn, networking, ipsec, site-to-site, client-vpn]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS VPN

Managed **encrypted connectivity** between on-premises networks (or remote users) and an Amazon VPC
over IPsec. Two products: **Site-to-Site VPN** (network-to-network IPsec) and **Client VPN** (managed
remote-access OpenVPN for individual users/devices).

## Core concepts and components
- **Customer Gateway (CGW)** — a resource describing the on-prem device (public IP/cert, ASN for BGP).
- **Termination on AWS** — a **Virtual Private Gateway (VGW)** attached to a single VPC, or a
  **Transit Gateway** attachment for many-VPC fan-out. TGW is preferred for scale.
- **Site-to-Site VPN connection** — provides **two IPsec tunnels** to two distinct AWS endpoints (in
  different AZs) for HA; the CGW should bring up both. Each tunnel runs IKE (v1/v2) phase-1 + phase-2.
- **Routing** — **static** (you declare remote CIDRs) or **dynamic via BGP** (routes exchanged over
  the tunnel; required for some failover designs and for TGW route propagation).
- **Client VPN** — a managed endpoint terminating OpenVPN; **mutual TLS (cert)**, **SAML/Federated**,
  or **Active Directory** auth; **authorization rules** grant access to CIDRs per group; **route
  table** entries direct traffic; **split-tunnel** sends only VPC-bound traffic over the tunnel.
- **Accelerated VPN** — routes Site-to-Site tunnels over AWS Global Accelerator anycast for lower
  jitter (TGW only).
- **Health** — DPD (dead peer detection), CloudWatch `TunnelState`/`TunnelDataIn/Out` metrics.

## Configuration and sizing
- Aggregate Site-to-Site throughput is ~1.25 Gbps per tunnel; use ECMP over multiple connections on a
  TGW for more. Pin IKE/IPsec parameters (DH groups, ciphers, lifetimes) to match the CGW. Set both
  tunnel inside-CIDRs and pre-shared keys (or certificates). For Client VPN, size the client CIDR
  block well clear of VPC/on-prem CIDRs and enable split-tunnel to limit data charges.

## Security and IAM
- Prefer **IKEv2** with strong DH groups (≥14) and AES-GCM; rotate pre-shared keys or use certs.
  Scope Client VPN with **authorization rules** per AD group / SAML attribute, not blanket access;
  enable connection logging to CloudWatch. Gate `ec2:*Vpn*` / `ec2:*CustomerGateway*` /
  `ec2:*ClientVpn*` with least-privilege IAM; enable CloudTrail.

## Cost levers
- Site-to-Site VPN is charged per connection-hour + data out; Client VPN per associated-subnet-hour +
  per active-connection-hour. Use split-tunnel to avoid routing internet traffic through the VPC,
  deassociate idle Client VPN subnets, and consolidate links onto a TGW rather than many VGWs.

## Scaling and limits
- One VGW attaches to exactly one VPC; use **Transit Gateway** for many VPCs and ECMP scaling. Watch
  routes-per-VGW, Client VPN concurrent connections, and tunnel throughput ceilings.

## Operating procedure
1. **Provision** — create the CGW, the VGW or TGW attachment, and the Site-to-Site VPN connection (or
   the Client VPN endpoint) via Terraform `aws_customer_gateway` / `aws_vpn_gateway` /
   `aws_vpn_connection` / `aws_ec2_client_vpn_endpoint` or `aws ec2 create-customer-gateway` /
   `create-vpn-connection`.
2. **Configure** — IKE/IPsec tunnel options, static routes or BGP, route propagation to subnet route
   tables / TGW route tables; for Client VPN add authorization rules, routes, and network associations.
3. **Secure** — IKEv2 + strong ciphers, key/cert rotation, least-privilege Client VPN authorization,
   connection logging.
4. **Verify** — apply [[verify-by-running]]: `describe-vpn-connections` shows both tunnels `UP`;
   `describe-route-tables` / TGW route tables show the remote CIDRs propagated; an on-prem host
   reaches a private VPC instance and back; for Client VPN a connected client resolves and reaches
   only its authorized CIDRs — capture the actual output.

## Inputs
On-prem device public IP + ASN, remote CIDRs, HA requirement, static vs BGP, VGW-vs-TGW termination,
IKE/IPsec parameter constraints; for Client VPN: auth method (cert/SAML/AD), client CIDR, target
subnets, per-group authorization, split vs full tunnel.

## Output
A VPN definition (CGW, VGW/TGW attachment, connection + both tunnels, routing/BGP) or a Client VPN
endpoint (auth, authorization rules, routes, associations), plus verification that tunnels are UP and
routes propagate.

## Notes
- Gotchas: a Site-to-Site connection has TWO tunnels — both must be configured on the CGW for HA;
  static routing won't fail over automatically (use BGP); inside tunnel CIDRs must not overlap;
  re-creating a connection rotates the AWS-side public IPs and PSKs; Client VPN client CIDR must not
  overlap VPC/on-prem and at least one subnet association is required for the endpoint to come up.
- IaC/CLI: Terraform `aws_customer_gateway`, `aws_vpn_gateway`, `aws_vpn_gateway_attachment`,
  `aws_vpn_connection`, `aws_vpn_connection_route`, `aws_ec2_client_vpn_endpoint`,
  `aws_ec2_client_vpn_network_association`, `aws_ec2_client_vpn_authorization_rule`,
  `aws_ec2_client_vpn_route`. CLI `aws ec2 create-customer-gateway`, `create-vpn-connection`,
  `create-client-vpn-endpoint`, `describe-vpn-connections`. CloudFormation
  `AWS::EC2::VPNConnection`, `AWS::EC2::CustomerGateway`, `AWS::EC2::VPNGateway`,
  `AWS::EC2::ClientVpnEndpoint`.
