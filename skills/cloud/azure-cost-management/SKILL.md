---
name: azure-cost-management
description: Use when designing, configuring, or operating Microsoft Cost Management — the native Azure service for analyzing, allocating, budgeting, and alerting on cloud spend across subscriptions, resource groups, and management groups (Microsoft Cost Management). Covers cost analysis views/dimensions, budgets with action-group alerts, scheduled exports to storage, cost allocation rules and tag-based showback/chargeback, anomaly alerts, and Reservation/Savings Plan recommendations. Loads the knowledge to stand up budgets + alerts, wire scheduled exports, model cost allocation, and verify spend reporting. Consumed by the azure-cost-management specialist and by the Azure role team (azure-cost-governor / azure-cloud-architect / azure-iac-engineer) when operating the managed service (Microsoft Cost Management).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-cost-management, management-governance, finops, budgets]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Cost Management

**Microsoft Cost Management** is the native Azure service for **analyzing, allocating, budgeting, and alerting**
on cloud spend. This skill owns the **single-service cost layer** — cost analysis, budgets + alerts, scheduled
exports, and cost allocation — for one billing scope (subscription / resource group / management group).

## Core concepts and components
- **Cost analysis** — interactive views over **actual** and **amortized** cost, sliced by **dimensions**
  (service, resource group, tag, location, meter) and grouped/granularized (daily/monthly); the basis for
  showback dashboards.
- **Budgets** — spend thresholds at a scope with **forecasted** and **actual** triggers; on breach they fire an
  **action group** (email/SMS/webhook/Logic App) and optional automation.
- **Cost alerts** — **budget alerts**, **credit/quota alerts**, and **anomaly alerts** that detect unexpected
  daily spend changes.
- **Exports** — scheduled **daily/monthly/one-time** exports of cost + usage (and the new FOCUS/Cost-and-usage
  details) to a **storage account** for downstream FinOps tooling/warehousing.
- **Cost allocation** — rules that split **shared costs** (e.g. shared services, tax) across subscriptions/RGs/tags
  for **chargeback/showback**.
- **Commitment recommendations** — **Reservation** and **Savings Plan** recommendations surfaced from usage.

## Configuration and sizing
- Pick the **billing scope** (management group for org-wide, subscription/RG for a team), set **budgets** with
  forecast + actual thresholds, enable **anomaly alerts**, wire a **scheduled export** to a dedicated storage
  account, and define **allocation rules** + a consistent **tagging** standard. There is no instance to size —
  scale is governed by scope breadth and export volume.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Cost Management Reader / Contributor**, **Billing Reader** at
  billing-account scope. Exports write with the storage account's access model — prefer **managed identity** to
  the storage account and restrict the container. Budget action groups that call services should use **managed
  identities**, not stored secrets.

## Cost levers
- The service itself is **free**; it is the tool that drives savings: act on **Reservation/Savings Plan**
  recommendations, enforce **budgets + anomaly alerts** to catch runaway spend early, use **tag-based allocation**
  to make teams accountable, and right-size from cost-analysis findings (often paired with **azure-advisor**).

## Scaling and limits
- Cost/usage data has **ingestion latency** (typically up to ~8-24h; amortized/actual reconcile over the month);
  budgets evaluate periodically (not real-time); exports are **daily/monthly** cadence; large management-group
  scopes can be slow to query. Anomaly detection needs a baseline history. Plan scope hierarchy deliberately.

## Operating procedure
1. **Provision** — create budgets/exports via Terraform `azurerm_consumption_budget_subscription` /
   `azurerm_consumption_budget_resource_group`, Bicep `Microsoft.Consumption/budgets`, or
   `az consumption budget create`; create the export with `az costmanagement export create`.
2. **Configure** — set forecast + actual budget thresholds, enable **anomaly alerts**, define **cost allocation
   rules** and the tagging standard, and build **cost analysis** saved views for showback.
3. **Secure** — scope **Cost Management RBAC**, give exports/action groups **managed identities**, lock down the
   export storage container.
4. **Verify** — apply [[verify-by-running]]: query spend (`az consumption usage list` /
   `az costmanagement query`), confirm the **export** wrote files to storage, and confirm a **budget alert**
   path notifies (e.g. inspect the action group). Capture state and result.

## Inputs
The **billing scope** (management group / subscription / RG), the **budget** thresholds + notification targets,
the **export** destination + cadence, the **tagging/allocation** model, and the RBAC assignments.

## Output
A Cost Management setup: budgets with forecast/actual alerts wired to action groups, anomaly alerts, a scheduled
export to storage, cost allocation rules + tagging standard, scoped RBAC and managed-identity access — plus
verification that spend reports query, the export wrote, and an alert path notifies.

## Notes
- Gotchas: cost data has **latency** and **actual vs amortized** differ (reservations/savings plans amortize);
  budgets **do not stop spend**, they alert — pair with automation/policy; exports overwrite vs append depends on
  cadence; cross-tenant/EA scopes need the right billing role. 2nd consumer: the Azure role team
  (azure-cost-governor / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS Cost Explorer +
  Budgets, GCP Cloud Billing.
- IaC/CLI: Terraform `azurerm_consumption_budget_subscription`, `azurerm_consumption_budget_resource_group`,
  `azurerm_consumption_budget_management_group`; Bicep/ARM `Microsoft.Consumption/budgets`,
  `Microsoft.CostManagement/exports`. CLI `az consumption ...`, `az costmanagement ...`.
