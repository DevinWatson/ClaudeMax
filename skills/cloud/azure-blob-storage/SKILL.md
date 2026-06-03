---
name: azure-blob-storage
description: Use when designing, provisioning, securing, or operating Azure Blob Storage — Azure's massively scalable object storage in a storage account (Azure Blob Storage). Covers storage account kinds/SKUs and redundancy (LRS/ZRS/GRS/GZRS/RA-GRS), containers and the three blob types (block/append/page), access tiers (hot/cool/cold/archive) and rehydration, lifecycle management, immutability (WORM/legal hold), versioning/soft delete/change feed, blob index tags, Entra ID/RBAC vs account keys, SAS (user-delegation/service/account), managed identities, private endpoints, and CMK encryption. Loads the knowledge: pick an account SKU/redundancy and tiers, configure lifecycle and protection, provision, secure, and verify uploads/downloads work. Consumed by the azure-blob-storage specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Blob Storage).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-blob-storage, storage, object-storage, blob, lifecycle]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Blob Storage

Azure's **massively scalable object storage** for unstructured data (documents, media, backups, logs, data
lakes), exposed through a **storage account**. Azure manages durability and replication; you own the
**account configuration**, **containers**, **blob/tiering strategy**, **lifecycle**, **data protection**,
and **access**. This skill owns the **managed-service layer** — account SKU/redundancy, tiers, lifecycle,
protection, and auth.

## Core concepts and components
- **Storage account** — the namespace (`https://<account>.blob.core.windows.net`). Kind **StorageV2
  (general-purpose v2)** is standard; **Premium BlockBlob** for high-transaction/low-latency. Enable
  **Hierarchical Namespace (ADLS Gen2)** for data-lake/filesystem semantics.
- **Redundancy** — **LRS** (in-DC), **ZRS** (zone-redundant), **GRS/RA-GRS** (geo, secondary region; RA =
  readable secondary), **GZRS/RA-GZRS** (zone + geo).
- **Containers & blobs** — containers hold blobs; **block blobs** (files/objects, the common case),
  **append blobs** (logging), **page blobs** (random-access, e.g. VHDs).
- **Access tiers** — **hot** (frequent), **cool** (≥30 days), **cold** (≥90 days), **archive** (offline,
  cheapest; requires **rehydration** to read, hours of latency). Set per-account default and per-blob.
- **Lifecycle management** — rules to transition tiers and expire/delete blobs by age/last-access.
- **Data protection** — **versioning**, **soft delete** (blobs/containers), **change feed**, **point-in-time
  restore**, and **immutability** (time-based retention / legal hold = WORM).
- **Index tags & metadata** — searchable **blob index tags** for filtering at scale.

## Configuration and sizing
- Choose the **account kind/SKU** (StorageV2 standard, Premium BlockBlob for hot/low-latency) and
  **redundancy** (ZRS for in-region HA, GZRS/RA-GRS for geo-DR). Set the **default access tier** and per-blob
  tiers by access pattern, define **lifecycle rules** to auto-tier/expire, and enable **HNS** for data-lake
  workloads. Turn on **versioning + soft delete** (and PITR) for protection and **immutability** for
  compliance/WORM.

## Security and IAM
- Prefer **Microsoft Entra ID + Azure RBAC** (e.g. Storage Blob Data Reader/Contributor) with **managed
  identity** over **account keys**; **disable shared-key auth** and use **user-delegation SAS** (Entra-
  backed) rather than account-key SAS when temporary URLs are needed. Restrict network with **private
  endpoints** / firewall / VNet rules (default-deny public). Enforce **HTTPS-only** + min TLS 1.2. Encryption
  at rest is on by default; add **CMK** in Key Vault if required. Scope SAS/roles least-privilege and short-
  lived.

## Cost levers
- Billed on **stored GB per tier + operations (transactions) + data egress + early-deletion/rehydration**.
  Levers: **lifecycle rules** to move cold data to cool/cold/archive and expire it, choose the cheapest
  adequate **redundancy**, archive rarely-read data (mind rehydration latency/cost and min-retention
  charges), pick the tier matching access frequency, and avoid chatty small-object patterns (per-transaction
  cost).

## Scaling and limits
- Blob storage scales to **petabytes** with high throughput; per-account ingress/egress and IOPS targets
  apply (request a quota increase or shard across accounts at extreme scale). Limits: max blob size, archive
  rehydration latency (hours), **early-deletion charges** for cool/cold/archive moved before min retention,
  and immutability locks that cannot be shortened. Account name is globally unique and immutable.

## Operating procedure
1. **Provision** — create the **storage account** (kind/SKU/redundancy, HNS if needed) and **container(s)**
   via Terraform `azurerm_storage_account` + `azurerm_storage_container` or Bicep
   `Microsoft.Storage/storageAccounts` (+ `/blobServices/containers`), or `az storage account create` / `az
   storage container create`.
2. **Configure** — set the **default access tier**, **lifecycle management** rules, **versioning + soft
   delete** (+ PITR/change feed), and **immutability** policies as required.
3. **Secure** — assign **Entra RBAC** to a **managed identity**, disable shared-key auth, prefer
   **user-delegation SAS**, enforce **HTTPS-only/TLS 1.2**, add a **private endpoint** + default-deny
   firewall, and configure **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the account `provisioningState` is `Succeeded` (`az
   storage account show`), then **upload and download a blob** (`az storage blob upload` then `... download`,
   or SDK with managed identity) and confirm the round-trip. Capture state and the operation result.

## Inputs
The data type and access pattern (drives tiers/lifecycle), durability/DR requirement (redundancy), data-lake
vs object semantics (HNS), protection/compliance needs (versioning/soft delete/immutability), auth model
(Entra/managed identity vs SAS), network exposure (private endpoint), encryption (CMK), and region(s).

## Output
An Azure Blob Storage setup: a storage account at the chosen kind/SKU/redundancy with containers, the right
tiering + lifecycle rules, data protection (versioning/soft delete/immutability), secured by Entra RBAC/
managed identity, HTTPS-only, private networking and CMK — plus verification that uploads/downloads work.

## Notes
- Gotchas: **archive** blobs are offline and need hours-long **rehydration**; **early-deletion charges** hit
  cool/cold/archive moved before min retention; **shared-key/account-key SAS** is the top over-exposure risk
  — prefer Entra + user-delegation SAS; **immutability locks cannot be shortened**; account name is globally
  unique/immutable; redundancy changes (e.g. to GZRS) may require migration; HNS must be set at create time.
  2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS S3,
  GCP Cloud Storage.
- IaC/CLI: Terraform `azurerm_storage_account` + `azurerm_storage_container` (+
  `azurerm_storage_management_policy` for lifecycle); Bicep/ARM `Microsoft.Storage/storageAccounts`. CLI `az
  storage account create` / `az storage container create` / `az storage blob upload`/`download`.
