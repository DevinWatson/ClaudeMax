---
name: azure-data-box
description: Use when planning, ordering, securing, or operating an Azure Data Box — Azure's offline, physical bulk data-transfer appliance for moving terabytes-to-petabytes into (or out of) Azure when network transfer is too slow or expensive (Azure Data Box). Covers the device family — Data Box Disk (~8 TB SSDs), Data Box (~100 TB), and Data Box Heavy (~1 PB) — plus Data Box Gateway/Edge for online/streaming cases, the order → ship → copy (NFS/SMB/REST) → return → ingest workflow, AES-256 encryption and tamper-resistance, the target storage account/blob/file destination, secure erasure (NIST) after upload, RBAC on orders, and chain-of-custody. Loads the knowledge: pick the right device by data size + timeline, order, copy securely, and verify ingest into the storage account. Consumed by the azure-data-box specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect / azure-data-engineer) when running the managed service (Azure Data Box).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-data-box, storage, data-migration, offline-transfer]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Data Box

Azure's **offline, physical bulk data-transfer** service: Microsoft ships you a ruggedized, encrypted
appliance, you copy data onto it over your local network, ship it back, and Azure ingests it into a target
**storage account** — the fast, cheap path when copying **terabytes to petabytes** over the wire would take
weeks. Azure runs the device + ingest; you own **device selection**, the **copy**, **security/chain-of-
custody**, and the **destination**. This skill owns the **managed-service layer**.

## Core concepts and components
- **Device family** — **Data Box Disk** (set of SSDs, ~**8 TB** usable, small/edge transfers), **Data Box**
  (~**100 TB** usable rugged appliance, the common choice), **Data Box Heavy** (~**1 PB**, very large
  migrations). For ongoing/online transfer use **Data Box Gateway** or **Azure Stack Edge** (streaming, not
  offline).
- **Transfer direction** — **import** (on-prem → Azure, the usual case) or **export** (Azure → on-prem).
- **Copy protocols** — copy onto the device over **SMB / NFS / REST**; data lands as **blobs** or **Azure
  Files** in the target account.
- **Workflow** — **order** in the portal → device **shipped** → **copy** data locally → **return** ship →
  Azure **ingests** into the storage account → **secure erase**.
- **Security** — **AES-256** encryption at rest on the device, tamper-resistant/locked, **NIST 800-88**
  secure erasure after successful upload, and chain-of-custody tracking.

## Configuration and sizing
- Pick the device by **data size + timeline + network bandwidth**: Disk for <8 TB or seeding, Data Box for tens
  of TB to ~100 TB, Heavy for ~PB. Specify the **target storage account(s)** and whether data lands as blob or
  Azure Files, the **transfer direction**, and the shipping address/region. Order multiple devices in parallel
  for very large datasets.

## Security and IAM
- **Entra ID + Azure RBAC** controls who can **order/manage** Data Box and access the **target storage
  account**. The device is **AES-256 encrypted** with a passkey retrieved from the portal; copy over **SMB/NFS
  with credentials**; data lands using the account's auth (prefer **Entra RBAC/managed identity** on the
  destination, disable shared-key where possible). Microsoft performs **NIST secure erase** after upload;
  maintain **chain-of-custody** documentation for compliance.

## Cost levers
- Billed on a **per-device fee + shipping + days retained** (plus normal storage costs once ingested). Levers:
  pick the **smallest device** that fits the timeline, **return promptly** to avoid extra-day charges, batch
  the dataset to fill the device (don't order Heavy for 20 TB), and reserve online transfer (ExpressRoute/
  AzCopy) for data that fits your network window — Data Box wins only when the wire is too slow/expensive.

## Scaling and limits
- Scales from a few TB (Disk) to ~PB (Heavy), and parallel devices for more. Limits: **device capacity caps**,
  **regional availability** of each device type, **shipping/transit time** dominates the timeline (plan
  weeks), max file/blob sizes per destination, and you must **return within the free window** to avoid charges.
  Not for incremental/continuous sync — use Gateway/Edge or online tools for that.

## Operating procedure
1. **Order/Provision** — create the **Data Box order** (device type, target storage account, transfer
   direction, shipping) via the portal / `az databox job create` (Terraform coverage is limited — prefer
   `az`/portal), capture the tracking + return details.
2. **Copy** — when the device arrives, unlock with the **passkey**, mount **SMB/NFS** shares (or use REST/the
   data-copy tool), copy data, and **validate checksums** before shipping back.
3. **Secure** — keep the device **encrypted/locked**, document **chain-of-custody**, and ensure the
   destination account uses **Entra RBAC/managed identity** and least-privilege; confirm Microsoft's **NIST
   secure erase**.
4. **Verify** — apply [[verify-by-running]]: track the order to **Completed** (`az databox job show`), then
   confirm data landed by **listing the target container/share and reading a sample blob/file** (`az storage
   blob list` + `az storage blob download`) and validating counts/checksums against source. Capture state and
   result.

## Inputs
The dataset size + file count, available network bandwidth + deadline (device choice), source location/region,
target storage account(s) and landing format (blob vs Azure Files), import vs export, compliance/chain-of-
custody requirements, and destination auth model.

## Output
An Azure Data Box transfer: the right device ordered, data copied and validated on the appliance, returned and
ingested into the target storage account with secure erase and chain-of-custody — plus verification that the
expected data landed (counts/checksums match).

## Notes
- Gotchas: **shipping/transit time dominates** — plan in weeks, not days; **return within the free window** or
  pay per-day charges; **validate checksums** before return (you cannot re-copy once shipped); Data Box is
  **offline/one-shot**, not for continuous sync (use Gateway/Edge or AzCopy/ExpressRoute); ordering a device
  far larger than the dataset wastes money; destination must allow the chosen auth. **Terraform support is
  thin — prefer `az`/portal**. 2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect /
  azure-data-engineer). Cross-cloud peer: AWS Snow Family.
- IaC/CLI: CLI `az databox job create` / `az databox job show` (+ `az storage blob list`/`download` to verify
  ingest); portal-driven ordering. Bicep/ARM `Microsoft.DataBox/jobs`; Terraform coverage is limited.
