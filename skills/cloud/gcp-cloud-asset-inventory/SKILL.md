---
name: gcp-cloud-asset-inventory
description: Use when designing, provisioning, securing, or operating Cloud Asset Inventory — Google Cloud's metadata service that tracks resources and IAM policies across the org/folder/project hierarchy over time. Covers asset types and the resource/IAM-policy/org-policy/access-policy content types, point-in-time and historical exports to BigQuery/Cloud Storage, real-time change feeds to Pub/Sub, the searchAllResources/searchAllIamPolicies query surface, and analyzeIamPolicy/analyzeMove analysis, plus the asset-feed/export IAM and quotas. Loads the Cloud Asset Inventory knowledge: enable the API at the right scope, choose feeds vs exports, query inventory, and verify the metadata flows. Consumed by the Cloud Asset Inventory specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when inventorying or auditing resources (Cloud Asset Inventory).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-asset-inventory, security, governance, asset-metadata, audit, exports]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Asset Inventory

Google Cloud's resource metadata service. It maintains a time-series inventory of **assets** —
resource configurations, IAM policies, org policies, and access-context policies — across the
**org → folder → project** hierarchy, and lets you snapshot, export, query, watch, and analyze them.
It is the backbone for governance, drift detection, and security posture.

## Core concepts and components
- **Asset** — a Google Cloud resource (e.g. `compute.googleapis.com/Instance`) plus its metadata.
  Identified by an **asset type** and a full resource name.
- **Content types** — `RESOURCE` (config), `IAM_POLICY`, `ORG_POLICY`, `ACCESS_POLICY`, and
  `OS_INVENTORY` / `RELATIONSHIP`. Most queries and exports pick one content type.
- **Exports** — point-in-time **snapshot** of all assets at an org/folder/project to **BigQuery**
  (table per type, or a single table) or **Cloud Storage** (JSON/newline). The basis for SQL audits.
- **Feeds** — real-time **change notifications** to a **Pub/Sub** topic when matching assets change;
  filtered by asset types/names and an optional condition (CEL). Enables drift/event automation.
- **Search** — `searchAllResources` and `searchAllIamPolicies` over the indexed inventory with a
  query language (e.g. `state:RUNNING`, `policy:roles/owner`).
- **Analysis** — `analyzeIamPolicy` (who can access what), `analyzeMove` (pre-flight a folder/project
  move), `analyzeOrgPolicies`, and effective-policy queries.
- **History** — query an asset's configuration at a past timestamp or over a window.

## Configuration and sizing
- Choose **scope** (organization, folder, or project) — org scope gives full coverage but requires
  org-level permission. Use **BigQuery exports** for ad-hoc SQL audits and dashboards; use **feeds**
  for low-latency reaction. Filter feeds by asset type/condition to limit Pub/Sub volume. Schedule
  recurring exports (via Scheduler/Workflows) since exports are on-demand snapshots, not continuous.

## Security and IAM
- Grant `roles/cloudasset.viewer` for read/search/export and `roles/cloudasset.owner` to manage feeds.
  Inventory **contains IAM-policy data** — treat exports/feeds as sensitive; lock down the BigQuery
  dataset / Cloud Storage bucket and the Pub/Sub topic. Run feed/export jobs under a dedicated, least-
  privilege **service account**, not a user. Org-scope queries reveal cross-project posture — restrict.

## Cost levers
- The API/search is effectively free at modest volume; cost accrues in **destinations** — BigQuery
  storage + query of exported tables, Cloud Storage of export files, and Pub/Sub of feed messages.
  Limit feed scope and export frequency; partition/expire BigQuery export tables.

## Scaling and limits
- Search/export are subject to per-project **quotas** (requests/min) and BigQuery export size limits.
  Feeds have a cap per scope and best-effort, **at-least-once** delivery (handle duplicates). Exports
  are snapshots — there is **no streaming export**; combine periodic exports with feeds for freshness.

## Operating procedure
1. **Provision** — enable `cloudasset.googleapis.com` at the target scope; create the export
   destination (BigQuery dataset or Cloud Storage bucket) and/or the Pub/Sub topic for feeds; create a
   least-privilege service account with `cloudasset.viewer`/`owner`.
2. **Configure** — define the **export** (content type, asset-type filter, destination) and/or the
   **feed** (asset types/names, condition, Pub/Sub topic) via Terraform `google_cloud_asset_*`; set up
   recurring export scheduling if needed.
3. **Secure** — restrict the destination dataset/bucket/topic and the feed service account; ensure
   IAM-policy content is only visible to authorized auditors; scope feeds to needed asset types.
4. **Verify** — apply [[verify-by-running]]: run `gcloud asset search-all-resources`/
   `search-all-iam-policies` and confirm expected assets appear; trigger a tracked change and confirm a
   **feed message lands on the Pub/Sub topic**; run an **export** and query the resulting BigQuery table
   / read the Cloud Storage object; run `gcloud asset analyze-iam-policy` for an access question.
   Capture the search output, the feed message, and the export query result.

## Inputs
The scope (org/folder/project), which asset/content types matter, whether you need point-in-time SQL
(export) vs real-time reaction (feed), destinations, audit/governance questions to answer, and the
service-account/permission constraints.

## Output
A configured inventory pipeline (exports to BigQuery/Cloud Storage and/or feeds to Pub/Sub) at the
right scope with least-privilege access, plus verification that search returns expected assets, a feed
message fires on change, and an export/analysis query returns the intended data.

## Notes
- Gotchas: **exports are snapshots, not continuous** — pair with feeds for freshness; feeds are
  **at-least-once** (dedupe); org-scope operations need **org-level** permission and a service account,
  not just project owner; exported **IAM-policy data is sensitive** — secure the destination; search
  indexes are **eventually consistent** (a brand-new resource may lag); `analyzeIamPolicy` can be slow
  at org scope. 2nd consumer: the GCP role team uses this for posture/audit, not just the specialist.
- IaC/CLI: Terraform `google_cloud_asset_organization_feed` / `google_cloud_asset_folder_feed` /
  `google_cloud_asset_project_feed`, and BigQuery/Storage/Pub/Sub resources for destinations. CLI
  `gcloud asset search-all-resources`, `gcloud asset search-all-iam-policies`,
  `gcloud asset export`, `gcloud asset feeds create`, and `gcloud asset analyze-iam-policy` /
  `analyze-move` to query and verify.
