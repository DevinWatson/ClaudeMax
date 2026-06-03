---
name: aws-ec2
description: Use when designing, provisioning, securing, or operating Amazon EC2 — instances, AMIs, instance types/families and sizing, EBS volumes, key pairs, security groups, IAM instance profiles, user data, placement groups, capacity (On-Demand/Spot/Reserved/Savings Plans), and lifecycle (start/stop/hibernate/terminate) (Amazon EC2). Loads the EC2-specific knowledge: how to pick a family, attach least-privilege roles, harden network exposure, control cost, and verify an instance is healthy. Consumed by the EC2 specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they touch raw compute.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ec2, compute, ebs, security-groups, spot, sizing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon EC2

Resizable virtual machines on AWS. EC2 gives you full control of the OS, network interface, and
storage — the most flexible and lowest-level AWS compute. Use it when you need a long-running
host, custom kernels/agents, GPUs, or a lift-and-shift target; reach for Lambda/Fargate instead
when you want to avoid managing servers.

## Core concepts and components
- **Instance** — a running VM launched from an **AMI** (machine image) into a subnet of a VPC.
- **Instance type/family** — `m` (balanced), `c` (compute), `r`/`x` (memory), `t` (burstable,
  CPU credits), `g`/`p`/`inf` (GPU/accelerator), `i`/`d` (storage). Suffix = size (`large`,
  `2xlarge`). Prefer current-gen Graviton (`g`-suffixed, e.g. `m7g`) for price/perf when the
  workload is ARM-compatible.
- **EBS volumes** — network block storage (`gp3` default, `io2` for high IOPS, `st1`/`sc1` HDD).
  Plus **instance store** (ephemeral, lost on stop).
- **Security group** — stateful instance-level firewall. **Key pair** — SSH/RDP access.
- **IAM instance profile** — the role the instance assumes for AWS API calls.
- **User data** — boot-time bootstrap script.
- **Placement groups** — cluster (low latency), spread (HA), partition (large distributed).

## Configuration and sizing
- Right-size from utilization data (Compute Optimizer / CloudWatch), not guesswork. Burstable
  `t` family for spiky low-average loads; watch CPU credit balance.
- Choose `gp3` and provision IOPS/throughput independently of size (cheaper than `gp2`).
- Enable detailed monitoring only when 1-minute metrics are needed (it costs extra).
- Use launch templates (versioned) over launch configurations.

## Security and IAM
- Attach an **instance profile** with least-privilege policies — never bake credentials into
  user data or AMIs.
- Use **IMDSv2 only** (`http-tokens: required`) to block SSRF credential theft.
- Lock security groups to specific CIDRs/ports; avoid `0.0.0.0/0` on 22/3389 — use SSM Session
  Manager for shell access instead of public SSH.
- Encrypt EBS volumes (KMS); enable EBS encryption by default at the account level.

## Cost levers
- **Spot** for fault-tolerant/interruptible work (up to ~90% off). **Savings Plans / Reserved**
  for steady baseline. On-Demand for spiky/unknown.
- Stop (not just idle) non-prod instances off-hours; delete unattached EBS volumes and old
  snapshots; downsize over-provisioned instances.

## Scaling and limits
- A single instance does not auto-heal or scale — pair with EC2 Auto Scaling + a load balancer
  for elasticity and self-healing.
- Per-region vCPU service quotas (On-Demand/Spot) cap how many you can launch; request increases.

## Operating procedure
1. **Provision** — define a launch template (AMI, instance type, subnet, SG, instance profile,
   user data, `gp3` root volume, IMDSv2 required), then launch via Terraform `aws_instance` /
   `aws_launch_template` or `aws ec2 run-instances`.
2. **Configure** — bootstrap via user data or SSM; tag (`Name`, `env`, `owner`, `cost-center`).
3. **Secure** — least-privilege instance profile, tight SG, encrypted EBS, IMDSv2, SSM access.
4. **Verify** — apply [[verify-by-running]]: confirm `aws ec2 describe-instance-status` shows
   `running` + both checks `passed`, the app port responds, and the instance metadata shows the
   expected role and IMDSv2 enforcement.

## Inputs
Workload profile (CPU/mem/GPU, steady vs spiky), OS/AMI, VPC/subnet placement, ingress needs,
data durability/IOPS needs, budget/commitment appetite.

## Output
A launch template / instance definition with sizing rationale, SG and IAM profile, storage
config, capacity model (On-Demand/Spot/RI mix), and the verification commands + observed status.

## Notes
- Gotchas: stopping loses instance-store data and public IP (unless EIP); `t`-family throttles
  when credits run out; security groups are stateful but NACLs are not; terminating with
  `DeleteOnTermination` true destroys the root EBS volume.
- IaC/CLI: Terraform `aws_instance`, `aws_launch_template`, `aws_ebs_volume`,
  `aws_security_group`, `aws_iam_instance_profile`. CLI `aws ec2 run-instances`,
  `describe-instances`, `describe-instance-status`. CloudFormation `AWS::EC2::Instance`,
  `AWS::EC2::LaunchTemplate`.
