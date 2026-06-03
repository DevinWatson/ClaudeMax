---
name: azure-site-recovery
description: Use when designing, provisioning, configuring, or operating Azure Site Recovery (ASR) — Azure's disaster-recovery service that replicates workloads to a secondary region (or to Azure from on-prem) and orchestrates failover/failback (Azure Site Recovery). Covers the Recovery Services vault, replication policies (RPO, app-consistent/crash-consistent snapshots, retention), recovery plans (ordered groups + scripts/runbooks), test failover, planned/unplanned failover and failback, and RPO/RTO targets. Loads the knowledge to set up a vault, enable replication, build recovery plans, run a non-disruptive test failover, and verify DR readiness. Consumed by the azure-site-recovery specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-site-recovery, migration, disaster-recovery, replication]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Site Recovery

**Azure Site Recovery (ASR)** is Azure's **disaster-recovery** service: it **replicates** workloads to a secondary
region (or to Azure from on-prem/VMware/Hyper-V/physical) and **orchestrates failover and failback**. This skill
owns the **single-service ASR layer** — the vault, replication, recovery plans, test failover, and RPO/RTO.

## Core concepts and components
- **Recovery Services vault** — the regional resource that holds replication config, recovery points, and the
  orchestration; deployed in the **target** (DR) region.
- **Replication** — continuous block-level replication of disks to the target region, producing **recovery points**
  (crash-consistent on a short interval, **app-consistent** on a longer interval).
- **Replication policy** — defines **RPO threshold**, recovery-point **retention** window, and app-consistent
  snapshot frequency.
- **Recovery plan** — an ordered set of **groups** of machines with **pre/post scripts** (Automation runbooks) and
  manual actions, so a multi-tier app fails over in the correct order.
- **Failover types** — **test failover** (non-disruptive, into an isolated network), **planned** (no data loss,
  for migrations/drills) and **unplanned** failover, plus **failback** (reprotect + reverse replication).
- **RPO / RTO** — the data-loss and downtime targets the design must meet; ASR reports actual RPO continuously.

## Configuration and sizing
- Create the **vault** in the DR region, define a **replication policy** (RPO/retention), **enable replication** on
  the source VMs (target resource group/VNet/subnet/storage), and author **recovery plans** with ordered groups.
  Sizing = the **target** compute/network/cache-storage-account capacity to absorb a failover.

## Security and IAM
- Authenticate via **Entra ID**; use **RBAC** (`Site Recovery Contributor`, `Site Recovery Operator`,
  `Site Recovery Reader`) to separate who configures replication from who can trigger a **failover**. Replication
  uses a **cache storage account** and (for managed disks) **disk encryption**/CMK that must exist in the target;
  use a managed identity for vault operations and protect failover rights tightly.

## Cost levers
- Billed per **protected instance** + **target storage** (replica disks, cache) + egress. Levers: protect only
  workloads that truly need DR, tune **retention** (fewer recovery points), keep target VMs **deallocated** until
  failover (pay storage, not compute), and right-size the target region footprint.

## Scaling and limits
- Protected-instances per vault, churn (write) rate per disk before RPO degrades, recovery-plan group counts, and
  region pairing. High-churn disks may exceed supported limits; split across vaults for very large estates.

## Operating procedure
1. **Provision** — create the **Recovery Services vault** via **azurerm** (`azurerm_recovery_services_vault`) in the
   target region; assign a managed identity.
2. **Configure** — define a **replication policy** (`azurerm_site_recovery_replication_policy`), set up
   fabric/containers as needed, **enable replication** on the VMs
   (`azurerm_site_recovery_replicated_vm`) with target RG/VNet/subnet, and build **recovery plans**
   (`azurerm_site_recovery_replication_recovery_plan`) with ordered groups.
3. **Secure** — wire **Entra/RBAC** (separate config vs failover roles), ensure target **encryption/CMK** + cache
   storage exist, lock down failover.
4. **Verify** — apply [[verify-by-running]]: confirm replication is **healthy** and within the RPO
   (`az backup`/ASR status via `az resource`/portal API), run a **test failover** of a recovery plan into the
   isolated network, confirm the test VM boots, then clean up and record the achieved RPO/RTO.

## Inputs
The **source workloads** + region, the **target region/RG/VNet** + cache storage + CMK, the **replication policy**
(RPO/retention), the **recovery plans** (ordered groups + scripts), and the **RBAC** split.

## Output
An ASR setup: a target-region vault, replication enabled on the protected workloads within the RPO, recovery plans
with correct ordering and scripts, and a separated failover RBAC model — plus verification that replication is
healthy and a non-disruptive test failover boots the workload.

## Notes
- Gotchas: skipping **test failover** so real DR is unproven; **high-churn** disks blow the RPO; target
  **CMK/encryption** or **cache storage** missing blocks enablement; recovery-plan **ordering** wrong breaks multi-
  tier apps; forgetting **failback/reprotect** leaves you stranded in DR; failover rights too broadly granted.
  2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peer: AWS
  Elastic Disaster Recovery.
- IaC/CLI: Terraform **azurerm** (`azurerm_recovery_services_vault`, `azurerm_site_recovery_replication_policy`,
  `azurerm_site_recovery_replicated_vm`, `azurerm_site_recovery_replication_recovery_plan`,
  `azurerm_site_recovery_fabric`/`_protection_container`); CLI `az backup`/ASR via `az resource`; Bicep
  `Microsoft.RecoveryServices/*`.
