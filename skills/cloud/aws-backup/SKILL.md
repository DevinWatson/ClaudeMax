---
name: aws-backup
description: Use when designing, configuring, securing, or operating AWS Backup — centralized, policy-driven backup orchestration across services (EBS, EFS, FSx, S3, RDS/Aurora, DynamoDB, EC2/AMI, and more): backup plans (rules, schedules, lifecycle to cold storage, retention), backup vaults and Vault Lock (immutable WORM/compliance), resource selection by tag/ARN, cross-Region and cross-account copy, KMS encryption, restore testing, and Backup Audit Manager for compliance reporting (AWS Backup). Loads the Backup knowledge: how to define a backup plan, assign resources, lock vaults for ransomware/compliance protection, copy off-Region/account, and verify backups and restores. Consumed by the AWS Backup specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they implement centralized data protection.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, backup, data-protection, disaster-recovery, compliance, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Backup

A **centralized backup orchestration** service that schedules, retains, copies, and restores backups
across many AWS services from one place — replacing per-service ad-hoc snapshots. Use it to enforce
org-wide RPO/retention policy; for the individual data stores it protects, use the EBS/EFS/FSx/S3
specialists, and for moving live data use DataSync (not Backup).

## Core concepts and components (plans and vaults)
- **Backup plan** — one or more **rules**, each with a schedule (cron/rate), backup window, lifecycle
  (transition to **cold storage** after N days, **expire/retention** after M days), copy actions,
  and target vault.
- **Backup vault** — encrypted container for recovery points; **Vault Lock** makes them **immutable
  (WORM)** — Compliance mode cannot be undone even by root, protecting against ransomware/accidental
  deletion.
- **Resource assignment** — select protected resources by **tag**, resource type, or ARN (decoupling
  policy from individual resources).
- **Cross-Region / cross-account copy** — copy recovery points for DR and isolation.
- **Backup Audit Manager** — frameworks/reports proving resources are backed up per policy; **restore
  testing** validates recoverability automatically.

## Supported sources
EBS volumes, EFS, FSx, S3, RDS/Aurora, DynamoDB, EC2 (AMI), DocumentDB, Neptune, Redshift, Storage
Gateway volumes, and more — orchestrated centrally with consistent lifecycle and retention.

## Security and IAM
- Vaults are KMS-encrypted; use a dedicated CMK. The Backup **service role** needs least-privilege
  permissions to snapshot/restore each resource type. Use **Vault Lock (Compliance mode)** for
  immutability, a **separate backup account** + cross-account copy for blast-radius isolation, and
  SCPs to prevent deletion of recovery points. Restrict `backup:DeleteRecoveryPoint` /
  `DeleteBackupVault` tightly.

## Cost levers
- Lifecycle to **cold storage** for long retention; tune retention to actual RPO/compliance need;
  cross-Region copy doubles storage + adds transfer cost — only for data that needs DR. Avoid
  over-frequent backups of low-change resources.

## Scaling and limits
- One plan can cover thousands of resources via tag selection across accounts (with AWS
  Organizations + delegated admin). Per-account quotas on plans/vaults; some resource types have a
  minimum cold-storage retention before expiry.

## Operating procedure
1. **Provision** — create a KMS-encrypted backup vault and a backup plan (rules: schedule, lifecycle,
   retention, copy) via Terraform `aws_backup_vault` + `aws_backup_plan` or `aws backup
   create-backup-plan`.
2. **Configure** — a `aws_backup_selection` assigning resources by tag/ARN; cross-Region/account copy
   actions; Backup Audit Manager framework + restore testing.
3. **Secure** — Vault Lock (Compliance) for immutability, least-privilege service role, separate
   backup account/cross-account copy, SCPs against deletion.
4. **Verify** — apply [[verify-by-running]]: `aws backup start-backup-job` (or wait for schedule),
   `list-recovery-points-by-backup-vault` shows a `COMPLETED` recovery point; run a **restore job**
   and confirm the resource restores; confirm Vault Lock blocks deletion within the retention window.

## Inputs
Which resources/tags to protect, RPO (backup frequency) + retention, compliance/immutability needs,
DR (cross-Region/account) requirements, encryption/KMS key, restore-testing expectations.

## Output
A backup plan (rules/schedule/lifecycle/retention), vault (+ Vault Lock), resource selection, copy
actions, audit/restore-test config, and verification of a completed backup, a successful restore, and
immutability enforcement.

## Notes
- Gotchas: a plan only protects resources it **selects** — verify the tag/ARN selection actually
  matches; **Vault Lock Compliance mode is irreversible** (test in a non-prod vault first); cold
  storage has a minimum retention before you can expire; restoring overwrites or creates new
  resources depending on type (know the behavior); the service role must have permissions for every
  source type; cross-Region copy needs a vault + key in the destination Region.
- IaC/CLI: Terraform `aws_backup_vault`, `aws_backup_vault_lock_configuration`, `aws_backup_plan`,
  `aws_backup_selection`, `aws_backup_framework`, `aws_backup_region_settings`. CLI `aws backup
  create-backup-vault`, `put-backup-vault-lock-configuration`, `create-backup-plan`,
  `create-backup-selection`, `start-backup-job`, `start-restore-job`,
  `list-recovery-points-by-backup-vault`. CloudFormation `AWS::Backup::BackupVault`, `::BackupPlan`,
  `::BackupSelection`.
