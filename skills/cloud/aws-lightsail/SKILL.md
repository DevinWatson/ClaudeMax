---
name: aws-lightsail
description: Use when designing, provisioning, securing, or operating Amazon Lightsail — simplified VPS instances, bundles/blueprints, fixed-price plans, managed databases, load balancers, container services, object storage, snapshots, static IPs, and the Lightsail DNS/networking model (Amazon Lightsail). Loads the Lightsail-specific knowledge: how to pick a bundle, configure firewall/networking, snapshot/back up, control the flat-rate cost, and verify an instance/service. Consumed by the Lightsail specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when a workload wants simple fixed-price hosting.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, lightsail, vps, fixed-price, simple-hosting, blueprints]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Lightsail

Simplified, fixed-monthly-price virtual private servers and managed building blocks for small
workloads, prototypes, and predictable spend. Lightsail trades EC2's flexibility for simplicity
and a flat bill. Pick Lightsail for blogs, small apps, dev/test, and clients who want predictable
pricing; pick EC2/Fargate when you need fine-grained instance types, deep VPC/IAM control,
autoscaling, or production-grade integration with the rest of AWS.

## Core concepts and components
- **Instance** — a VPS launched from a **blueprint** (OS or app stack like WordPress/LAMP/Node)
  with a fixed-size **bundle** (vCPU + RAM + SSD + transfer allowance).
- **Bundle/plan** — fixed monthly price tier; includes a data-transfer allowance.
- **Managed database** — MySQL/PostgreSQL with automated backups. **Load balancer** — simple
  HTTPS LB with free managed certs. **Container service** — run containers without ECS.
- **Object storage**, **block storage (disks)**, **snapshots**, **static IP**, **Lightsail DNS
  zone**.
- **VPC peering** — connect the Lightsail VPC to your default AWS VPC.

## Configuration and sizing
- Pick the smallest bundle that fits and upgrade by snapshot→larger bundle (no in-place resize
  down). Attach extra block storage rather than oversizing the bundle.
- Use blueprints to skip stack setup; static IP for stable addressing; managed certs on the LB.

## Security and IAM
- Lightsail has its own per-instance **firewall** (not VPC security groups) — open only needed
  ports; restrict SSH/RDP source to your IP.
- Lightsail is largely outside fine-grained IAM; control access at the account/Lightsail-API
  level. For workloads needing IAM roles on the host, use EC2 instead.
- Enable automatic snapshots; rotate keys; keep blueprints/OS patched.

## Cost levers
- The whole point is the flat bundle price — the main lever is choosing the right tier and not
  exceeding the transfer allowance (overage billed per GB). Delete idle instances, unused static
  IPs (charged when not attached), and old snapshots.

## Scaling and limits
- No native autoscaling — scale by snapshotting to a bigger bundle or migrating to EC2. Container
  services scale by node count/power tier. Regional, with limited instance ceilings; not for
  large elastic fleets.

## Operating procedure
1. **Provision** — create the instance from a blueprint + bundle (and static IP / managed DB / LB
   as needed) via `aws lightsail create-instances` / Terraform `aws_lightsail_instance`.
2. **Configure** — attach static IP, open required firewall ports, set up the LB + managed cert,
   point the DNS zone.
3. **Secure** — minimal firewall ports with source restriction, enable automatic snapshots,
   patch the blueprint, VPC-peer only if integration is required.
4. **Verify** — apply [[verify-by-running]]: confirm `aws lightsail get-instance` shows state
   `running`, the open ports match intent, the public endpoint/LB returns the expected response,
   and a recent snapshot exists.

## Inputs
Workload type (and matching blueprint), required vCPU/RAM/SSD/transfer, public exposure/ports,
backup needs, DNS/domain, integration with the rest of AWS.

## Output
An instance/service plan with the chosen blueprint + bundle and rationale, firewall rules, static
IP/LB/DNS config, snapshot policy, and the verification commands + observed state.

## Notes
- Gotchas: Lightsail firewall is separate from VPC SGs; can't shrink a bundle (only grow via
  snapshot); detached static IPs are billed; transfer overage costs add up; limited IAM and AWS
  service integration — migrate to EC2/ECS when you outgrow it; snapshots are regional.
- IaC/CLI: Terraform `aws_lightsail_instance`, `aws_lightsail_static_ip`,
  `aws_lightsail_instance_public_ports`, `aws_lightsail_database`. CLI
  `aws lightsail create-instances`, `get-instance`, `open-instance-public-ports`,
  `create-instance-snapshot`.
