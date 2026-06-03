---
name: aws-application-migration-service
description: Use when designing, provisioning, securing, or operating AWS Application Migration Service (MGN) — block-level replication agents on source servers, the staging-area subnet, replication settings, launch templates / launch settings, test and cutover instances, and post-launch actions for lift-and-shift (rehost) migration of physical, virtual, or other-cloud servers into EC2 (AWS Application Migration Service). Loads the MGN knowledge: how to install replication agents, continuously replicate servers, launch test instances, cut over with minimal downtime, and verify the migrated server boots and serves. Consumed by the MGN specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they rehost servers.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, mgn, application-migration-service, rehost, lift-and-shift, server-migration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Application Migration Service (MGN)

The primary service for **lift-and-shift (rehost)** server migration: it block-level replicates
source servers (physical, VMware/Hyper-V, or another cloud) into AWS and launches them as EC2
instances with minimal downtime. MGN migrates whole *servers* (OS + apps + data as a unit); for
database-only moves use DMS, and for program-level tracking use Migration Hub.

## Core concepts and components
- **Replication agent** — installed on each source server; performs continuous **block-level**
  replication of the disks into the staging area.
- **Staging-area subnet** — low-cost EC2 + EBS that receives the replicated data before launch;
  isolated from production.
- **Replication settings** — staging subnet, instance type, EBS volume type, encryption,
  bandwidth throttling, data routing (private/public/VPN/Direct Connect).
- **Launch template / launch settings** — define the target EC2 shape, subnet, security groups,
  IAM instance profile, and whether to right-size; drive **test** and **cutover** launches.
- **Test vs. cutover instance** — test launches validate the migration non-disruptively; cutover
  launches the production instance and finalizes; **post-launch actions** run automation (e.g.
  install agents, validations) after boot.

## Configuration and sizing
- Stage in a dedicated low-cost subnet; throttle replication bandwidth so it doesn't starve
  production. Define launch templates that map source to right-sized EC2 + correct networking/IAM.
- Always run **test** launches and validate the app before cutover; keep replication going so the
  cutover instance is current.

## Security and IAM
- Agents need outbound reach to the staging subnet (direct, VPN, or Direct Connect); restrict the
  staging subnet and replication security groups. Encrypt replicated EBS volumes with KMS.
- Use the MGN-managed IAM roles plus a least-privilege instance profile on launched servers;
  protect agent installer credentials.

## Cost levers
- Staging-area EC2/EBS is the running cost during replication — use small staging instance types
  and `gp3`; terminate the staging resources after cutover. Right-size target instances at launch
  instead of mirroring oversized source hardware.

## Scaling and limits
- Migrates large fleets in waves; concurrency bounded by staging-subnet capacity and bandwidth.
  Source OS support is per the MGN compatibility matrix; continuous replication keeps RPO low.

## Operating procedure
1. **Provision** — initialize MGN in the Region, create the replication settings template and a
   staging-area subnet; generate the agent installer.
2. **Configure** — install the replication agent on source servers, wait for initial sync, then
   define launch templates (target type, subnet, SGs, IAM, post-launch actions).
3. **Secure** — KMS-encrypted staging volumes, locked-down staging subnet/SGs, least-privilege
   IAM, private/VPN/Direct Connect data routing.
4. **Verify** — apply [[verify-by-running]]: `aws mgn describe-source-servers` shows
   `dataReplicationInfo` HEALTHY and lifecycle ready, launch a **test** instance and confirm it
   boots and the app responds, then validate the cutover instance the same way before finalizing.

## Inputs
Source server inventory + OS, network path to AWS (VPN/Direct Connect), target VPC/subnet/SG/IAM,
right-sizing preferences, downtime tolerance, wave plan, and encryption/compliance requirements.

## Output
Initialized MGN with replication settings, agents installed and servers replicating, launch
templates, validated test launches, a low-downtime cutover, and verification that source servers
are HEALTHY/ready and launched instances boot and serve.

## Notes
- Gotchas: MGN rehosts whole servers — for database-only migration use DMS, for program tracking
  use Migration Hub; the staging area accrues cost until you terminate it; always test-launch
  before cutover; agents need a clear network path and adequate bandwidth (throttle to protect
  prod); finalize cutover only after the app is validated, then archive the source server entry.
- IaC/CLI: Terraform coverage is limited (`aws_mgn_*` is partial); mostly API/console. CLI
  `aws mgn initialize-service`, `put-replication-configuration-template`,
  `describe-source-servers`, `update-launch-configuration`, `start-test`, `start-cutover`,
  `finalize-cutover`. Pair with Migration Hub tracking for program visibility.
