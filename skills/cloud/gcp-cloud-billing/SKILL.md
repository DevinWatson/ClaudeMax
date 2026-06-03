---
name: gcp-cloud-billing
description: Use when designing, provisioning, securing, or operating Cloud Billing — Google Cloud's account-level billing, budgeting, and cost-management system (Cloud Billing). Covers billing accounts (self-serve vs invoiced) and project-to-account links, budgets and threshold alerts (with Pub/Sub for programmatic responses), Cloud Billing data and pricing exports to BigQuery, cost breakdown by project/service/SKU/label, committed-use and sustained-use discounts, credits, billing IAM roles, and quota/limits. Loads the Cloud Billing knowledge: link projects, set budgets/alerts, export to BigQuery, analyze cost, and verify. Consumed by the Cloud Billing specialist and by the GCP role team (gcp-cloud-architect / gcp-iac-engineer) when standing up billing and cost governance (Cloud Billing).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-billing, management, cost, budgets, finops, bigquery-export]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Billing

Google Cloud's **account-level billing, budgeting, and cost-management** system. It defines **who pays**
(the billing account), tracks spend across linked projects, and provides budgets, alerts, and detailed
cost data so teams can govern and forecast cloud spend.

## Core concepts and components
- **Billing accounts** — the payment entity. **Self-serve** (credit card / automatic) or **invoiced**
  (offline billing). A billing account pays for one or more **projects**; a project links to exactly one
  billing account at a time.
- **Project ↔ billing-account link** — projects must be linked to an open billing account to use paid
  services; unlinking stops billable usage. Managed under the organization for centralized control.
- **Budgets and alerts** — a **budget** (amount or by-spend) with **threshold rules** (e.g. 50/90/100%)
  that fire email alerts and, via a **Pub/Sub topic**, programmatic notifications for automated responses
  (cap spend, notify Slack). Budgets are a monitoring control, not a hard cap.
- **Billing data export to BigQuery** — **standard usage cost**, **detailed usage cost**, and **pricing**
  exports stream billing data into BigQuery for SQL analysis, dashboards (Looker Studio), and chargeback.
- **Cost breakdown** — analyze by **project / service / SKU / label / location**; **labels** drive cost
  allocation and chargeback/showback.
- **Discounts and credits** — **committed-use discounts (CUDs)**, **sustained-use discounts (SUDs)**,
  promotional credits, and how they apply across the account.

## Configuration and sizing
- Decide the **billing-account topology** (one account vs per-business-unit), link projects appropriately,
  and standardize **labels** for allocation. Set **budgets** per project/account with threshold rules and
  a **Pub/Sub** topic for automation. Turn on **BigQuery export** (detailed + pricing) early — it cannot
  backfill history. Plan **CUDs** for steady-state baseline usage.

## Security and IAM
- Billing IAM is **org/account-scoped and privileged**: `roles/billing.admin`,
  `roles/billing.user` (link projects), `roles/billing.creator`, `roles/billing.viewer`, and
  `roles/billing.costsManager` (budgets/exports). Grant to **groups**, separate **who can link/unlink
  projects** from cost viewers, and restrict billing-account admin tightly — linking a project to the
  wrong account or unlinking it is high-impact. Budget-alert Pub/Sub topics should have least-privilege
  subscribers.

## Cost levers
- Cloud Billing itself is free; it is the **lever for everything else**. Use **budgets + alerts** to catch
  overruns, **BigQuery export + cost breakdown** to find waste, **labels** for accountability, and
  **CUDs/SUDs/credits** to cut rate. Automate responses via the **budget Pub/Sub** topic.

## Scaling and limits
- Limits on **budgets per billing account**, projects per account, and export dataset size apply. BigQuery
  **export latency** is hours, not real-time; budget alerts are **delayed** (not instantaneous spend caps).
  Pricing/SKU data is large — partition and query exports efficiently. A project links to **one** billing
  account at a time.

## Operating procedure
1. **Provision** — confirm the **billing account** and **organization** structure; **link** the target
   projects to the billing account (Terraform `google_billing_account` data source +
   `google_project` `billing_account`).
2. **Configure** — create **budgets** with threshold rules and a **Pub/Sub** topic
   (`google_billing_budget`), enable **BigQuery billing export** (detailed usage + pricing), and
   standardize **labels** for allocation.
3. **Secure** — assign least-privilege **billing.* IAM** to groups, separate project-linking from cost
   viewing, and lock down the export dataset and budget Pub/Sub subscribers.
4. **Verify** — apply [[verify-by-running]]: confirm the project is **linked**
   (`gcloud billing projects describe`), confirm the **budget** exists and a threshold notification reaches
   the **Pub/Sub** topic (publish/trigger and read a message), and run a **BigQuery query** over the
   export to confirm cost rows land and break down by service/label. Capture the link status, the budget
   alert, and the export query result.

## Inputs
The org/billing-account topology, which projects link where, the budget amounts and threshold rules,
whether alerts must drive automation (Pub/Sub), labeling/allocation needs, BigQuery export requirements,
and any CUD/credit decisions.

## Output
Linked projects, budgets with threshold alerts (and Pub/Sub automation where needed), a BigQuery billing
export with a cost-breakdown query, least-privilege billing IAM and labels, plus verification of the
project link, a budget alert reaching Pub/Sub, and the export query returning cost data.

## Notes
- Gotchas: **BigQuery export does not backfill** — enable it early; **budgets are alerts, not hard caps**
  (use Pub/Sub automation to act); a project links to **one** billing account, and unlinking stops billable
  usage instantly; billing IAM is **privileged and org-scoped** — linking to the wrong account is
  high-impact; export and alerts are **delayed by hours**, not real-time. This is account-level FinOps,
  distinct from per-service cost tuning. 2nd consumer: the GCP role team (gcp-cloud-architect /
  gcp-iac-engineer) standing up cost governance. Cross-cloud peers: AWS Billing/Cost Management, Azure
  Cost Management.
- IaC/CLI: Terraform `google_billing_budget`, `google_billing_account` (data), `google_project`
  `billing_account`, `google_billing_account_iam_member`, and a `google_bigquery_dataset` for the export.
  CLI `gcloud billing accounts/projects`, `gcloud billing budgets`, and `bq query` over the billing export
  dataset to verify cost data.
