---
name: aws-workspaces
description: Use when provisioning, sizing, securing, or operating persistent managed virtual desktops (VDI) with Amazon WorkSpaces — WorkSpaces tied to a directory (AWS Managed Microsoft AD, AD Connector, or Simple AD), bundles (compute type Value/Standard/Performance/Power/Graphics + root/user volumes) and custom images, running modes (AlwaysOn vs AutoStop) and billing, WorkSpaces Personal vs the WorkSpaces Pools (non-persistent) and Core models, networking/VPC and IP access control groups, encryption with KMS, and the streaming/client protocols (PCoIP/WSP DCV) (Amazon WorkSpaces). Loads the WorkSpaces knowledge: how to wire a directory, build bundles/images, launch desktops, secure access, and verify a desktop is available. Consumed by the WorkSpaces specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) building managed VDI.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, workspaces, vdi, virtual-desktop, directory, bundles]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon WorkSpaces

A managed **persistent virtual desktop infrastructure (VDI)** service: each user gets a durable
cloud desktop (Windows or Linux) that retains its state between sessions. It is the **persistent**
end-user computing service — for streaming individual applications (non-persistent app delivery) use
AppStream 2.0; WorkSpaces gives each user a full, persistent machine.

## Core concepts and components
- **Directory** — WorkSpaces are tied to a directory for user identity: **AWS Managed Microsoft AD**,
  **AD Connector** (to on-prem AD), or **Simple AD**. The directory must be registered with
  WorkSpaces before launching desktops.
- **Bundles** — define the desktop: a **compute type** (Value, Standard, Performance, Power,
  PowerPro, **Graphics**/GraphicsPro) plus **root** and **user** volume sizes and an OS/application
  set. Build **custom images/bundles** to standardize software.
- **Running modes** — **AlwaysOn** (monthly, always available) or **AutoStop** (hourly + a small
  monthly fee; the desktop stops after idle and resumes on connect) — the primary cost lever.
- **Deployment models** — **WorkSpaces Personal** (persistent, one desktop per user), **WorkSpaces
  Pools** (non-persistent, shared from a pool), and **WorkSpaces Core** (BYO VDI management).
- **Networking** — desktops live in your **VPC** subnets; **IP access control groups** restrict the
  source IPs clients may connect from.
- **Protocols** — streaming via **PCoIP** or **WSP/DCV** depending on bundle/client.

## Configuration and sizing
- Register the directory first, then choose a bundle per workload (Value/Standard for office work,
  Power/Graphics for engineering/CAD). Use custom images to bake in software so desktops are uniform.
- Pick the running mode by usage: **AutoStop** for part-time/intermittent users (pay hourly),
  **AlwaysOn** for full-time users — this is the dominant cost decision.

## Security and IAM
- Constrain client source IPs with **IP access control groups**; require MFA at the directory; place
  desktops in private subnets with controlled egress.
- **Encrypt** root/user volumes with **KMS**; restrict WorkSpaces admin actions with IAM; integrate
  directory group policy for OS hardening; manage trusted-device/certificate-based access if needed.

## Cost levers
- Billed per WorkSpace by running mode (**AutoStop hourly** vs **AlwaysOn monthly**) and compute/
  volume size. Use AutoStop for intermittent users, right-size compute and volumes, terminate unused
  desktops, and consider Pools for shared non-persistent fleets.

## Scaling and limits
- Quotas on WorkSpaces per directory/account and per-region capacity apply. Scale by adding
  directories/desktops; use auto-provisioning for onboarding and raise quotas for large rollouts.

## Operating procedure
1. **Provision** — register a directory (Managed AD/AD Connector/Simple AD) and launch WorkSpaces
   from a bundle via Terraform `aws_workspaces_directory` / `aws_workspaces_workspace` or
   `aws workspaces register-workspace-directory` / `create-workspaces`.
2. **Configure** — select compute bundle + volumes, set the running mode (AlwaysOn/AutoStop), build a
   custom image/bundle for standard software, and place desktops in the right VPC subnets.
3. **Secure** — attach an IP access control group, require directory MFA, enable KMS volume
   encryption, place in private subnets, and restrict admin IAM.
4. **Verify** — apply [[verify-by-running]]: `aws workspaces describe-workspaces` and confirm the
   desktop state is `AVAILABLE` (and running mode/bundle are as intended), then confirm directory
   registration with `aws workspaces describe-workspace-directories` and a client can connect.

## Inputs
User population and identity source (Managed AD/on-prem AD), per-user workload (office vs graphics),
usage pattern (full vs part-time), VPC/network design, allowed client IPs, encryption/compliance
needs, and persistent vs pooled requirement.

## Output
A registered directory, WorkSpaces launched from appropriately sized bundles with the right running
mode, IP access control + MFA + KMS encryption, correct VPC placement, and verification that a
desktop is AVAILABLE and reachable.

## Notes
- Gotchas: register the directory before launching desktops; the **running mode (AutoStop vs
  AlwaysOn)** is the biggest cost lever; bundles fix compute + volumes — pick per workload and use
  custom images for uniform software; restrict client IPs with IP access control groups and encrypt
  volumes with KMS; WorkSpaces is **persistent VDI** — for non-persistent application streaming use
  AppStream 2.0.
- IaC/CLI: Terraform `aws_workspaces_directory`, `aws_workspaces_workspace`, `aws_workspaces_ip_group`.
  CLI `aws workspaces register-workspace-directory` / `create-workspaces` / `describe-workspaces` /
  `describe-workspace-directories` / `create-ip-group` / `modify-workspace-properties`.
  CloudFormation `AWS::WorkSpaces::Workspace`, `AWS::WorkSpaces::ConnectionAlias`.
