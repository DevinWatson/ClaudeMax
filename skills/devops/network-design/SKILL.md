---
name: network-design
description: Use when designing or reviewing network topology — CIDR/subnet planning, public/private segmentation, security groups/NACLs/firewall rules, DNS, load balancing, private connectivity (peering/PrivateLink/VPN), and ingress/egress control. Cloud- and provider-agnostic methodology; the platform specifics (which service, which CLI) come from a composed platform skill. TRIGGER on VPC/subnet design, network segmentation, connectivity, or a network security-posture review. Any cloud/networking agent (aws/gcp/azure networking engineers) or a network reviewer can load it.
allowed-tools: Read, Grep, Glob, Bash
category: devops
tags: [networking, vpc, subnets, dns, segmentation, security]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Network Design

A repeatable, provider-agnostic discipline for designing and reviewing network topology so
connectivity is correct, segmented, and least-exposed. The cloud/provider specifics (which
service or CLI) come from a composed platform capability skill.

## When to use this skill
Designing a VPC/VNet, planning CIDR ranges and subnets, segmenting tiers, wiring DNS and load
balancing, establishing private connectivity (peering/PrivateLink/VPN/Direct Connect), or
reviewing a network for over-exposure. Not for application-layer routing or API design.

## Instructions
1. **Plan address space.** Choose non-overlapping CIDR ranges sized for growth; carve subnets
   per tier (public/private/data) and per availability zone. Avoid overlaps with peers/on-prem.
2. **Segment by trust.** Put only internet-facing resources in public subnets; databases and
   internal services in private subnets with no inbound from the internet. One security
   boundary per tier.
3. **Design ingress/egress deliberately.** Front public traffic with a load balancer/WAF; route
   private egress through NAT/proxy; default-deny and open only the flows you can name.
4. **Rules: least exposure.** Security-group/firewall rules reference other groups, not broad
   CIDRs, where possible; restrict ports/sources; document every `0.0.0.0/0`. NACLs/stateless
   rules are coarse defense-in-depth, not the primary control.
5. **Private connectivity.** Prefer private endpoints/peering/PrivateLink over public hops for
   service-to-service and cross-VPC/VNet; plan DNS resolution across the boundary.
6. **DNS & load balancing.** Define the zones, records, health checks, and failover/routing
   policy; keep names stable and split-horizon where needed.
7. **Verify.** Validate the topology (reachability/route tables, no unintended public exposure)
   with the platform's tooling via the composed verify step.

## Inputs
- The workloads/tiers, traffic flows, trust boundaries, regions/AZs, and any existing
  network/peers/on-prem ranges to integrate with.

## Output
- The topology: CIDR/subnet plan, segmentation, rule set (source → dest → port, with rationale),
  connectivity/DNS/LB design, and the diagram or table. Flagged exposures and the least-privilege
  alternative for each.

## Notes
- Default-deny and least-exposure over convenience; every internet-facing path is justified.
- This skill carries the method; the provider's concrete services come from the composed platform
  skill (e.g. aws-services). Pair with it.
