---
name: azure-files
description: Use when designing, provisioning, securing, or operating Azure Files — Azure's fully managed file shares accessible over SMB and NFS in a storage account (Azure Files). Covers the tiers (Premium FileStorage on SSD vs Standard transaction-optimized/hot/cool on HDD), SMB vs NFS 4.1 protocols, identity-based SMB auth (Entra ID Kerberos / on-prem AD DS / Entra Domain Services) and NTFS ACLs, Azure File Sync (cloud tiering to on-prem caches), snapshots and soft delete, large file shares, private endpoints and the network model, and CMK encryption. Loads the knowledge: pick a tier and protocol, size the share, configure sync/snapshots, provision, secure, and verify a mount read/write. Consumed by the azure-files specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Files).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-files, storage, file-share, smb, nfs]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Files

Azure's **fully managed file shares** accessible via **SMB** and **NFS**, mountable concurrently by cloud
VMs and on-prem clients, hosted in a **storage account**. Azure manages the file servers and durability; you
own the **account/share configuration**, **tier/protocol**, **identity-based access**, **sync/snapshots**,
and **networking**. This skill owns the **managed-service layer** for shared file storage.

## Core concepts and components
- **Share tiers** — **Premium (FileStorage account, SSD)**: provisioned-capacity, low-latency, supports SMB
  and NFS. **Standard (StorageV2, HDD)**: pay-as-you-go in **transaction-optimized / hot / cool** tiers,
  SMB only.
- **Protocols** — **SMB 3.x** (Windows/Linux/macOS, supports identity-based auth + encryption in transit)
  and **NFS 4.1** (Linux, Premium only; uses network-based security, no identity auth).
- **Identity-based SMB auth** — **Entra ID Kerberos** (cloud identities), **on-prem AD DS**, or **Entra
  Domain Services**, enforced with **NTFS ACLs** at the file/folder level (plus share-level Azure RBAC). NFS
  uses host/network-based access, not identity.
- **Azure File Sync** — syncs an SMB share to on-prem **Windows Server** caches with **cloud tiering** (hot
  data local, cold in the cloud) for branch/hybrid scenarios; centralizes data in Azure.
- **Data protection** — **share snapshots** (point-in-time) and **soft delete** for shares; backup via Azure
  Backup.
- **Capacity** — **large file shares** (up to 100 TiB); Premium provisions capacity/IOPS/throughput, Standard
  scales pay-as-you-go.

## Configuration and sizing
- Choose **Premium FileStorage** (low-latency/NFS/high-IOPS, provision capacity) or **Standard** (cost-
  optimized SMB, transaction-optimized/hot/cool) by latency and access pattern. Pick **SMB** (with identity
  auth) or **NFS 4.1** (Premium, network security). Enable **large file shares**, configure **snapshots** +
  **soft delete**, and set up **Azure File Sync** with cloud tiering for hybrid/branch caching.

## Security and IAM
- For **SMB**, use **identity-based auth** (Entra ID Kerberos / AD DS / Entra DS) with **NTFS ACLs** for
  file-level permissions plus **Azure RBAC** for share-level access; avoid relying on the storage account
  key. For **NFS**, restrict to a **VNet via private endpoint/service endpoint** (no identity layer). Use
  **private endpoints** and default-deny firewall, enforce **encryption in transit** (SMB 3.x), and add
  **CMK** in Key Vault if required.

## Cost levers
- Premium bills on **provisioned capacity** (+ optional IOPS/throughput bursting); Standard bills on **used
  storage + transactions** per tier. Levers: pick the cheapest adequate **tier** (cool/hot/transaction-
  optimized for Standard), right-size Premium provisioning, use **Azure File Sync cloud tiering** to keep
  only hot data on expensive caches, and snapshot retention discipline.

## Scaling and limits
- Premium scales by **re-provisioning capacity** (IOPS/throughput scale with size, with bursting); Standard
  scales pay-as-you-go up to **100 TiB** (large file shares must be enabled). Limits: max share size,
  per-share IOPS/throughput, NFS only on Premium, identity auth only on SMB, and protocol is fixed per share.
  Open-handle/file-lock limits apply per share.

## Operating procedure
1. **Provision** — create the **storage account** (FileStorage Premium or StorageV2 Standard) and the
   **file share** (size, tier, protocol) via Terraform `azurerm_storage_account` +
   `azurerm_storage_share` or Bicep `Microsoft.Storage/storageAccounts` (+ `/fileServices/shares`), or `az
   storage account create` / `az storage share-rm create`.
2. **Configure** — enable **large file shares**, set **snapshots** + **soft delete**, and deploy **Azure
   File Sync** (Storage Sync Service + server endpoints + cloud tiering) if hybrid caching is needed.
3. **Secure** — for SMB enable **identity-based auth** (Entra Kerberos/AD DS) and set **NTFS ACLs** + share
   **RBAC**; for NFS lock to a **VNet via private endpoint**; enforce encryption in transit, add a
   **private endpoint**/default-deny firewall, and configure **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the share exists and the account is `Succeeded` (`az
   storage share-rm show`), then **mount and read/write** (SMB: `net use`/`mount -t cifs`; NFS: `mount -t
   nfs ...:/<account>/<share>`) and create/read a test file. Capture state and the mount result.

## Inputs
The workload (OS clients, latency, IOPS), protocol choice (SMB vs NFS), tier choice (Premium vs Standard
hot/cool), identity model (Entra Kerberos/AD DS for SMB), hybrid/branch caching needs (Azure File Sync),
snapshot/protection requirements, network exposure (private endpoint/VNet), encryption (CMK), and region(s).

## Output
An Azure Files setup: a storage account + file share at the chosen tier/protocol/size, snapshots + soft
delete (and Azure File Sync if hybrid), secured by identity-based SMB auth + NTFS ACLs (or VNet-locked NFS),
private networking and CMK — plus verification that a client can mount and read/write the share.

## Notes
- Gotchas: **NFS is Premium-only** and uses **network-based security** (no identity ACLs); **identity auth is
  SMB-only** and requires domain setup; **protocol is fixed per share**; outbound SMB (port 445) is often
  blocked by ISPs/firewalls — a top mount failure; large file shares (100 TiB) must be **enabled**;
  Azure File Sync **cloud tiering** can surprise users when cold files recall on access. 2nd consumer: the
  Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS EFS (NFS) / FSx, GCP
  Filestore.
- IaC/CLI: Terraform `azurerm_storage_account` + `azurerm_storage_share` (+ Azure File Sync resources
  `azurerm_storage_sync` / `_storage_sync_group` / `_storage_sync_cloud_endpoint`); Bicep/ARM
  `Microsoft.Storage/storageAccounts` (+ `/fileServices/shares`). CLI `az storage share-rm create` / `...
  show`; verify with `mount -t cifs`/`mount -t nfs`.
