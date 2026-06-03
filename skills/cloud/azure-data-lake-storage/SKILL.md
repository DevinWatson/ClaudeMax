---
name: azure-data-lake-storage
description: Use when designing, provisioning, securing, or operating Azure Data Lake Storage Gen2 (ADLS Gen2) — big-data analytics storage built on Blob Storage by enabling the Hierarchical Namespace on a storage account (Azure Data Lake Storage). Covers HNS (real directories, atomic directory rename/delete), the DFS endpoint and filesystem (container) semantics, POSIX-style ACLs layered on Entra RBAC, access tiers and lifecycle on lake data, the medallion/zone layout (bronze/silver/gold), integration with Synapse/Databricks/Fabric, Entra ID/RBAC + ACLs, managed identities, and private endpoints. Loads the knowledge: enable HNS, design filesystems/zones, set RBAC + ACLs, provision, and verify directory/file operations. Consumed by the azure-data-lake-storage specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect / azure-data-engineer) when standing up the managed service (Azure Data Lake Storage).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-data-lake-storage, storage, adls-gen2, data-lake]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Data Lake Storage

Azure's **big-data analytics storage** — **ADLS Gen2** — built on Blob Storage by enabling the
**Hierarchical Namespace (HNS)** on a storage account. It adds real directories and POSIX ACLs to object
storage, optimized for high-throughput analytics (Synapse, Databricks, Fabric, HDInsight). Azure owns
durability; you own the **filesystem/zone layout**, **ACL model**, **tiering**, and **access**. This skill
owns the **managed-service layer**.

## Core concepts and components
- **Hierarchical Namespace (HNS)** — enabled at account creation; turns the flat blob namespace into real
  **directories** with **atomic directory rename/delete** (huge for analytics jobs). Cannot be toggled off
  later.
- **DFS endpoint & filesystems** — accessed via `https://<account>.dfs.core.windows.net`; a blob **container**
  is a **filesystem**. Both the `blob` and `dfs` endpoints exist; analytics engines use `abfss://`.
- **POSIX ACLs** — fine-grained **access** and **default** ACLs (read/write/execute) on directories and files,
  layered **on top of** Entra RBAC. Effective access = RBAC role plus ACL evaluation.
- **Zone / medallion layout** — organize the lake into zones (raw/**bronze**, cleansed/**silver**,
  curated/**gold**) as top-level directories/filesystems for governance and lifecycle.
- **Tiers & lifecycle** — same **hot/cool/cold/archive** tiers and **lifecycle** rules as Blob apply to lake
  data.

## Configuration and sizing
- Create a **StorageV2** account with **HNS enabled** (and recommended **ZRS/GZRS**), design **filesystems**
  per data domain and **directory zones** (bronze/silver/gold), set **default ACLs** so new files inherit
  permissions, and apply **lifecycle** rules to tier/expire raw and intermediate data. Use Premium for
  latency-sensitive analytics.

## Security and IAM
- Prefer **Microsoft Entra ID + Azure RBAC** (Storage Blob Data Reader/Contributor) for coarse access and
  **POSIX ACLs** for directory-level fine grain, assigned via a **managed identity** (and security groups, not
  individuals). Disable shared-key auth; use **user-delegation SAS** when needed. Restrict with **private
  endpoints** / firewall (default-deny public), enforce HTTPS-only + TLS 1.2; encryption at rest on by default
  (CMK if required).

## Cost levers
- Billed like Blob: **stored GB per tier + transactions + egress + early-deletion/rehydration**. Levers:
  **lifecycle** rules to tier raw/bronze data to cool/cold/archive and expire intermediates, compact small
  files (analytics engines suffer on many tiny files), choose the cheapest adequate redundancy, and keep hot
  curated/gold data on hot tier only.

## Scaling and limits
- Scales to **petabytes** at high parallel throughput for analytics. Limits: **HNS cannot be enabled/disabled
  after creation** (recreate + migrate), **archive** tier requires hours-long rehydration, some legacy Blob
  features differ under HNS, **ACL evaluation cost** grows with deep trees, and small-file workloads hurt
  performance. Account name is globally unique/immutable.

## Operating procedure
1. **Provision** — create the **StorageV2 account with HNS enabled** and the **filesystem(s)** via Terraform
   `azurerm_storage_account` (`is_hns_enabled = true`) + `azurerm_storage_data_lake_gen2_filesystem`, Bicep
   `Microsoft.Storage/storageAccounts` (`isHnsEnabled`), or `az storage account create --enable-hierarchical-
   namespace true` + `az storage fs create`.
2. **Configure** — lay out **zone directories** (bronze/silver/gold), set **access + default ACLs**
   (`azurerm_storage_data_lake_gen2_path` / `az storage fs access set`), and apply **lifecycle** rules.
3. **Secure** — assign **Entra RBAC** to a **managed identity** + group-based **ACLs**, disable shared-key
   auth, enforce HTTPS-only/TLS 1.2, add a **private endpoint** + default-deny firewall, and configure CMK if
   required.
4. **Verify** — apply [[verify-by-running]]: confirm `provisioningState`/`isHnsEnabled` (`az storage account
   show`), then **create a directory, upload and read a file** (`az storage fs directory create` → `az storage
   fs file upload`/`download`) and confirm the round-trip. Capture state and result.

## Inputs
The analytics engines (Synapse/Databricks/Fabric), data domains and zones (filesystem/directory layout),
access-control granularity (RBAC vs ACLs, groups), tiering/retention (lifecycle), durability/DR (redundancy),
network exposure (private endpoint), encryption (CMK), and region.

## Output
An ADLS Gen2 setup: a StorageV2 account with HNS, zoned filesystems/directories, RBAC + inherited POSIX ACLs,
tiering/lifecycle, secured by Entra/managed identity, HTTPS-only and private networking — plus verification
that directory/file operations work.

## Notes
- Gotchas: **HNS must be set at create time** and cannot be turned off; **archive** reads need hours-long
  rehydration; **small-file** sprawl kills analytics performance (compact); **ACLs + RBAC are evaluated
  together** — assign ACLs to **groups** not users to stay manageable; **shared-key/account-key SAS** is the
  top over-exposure risk; the `dfs` vs `blob` endpoint distinction trips up tooling. 2nd consumer: the Azure
  role team (azure-iac-engineer / azure-cloud-architect / azure-data-engineer). Cross-cloud peers: AWS S3 +
  Lake Formation, GCP Cloud Storage.
- IaC/CLI: Terraform `azurerm_storage_account` (`is_hns_enabled`) +
  `azurerm_storage_data_lake_gen2_filesystem` / `..._path`; Bicep/ARM `Microsoft.Storage/storageAccounts`
  (`isHnsEnabled`). CLI `az storage fs create` / `az storage fs directory create` / `az storage fs file
  upload`/`download` / `az storage fs access set`.
