---
name: azure-backup
description: Use when designing, provisioning, securing, or operating Azure Backup — Azure's managed backup service that protects VMs, files/folders, Azure Files shares, SQL/SAP HANA in VMs, and on-prem workloads (via MARS/MABS/DPM) into a Recovery Services vault or Backup vault (Azure Backup). Covers vault types and storage redundancy (LRS/ZRS/GRS), backup policies (frequency/schedule/retention GFS), the workload extensions/agents, instant restore snapshots vs vault-tier recovery, cross-region restore, soft delete and immutable/Multi-User Authorization (MUA) protection against ransomware, Entra/RBAC, and managed identities. Loads the knowledge: pick a vault + redundancy, define policies, enable protection, secure, provision, and verify a backup + restore. Consumed by the azure-backup specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect / azure-reliability-engineer) when standing up the managed service (Azure Backup).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-backup, storage, data-protection, recovery-services-vault]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Backup

Azure's **managed backup service** that protects workloads — Azure VMs, files/folders, **Azure Files** shares,
**SQL/SAP HANA in VMs**, blobs/disks, and on-prem servers — into a **Recovery Services vault** (or the newer
**Backup vault**), with policy-driven scheduling, retention, and ransomware protection. Azure runs the backup
fabric; you own the **vault + redundancy**, **policies**, **protected items**, and **access**. This skill owns
the **managed-service layer**.

## Core concepts and components
- **Vaults** — the **Recovery Services vault** (VMs, files, Azure Files, SQL/SAP HANA in VM, MARS/MABS/DPM)
  and the **Backup vault** (blobs, disks, PostgreSQL, AKS, newer workloads). The vault holds policies and
  recovery points.
- **Storage redundancy** — vault-level **LRS / ZRS / GRS**; **GRS + cross-region restore (CRR)** for regional
  DR. Set before protecting items (hard to change after).
- **Backup policy** — defines **frequency/schedule** (daily/hourly) and **retention** (daily/weekly/monthly/
  yearly = **GFS**); attach a policy per protected item.
- **Agents/extensions** — VM backup extension, **MARS agent** (files/folders/system state), **MABS/DPM** for
  on-prem; SQL/SAP HANA workload backup runs inside the VM.
- **Restore tiers** — **instant restore** from local snapshots (fast, short retention) vs **vault-tier**
  recovery; **item-level**, **full-VM**, or **disk** restore.
- **Protection** — **soft delete** (recover deleted backups), **immutable vaults**, and **Multi-User
  Authorization (MUA)** to defend against malicious deletion (ransomware).

## Configuration and sizing
- Create a **vault** (right type) with the appropriate **storage redundancy** (GRS + CRR for DR), author
  **backup policies** matching RPO (frequency) and retention (GFS), then **enable backup** on the target
  items. Right-size retention to balance recovery needs vs cost. Enable **soft delete + immutability + MUA**.

## Security and IAM
- Control via **Entra ID + Azure RBAC** using **Backup** roles (Backup Contributor / Operator / Reader) — keep
  **operators separate from those who can delete backups** (MUA enforces a second approval). The vault uses a
  **managed identity** to access protected resources/keys. Enable **immutable vault** + **soft delete** so
  recovery points survive compromise; encryption at rest is on by default (CMK supported).

## Cost levers
- Billed on **protected-instance count + backup storage consumed (per tier/redundancy)**. Levers: tune
  **retention** (GFS) so you don't hoard recovery points, pick the **cheapest adequate redundancy** (LRS/ZRS
  vs GRS), use **archive tier** for long-term retention of rarely restored points, exclude unneeded disks/
  files, and avoid over-frequent schedules beyond the real RPO.

## Scaling and limits
- Scales across many protected items per vault (per-vault item limits apply — shard across vaults at scale).
  Limits: **redundancy/CRR generally set before protection** and hard to change after, **instant-restore
  snapshot retention** is short, cross-region restore requires **GRS**, restore latency varies by tier, and
  some workloads require the newer **Backup vault**. Deleting a vault requires removing/soft-deleting all
  protected items first.

## Operating procedure
1. **Provision** — create the **vault** with chosen **redundancy** via Terraform
   `azurerm_recovery_services_vault` (+ `azurerm_backup_policy_vm` / `azurerm_data_protection_backup_vault`),
   Bicep `Microsoft.RecoveryServices/vaults`, or `az backup vault create`.
2. **Configure** — author **backup policies** (frequency + GFS retention), set vault **redundancy/CRR** and
   **soft delete / immutability / MUA**, then **enable protection** on items (`az backup protection
   enable-for-vm` / via the relevant resource).
3. **Secure** — assign **Backup RBAC** with separation of duties, enable **MUA + immutable vault**, use the
   vault **managed identity**, and configure CMK if required.
4. **Verify** — apply [[verify-by-running]]: confirm the vault and policy exist and protection is configured
   (`az backup vault show`, `az backup item list`), then **trigger an on-demand backup and restore a recovery
   point** (`az backup protection backup-now` → `az backup restore restore-disks`/files) and confirm the
   restore succeeds. Capture state and result.

## Inputs
The workloads to protect (vault type + agents), RPO/retention (policy frequency + GFS), DR scope (redundancy +
CRR), ransomware/compliance posture (soft delete/immutability/MUA), separation-of-duties (RBAC), encryption
(CMK), and region.

## Output
An Azure Backup setup: a vault at the chosen redundancy with backup policies, protected items enabled, soft
delete/immutability/MUA, RBAC with separation of duties — plus verification that a backup runs and a recovery
point restores.

## Notes
- Gotchas: **storage redundancy / CRR must usually be set before protecting items**; **instant-restore
  retention** is short — vault-tier for longer; **soft delete + immutable vault + MUA** are the key ransomware
  defenses and should be on by default; deleting a vault requires clearing protected items first; **stop
  protection with retain data** vs **delete data** is a costly mistake to confuse; restore latency varies by
  tier. 2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect /
  azure-reliability-engineer). Cross-cloud peer: AWS Backup.
- IaC/CLI: Terraform `azurerm_recovery_services_vault` + `azurerm_backup_policy_vm` /
  `azurerm_backup_protected_vm` (or `azurerm_data_protection_backup_vault/policy/instance`); Bicep/ARM
  `Microsoft.RecoveryServices/vaults`. CLI `az backup vault create` / `az backup protection enable-for-vm` /
  `az backup protection backup-now` / `az backup restore restore-disks`.
