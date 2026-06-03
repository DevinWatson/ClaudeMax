---
name: azure-advisor
description: Use when reviewing, configuring, or operating Azure Advisor — the free personalized recommendation engine that analyzes your Azure usage and configuration and advises across cost, security, reliability, performance, and operational excellence (Azure Advisor). Covers the five recommendation categories, the Advisor score, recommendation digests + alerts, postponing/dismissing recommendations, configuration (rules/thresholds, subscription scope), and acting on guidance (right-sizing, reservations, redundancy, quotas). Loads the knowledge to surface recommendations, configure alerts/digests, and verify remediation. Consumed by the azure-advisor specialist and by the Azure role team (azure-cloud-architect / azure-cost-governor / azure-reliability-engineer) when operating the managed service (Azure Advisor).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-advisor, management-governance, recommendations, well-architected]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Advisor

**Azure Advisor** is the **free, personalized recommendation engine** that continuously analyzes your resource
configuration and telemetry and advises how to improve. This skill owns the **single-service Advisor layer** —
surfacing, configuring, alerting on, and acting on recommendations — for one subscription or scope.

## Core concepts and components
- **Five categories** — **Cost** (right-size/shutdown idle, buy reservations/savings plans), **Security**
  (surfaced from Microsoft Defender for Cloud), **Reliability** (formerly "high availability" — redundancy,
  backups, soft-delete), **Performance** (SKU/index/throughput tuning), and **Operational excellence** (best
  practices, deprecations, quotas).
- **Advisor score** — an aggregate 0-100 score per category measuring how closely your estate follows
  recommendations, with category sub-scores to prioritize.
- **Recommendation lifecycle** — each recommendation has an **impact** (High/Medium/Low), affected resources, and
  remediation; you can **act**, **postpone**, or **dismiss** it.
- **Alerts & digests** — **Advisor alerts** (via action groups) on new recommendations and recurring **digests**
  emailed to stakeholders.
- **Configuration** — scope to subscriptions/resource groups, **exclude** subscriptions, and tune certain rules
  (e.g. CPU thresholds for right-sizing) so guidance fits the workload.

## Configuration and sizing
- No infrastructure to size: choose the **subscription scope**, configure **right-sizing thresholds**, set up
  **alerts** + **digests** to the right owners, and establish a cadence to triage by **impact** and **score**.
  Advisor is read-only analysis; remediation happens on the target services.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Reader** sees recommendations; acting on them requires
  permissions on the **target resource**. Security recommendations flow from **Defender for Cloud** (needs the
  relevant plans enabled). Alert action groups that call services should use **managed identities**.

## Cost levers
- Advisor is **free** and is itself a primary **cost lever**: act on its **right-sizing**, **idle-resource**, and
  **reservation/savings-plan** recommendations. Pair with **Microsoft Cost Management** for budgeting/allocation
  and **Defender for Cloud** for the security feed.

## Scaling and limits
- Recommendations are **generated periodically** (not instant) and need **telemetry history** to be accurate
  (e.g. right-sizing looks at recent utilization); some categories depend on **Defender for Cloud** being
  enabled; recommendations are **advisory** — they don't auto-remediate. Scope/exclusions control noise across
  large estates.

## Operating procedure
1. **Provision/configure** — set Advisor **configuration** (right-sizing thresholds, subscription includes/
   excludes) via the portal / `az advisor configuration update`; enable **Defender for Cloud** plans for the
   security feed.
2. **Configure alerts** — create **Advisor recommendation alerts** wired to an **action group** and schedule
   **digests** to owners (`azurerm_monitor_action_group` + Advisor alert rule).
3. **Secure** — scope **Reader/owner RBAC**, give action groups **managed identities**.
4. **Verify** — apply [[verify-by-running]]: list current recommendations (`az advisor recommendation list`),
   triage by impact/category, act on a target (or **postpone/dismiss** with rationale), then re-list to confirm
   the recommendation cleared / score moved. Capture state and result.

## Inputs
The **subscription scope** + exclusions, the **right-sizing thresholds**, the **alert/digest** recipients +
action groups, and which **categories** to prioritize.

## Output
An Azure Advisor setup: configured scope + thresholds, recommendation alerts + digests to owners, a triaged
recommendation list with actions/postpones/dismissals and rationale, scoped RBAC — plus verification that acted
recommendations clear and the Advisor score reflects remediation.

## Notes
- Gotchas: recommendations are **periodic** and need **utilization history**; **Security** category requires
  **Defender for Cloud**; Advisor **does not remediate** — it advises; right-sizing can be aggressive (validate
  against real load); dismissing hides recurring guidance. 2nd consumer: the Azure role team
  (azure-cloud-architect / azure-cost-governor / azure-reliability-engineer). Cross-cloud peers: AWS Trusted
  Advisor + Compute Optimizer, GCP Active Assist / Recommender.
- IaC/CLI: Advisor is largely **read/configure**, not provisioned: CLI `az advisor recommendation list`,
  `az advisor configuration ...`; alerts via Terraform `azurerm_monitor_action_group` + an Advisor alert rule;
  REST `Microsoft.Advisor/*`. Remediation lands on the target service's IaC (azurerm_*).