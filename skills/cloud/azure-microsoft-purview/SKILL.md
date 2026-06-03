---
name: azure-microsoft-purview
description: Use when designing, provisioning, securing, or operating Microsoft Purview — the unified data-governance platform for cataloging, classifying, and tracking lineage across hybrid and multi-cloud data estates (Microsoft Purview). Covers the Purview account and the unified Data Map, collections (the governance hierarchy + scoped RBAC), data sources and scanning (scan rule sets, scheduled scans, self-hosted integration runtime for private sources), classification and sensitivity labels, the Data Catalog and business glossary, and end-to-end data lineage. Loads the knowledge: create the account, register sources and run scans, organize collections, configure classification/labels and lineage, secure with Entra/managed identity, and verify a scan and catalog search. Consumed by the microsoft-purview specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Microsoft Purview).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-microsoft-purview, analytics, data-governance, catalog]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Purview

The unified **data-governance** platform — catalog, classify, and track **lineage** across hybrid/multi-cloud
data estates. This skill owns the **Azure managed-service layer** — the account, Data Map, collections,
scanning, classification, catalog, and lineage — and verifying a scan and catalog search; it defers
**cloud-agnostic governance policy/data-modeling intent** to the data engine teams.

## Core concepts and components
- **Purview account** — the top-level resource (`azurerm_purview_account`) hosting the governance portal and
  the unified **Data Map**.
- **Data Map** — the metadata graph of assets, classifications, and lineage built by scanning registered
  sources; the foundation everything else queries.
- **Collections** — the hierarchical **governance + RBAC** boundary; sources, scans, and role assignments
  (Collection Admin / Data Source Admin / Data Curator / Data Reader) are scoped to a collection.
- **Data sources & scanning** — register sources (Azure Storage/SQL/Synapse, Power BI, AWS S3, on-prem) and
  run **scans** using **scan rule sets**; a **self-hosted integration runtime (SHIR)** reaches private/on-prem
  sources; scans extract schema, classify, and capture lineage.
- **Classification & sensitivity labels** — system + custom **classifiers** tag columns (PII, credit card,
  etc.); Microsoft Information Protection **sensitivity labels** flow in.
- **Data Catalog & glossary** — searchable **catalog** of assets enriched with a **business glossary**
  (terms/definitions) and owners.
- **Lineage** — end-to-end **column/asset lineage** from sources through ADF/Synapse/Spark transforms to sinks.

## Configuration and sizing
- Create the **account**, design the **collection hierarchy** (mirrors org/governance boundaries), **register
  sources** and configure **scan rule sets** + schedules, deploy a **SHIR** for private sources, enable
  **classification**/labels, and populate the **glossary**. Sizing is capacity-unit / metered, not VM-shaped.

## Security and IAM
- **Entra ID** auth + **collection-scoped RBAC** (Collection Admin/Data Source Admin/Data Curator/Data
  Reader); use the account's **managed identity** (or a credential in Key Vault) for scanning sources; reach
  private sources via **SHIR** and **private endpoints**. Grant least-privilege at the collection level.

## Cost levers
- Billing = **Data Map capacity units** (metered by stored metadata/operations) + **scan vCore-hours** +
  resource-set/advanced features. Levers: **scope scans** to relevant assets and schedule them sensibly
  (avoid scanning everything daily), prune stale assets, and limit advanced features to where they add value.

## Scaling and limits
- The Data Map auto-scales **capacity units** with metadata volume. Limits: large estates inflate capacity
  cost; scans of huge sources consume vCore-hours; **SHIR** is customer-managed (plan HA nodes); some sources/
  classifiers are preview/limited; classic Azure Purview vs the unified Microsoft Purview portal differ.

## Operating procedure
1. **Provision** — create the **account** via Terraform `azurerm_purview_account`, Bicep
   `Microsoft.Purview/accounts`, or `az purview account create`.
2. **Configure** — build the **collection hierarchy**, **register sources**, configure **scan rule sets** +
   schedules (deploy a **SHIR** for private/on-prem), enable **classification**/labels, and seed the
   **glossary**.
3. **Secure** — assign **collection-scoped RBAC**, use the **managed identity**/Key Vault credentials for
   scanning, and add **private endpoints**/SHIR for private sources.
4. **Verify** — apply [[verify-by-running]]: confirm the account provisioned (`az purview account show`), run
   a **scan** and confirm it completes, then **search the catalog** for a scanned asset and confirm
   classification + **lineage** appear. Capture result.

## Inputs
The data estate to govern (Azure/multi-cloud/on-prem sources), collection/governance hierarchy, scan scope +
schedule, classification/label needs, glossary terms/owners, lineage sources (ADF/Synapse/Spark), connectivity
(SHIR/private endpoints), security posture (managed identity, collection RBAC), and region.

## Output
A Microsoft Purview setup: an account with a collection hierarchy, registered sources with scoped scan rule
sets + schedules (SHIR for private), classification/labels, a populated catalog + glossary, lineage, and
managed-identity + collection-scoped RBAC + private networking — plus verification that a scan completes and
the asset is discoverable with lineage.

## Notes
- Gotchas: **collections drive RBAC** — design the hierarchy before granting access; scanning **everything**
  inflates capacity + vCore cost (scope it); **SHIR** is customer-managed for private sources; **lineage**
  only appears for supported sources/processors; classic Azure Purview vs unified Microsoft Purview portal
  differ. **Cloud-agnostic governance policy and data-modeling intent are the data team's job** — defer to
  data/etl-architect. 2nd consumer: the Azure role team (azure-cloud-architect / azure-iac-engineer /
  azure-security-reviewer). Cross-cloud peers: AWS Glue Data Catalog + Lake Formation, GCP Dataplex/Data
  Catalog.
- IaC/CLI: Terraform `azurerm_purview_account`; Bicep/ARM `Microsoft.Purview/accounts`. CLI `az purview
  account create` (data-plane scans/collections via the governance portal/REST/SDK).
