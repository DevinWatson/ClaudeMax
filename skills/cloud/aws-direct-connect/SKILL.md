---
name: aws-direct-connect
description: Use when designing, provisioning, securing, or operating AWS Direct Connect — the dedicated private network link between on-premises/colo and AWS that bypasses the public internet. Loads the Direct Connect knowledge: dedicated vs hosted connections, DX locations and the cross-connect/LOA-CFA, virtual interfaces (private VIF to a VGW/DX gateway, public VIF to AWS public services, transit VIF to a Transit Gateway), DX gateway for multi-VPC/Region, BGP peering and ASNs, Link Aggregation Groups (LAG), VLAN tagging, MACsec + IPsec-over-DX encryption, resilience models, and CloudWatch metrics. Covers how to order a connection, create VIFs and BGP, attach a DX gateway, encrypt, and verify the link and routes. Consumed by the Direct Connect specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology via network-design — this owns the Direct Connect service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, direct-connect, hybrid-networking, vif, bgp, lag, macsec]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Direct Connect

A **dedicated, private network connection** between your on-premises/colo data center and AWS that
bypasses the public internet for consistent bandwidth, lower/stable latency, and reduced egress
cost. Use it for high-throughput or latency-sensitive hybrid links; use Site-to-Site VPN (over the
internet) for cheaper/quicker or backup connectivity.

## Core concepts and components
- **Connection** — the physical link at a **Direct Connect location**: **dedicated** (1/10/100 Gbps,
  you own the port, requires a cross-connect + LOA-CFA from AWS to the colo) or **hosted** (a Direct
  Connect Partner subdivides their port; sub-1 Gbps options).
- **Virtual interfaces (VIFs)** — logical 802.1Q VLANs on the connection: **private VIF** → a VGW or
  Direct Connect gateway to reach VPC private IPs; **public VIF** → AWS public service endpoints
  (S3, etc.) over private transport; **transit VIF** → a **Transit Gateway** (via a DX gateway) for
  many-VPC/multi-Region.
- **Direct Connect gateway** — a global object that connects one or more VIFs to VGWs/TGWs across
  Regions and accounts.
- **BGP** — dynamic routing over each VIF; you exchange routes with AWS using public/private ASNs and
  optional BGP MD5 auth and route filtering/communities.
- **LAG** — Link Aggregation Group bundling multiple connections at one location for higher
  aggregate bandwidth and link redundancy.
- **Encryption** — DX is private but **not encrypted by default**; use **MACsec** (on supported
  dedicated 10/100 Gbps ports) or run **IPsec/VPN over the DX public VIF** for confidentiality.

## Configuration and sizing
- Size the port (or hosted capacity) to peak throughput with headroom. Choose a **resilience model**:
  single (dev), **high** (two connections at two locations), or **maximum** (two locations, two
  devices each). Use a **LAG** to grow bandwidth or add link-level redundancy at one location. Plan
  VLAN IDs and BGP ASNs up front.

## Security and IAM
- DX traffic is private but **unencrypted** unless you add **MACsec** or IPsec-over-DX — add
  encryption for sensitive data. Use **BGP MD5** auth and tight route filtering; advertise only
  required prefixes. Scope `directconnect:*` IAM least-privilege; use resource sharing (RAM) for
  multi-account DX gateways carefully. Enable CloudWatch metrics/alarms on link state and BGP.

## Cost levers
- Priced on **port-hours** (by capacity/type) + **DX data-transfer-out** (cheaper than internet
  egress). Right-size the port, consolidate via a DX gateway/TGW rather than many connections, and
  route high-volume egress over DX to cut internet egress charges. Hosted connections suit lower
  bandwidth at lower cost; balance resilience cost against the SLA you need.

## Scaling and limits
- Grow bandwidth with higher-capacity ports or a LAG; reach many VPCs/Regions via a DX gateway +
  Transit Gateway. Watch limits on VIFs per connection, prefixes advertised per VIF/BGP session,
  connections per LAG, and the fact that provisioning a dedicated connection involves physical
  cross-connect lead time (days/weeks).

## Operating procedure
1. **Provision** — request a dedicated connection (`aws directconnect create-connection`, Terraform
   `aws_dx_connection`) or accept a hosted connection from a partner; complete the cross-connect with
   the LOA-CFA; optionally create a **LAG**.
2. **Configure** — create the VIF(s) (private/public/transit) with VLAN + BGP ASN/auth via
   `aws_dx_private_virtual_interface` / `..._transit_...`; attach a **Direct Connect gateway** and
   associate the VGW/TGW; establish BGP and advertise prefixes.
3. **Secure** — enable MACsec (or IPsec-over-DX) for confidentiality, BGP MD5 + route filtering,
   least-privilege IAM, CloudWatch alarms; build the chosen resilience model.
4. **Verify** — apply [[verify-by-running]]: `describe-connections` shows `available` and the port;
   `describe-virtual-interfaces` shows the VIF `available` with BGP `up`; on-prem can reach VPC
   private IPs over the VIF (and AWS public endpoints over the public VIF); failing one link in a
   high/maximum-resilience design keeps connectivity; MACsec/IPsec is active for sensitive paths.

## Inputs
On-prem location vs DX location, required bandwidth + resilience model, VIF types needed (private/
public/transit), target VPCs/Regions/accounts (DX gateway/TGW), BGP ASNs + prefixes, encryption
requirement (MACsec/IPsec), partner (if hosted).

## Output
A connection/LAG definition, VIF(s) with VLAN + BGP config, a Direct Connect gateway + VGW/TGW
associations, an encryption + resilience plan, and verification of link state, BGP, reachability,
and failover.

## Notes
- Gotchas: DX is **not encrypted** by default — add MACsec or IPsec-over-DX for sensitive data;
  dedicated connections have physical lead time and need a colo cross-connect (LOA-CFA); a single
  connection is a single point of failure (use two locations for HA/SLA); BGP prefix limits per VIF;
  transit VIFs require a DX gateway + TGW; public VIFs reach AWS public ranges, not the open
  internet; private VIF needs matching VLAN/ASN on both ends.
- IaC/CLI: Terraform `aws_dx_connection`, `aws_dx_lag`, `aws_dx_private_virtual_interface`,
  `aws_dx_transit_virtual_interface`, `aws_dx_gateway`, `aws_dx_gateway_association`. CLI
  `aws directconnect create-connection`, `create-private-virtual-interface`, `create-lag`,
  `create-direct-connect-gateway`, `describe-connections`, `describe-virtual-interfaces`.
  CloudFormation `AWS::DirectConnect::Connection` (limited — most DX is CLI/Terraform/console).
