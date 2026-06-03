---
name: gcp-backup-and-dr
description: Use when designing, provisioning, securing, or operating Backup and DR Service — Google Cloud's centralized, application-consistent backup and disaster-recovery service for Compute Engine VMs, databases, and file systems (Backup and DR Service). Covers backup vaults (immutable, with enforced retention/locks), backup plans and policies (schedules, retention, templates), backup/recovery appliances, protected resources and resource backup configs, on-demand and scheduled backups, point-in-time and cross-region restore, plus IAM, CMEK, cost, and limits. Loads the Backup and DR knowledge: create a vault, attach a plan, protect resources, restore, and verify. Consumed by the Backup and DR specialist and by the GCP role team (gcp-cloud-architect / gcp-iac-engineer) when providing managed backup/DR (Backup and DR Service).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, backup-and-dr, storage, backup, disaster-recovery, backup-vault, retention]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Backup and DR Service

Google Cloud's **centralized, application-consistent backup and disaster-recovery** service. It protects
**Compute Engine VMs**, **databases** (Cloud SQL, SAP HANA, Oracle, SQL Server, etc.), and file systems
with policy-driven backups and orchestrated recovery, giving you a single place to manage retention,
immutability, and restore across a project or organization.

## Core concepts and components
- **Backup vaults** — immutable, isolated storage for backups with **enforced minimum retention** and an
  optional **lock** so backups cannot be deleted or shortened before expiry (ransomware/insider
  protection). Vaults live in a region and are billed on stored backup bytes.
- **Backup plans and policies** — a **backup plan** binds **backup rules** (schedule/frequency, retention,
  target vault) to a resource type; **backup plan associations** attach a plan to specific protected
  resources. Templates standardize plans across resources.
- **Protected resources / resource backup configs** — the VMs, disks, and databases enrolled into a plan;
  each has a backup config describing what is captured and how often.
- **Backup/recovery appliances** — the management server and backup appliances (the Actifio-derived engine)
  that perform application-consistent capture for databases and on-prem/VMware sources, with incremental-
  forever backups.
- **Backups and recovery points** — scheduled or **on-demand** backups produce recovery points; restore
  supports **point-in-time**, new-VM/instant-mount, and **cross-region** recovery.
- **Management console / API** — the Backup and DR management UI plus the `backupdr.googleapis.com` API for
  vaults, plans, and associations.

## Configuration and sizing
- Choose a **vault region** (often paired/distinct from the workload region for DR) and set the **enforced
  retention** (and whether to **lock** it). Define **backup rules** per RPO: frequency (hourly/daily),
  retention, and target vault. Right-size the **management server/appliance** to the protected estate
  (number of VMs/DBs, change rate). Use **plan templates** so many resources share one consistent policy.

## Security and IAM
- IAM governs administration: `roles/backupdr.admin`, `roles/backupdr.backupUser`, and
  `roles/backupdr.viewer` (grant to **groups**, least privilege; separate who can **create/lock vaults**
  from who runs backups). **Vault immutability + lock** is the core ransomware control — once locked,
  retention cannot be reduced. Encrypt with **CMEK** (Cloud KMS) where required; keep vaults in a
  controlled project. Backups inherit the sensitivity of their source — treat vault access as privileged.

## Cost levers
- Billed primarily on **backup bytes stored in the vault** (incremental-forever reduces this) plus
  management-server/appliance and egress for cross-region. Levers: tune **retention** to policy (don't
  over-retain), use **incremental** schedules, prune unneeded plans, and place vaults to minimize
  cross-region egress while still meeting DR isolation.

## Scaling and limits
- Limits apply to **vaults, plans, and associations per project/region** and protected resources per
  management server; very large estates may need multiple appliances. Cross-region restore and supported
  database/source types are **region- and engine-specific** — confirm availability. Locked vault retention
  is **irreversible** within the lock window.

## Operating procedure
1. **Provision** — enable `backupdr.googleapis.com`; create a **backup vault** in the chosen region with
   **enforced retention** (and decide on the **lock**); stand up the **management server/appliance** if
   protecting databases/VMware, via Terraform `google_backup_dr_backup_vault` /
   `google_backup_dr_management_server`.
2. **Configure** — author a **backup plan** with rules (schedule, retention, target vault) and **associate**
   it to protected VMs/databases (`google_backup_dr_backup_plan` /
   `google_backup_dr_backup_plan_association`); set **CMEK** if required.
3. **Secure** — set least-privilege **backupdr.* IAM** on groups, separate vault-admin from backup-operator
   duties, and **lock** the vault retention for immutability where the policy demands it.
4. **Verify** — apply [[verify-by-running]]: trigger an **on-demand backup** and confirm a recovery point
   is created (`gcloud backup-dr backups list`), perform a **test restore** (new VM / instant mount /
   point-in-time) and confirm the data is intact, and confirm a **locked vault** rejects an early-delete
   attempt. Capture the created recovery point, the successful restore, and the blocked early deletion.

## Inputs
The resources to protect (VMs, databases, file systems), RPO/RTO and retention policy, DR region/isolation
needs, whether vault immutability must be **locked**, CMEK requirements, and the size of the estate
(for appliance sizing).

## Output
A backup vault (with enforced/locked retention) plus backup plans associated to the protected resources,
appliance/management server where needed, least-privilege IAM and CMEK, and verification of a created
recovery point, a successful test restore, and an immutability check.

## Notes
- Gotchas: a **locked vault's retention is irreversible** within the lock window — set it deliberately;
  **vault region** should usually differ from the workload for true DR; **application-consistent** backups
  for databases require the management server/appliance and agent, not just disk snapshots; cross-region
  restore and supported sources are **region/engine-specific**; backups inherit source sensitivity, so
  vault access is privileged. This is distinct from raw **Compute Engine snapshots** and from object
  lifecycle on Cloud Storage. 2nd consumer: the GCP role team (gcp-cloud-architect / gcp-iac-engineer)
  wiring managed backup/DR, not just the specialist. Cross-cloud peer: AWS Backup.
- IaC/CLI: Terraform `google_backup_dr_backup_vault`, `google_backup_dr_backup_plan`,
  `google_backup_dr_backup_plan_association`, and `google_backup_dr_management_server`. CLI
  `gcloud backup-dr backup-vaults`, `gcloud backup-dr backup-plans`,
  `gcloud backup-dr backup-plan-associations`, and `gcloud backup-dr backups list` to verify recovery
  points and run/inspect restores.
