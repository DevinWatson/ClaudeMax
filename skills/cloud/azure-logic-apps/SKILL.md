---
name: azure-logic-apps
description: Use when designing, provisioning, securing, or operating Azure Logic Apps — the managed serverless workflow-automation and iPaaS integration service (Azure Logic Apps). Covers workflow definitions (triggers + actions, the Workflow Definition Language), the 400+ managed and custom connectors, the Consumption (multi-tenant, per-execution) vs Standard (single-tenant, App Service / Functions runtime, VNet, stateful/stateless) hosting models, control flow (conditions, switch, scopes, until, parallel branches, run-after), integration accounts and B2B/EDI (AS2, X12, EDIFACT), and on-prem connectivity via the data gateway. Loads the knowledge: create the workflow, pick Consumption vs Standard, wire triggers/connectors, add B2B/EDI where needed, secure with Entra/managed identity, and verify a run. Consumed by the azure-logic-apps specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Logic Apps).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-logic-apps, integration, workflow, ipaas]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Logic Apps

The managed **serverless workflow-automation and iPaaS** service — orchestrate integrations across apps,
data, and B2B partners with a low-code designer. This skill owns the **Azure managed-service layer** — the
workflow, hosting model, connectors/triggers, B2B/EDI, and security — and verifying a run; it defers
**cloud-agnostic integration/orchestration design** to the architecture teams.

## Core concepts and components
- **Workflow** — a **trigger** (what starts it: recurrence, HTTP request, connector event) plus a sequence of
  **actions**, expressed in the **Workflow Definition Language** (JSON) and built in the designer.
- **Connectors** — 400+ **managed connectors** (SaaS, Azure, databases, FTP, Service Bus, etc.), **built-in**
  connectors (run in-process on Standard), and **custom** connectors.
- **Hosting models** — **Consumption** (multi-tenant, pay **per action execution**, single workflow per
  resource) vs **Standard** (single-tenant on the Logic Apps/Functions runtime, **multiple workflows per
  app**, **VNet integration**, private endpoints, **stateful/stateless** workflows, fixed-plan pricing).
- **Control flow** — **conditions**, **switch**, **scopes**, **until** loops, **for-each** (with concurrency),
  **parallel branches**, and **run-after** error handling.
- **Integration account & B2B/EDI** — trading-partner agreements, schemas/maps (XML/JSON transforms), and
  **AS2 / X12 / EDIFACT** for B2B exchange.
- **On-prem connectivity** — the **on-premises data gateway** bridges to private/on-prem systems.

## Configuration and sizing
- Pick **Consumption** for spiky/per-execution event automation, **Standard** for high-volume, VNet-bound,
  multi-workflow, or stateless-throughput needs. Wire the **trigger** + **connectors**, add **control flow**
  and **run-after** error handling, attach an **integration account** for B2B/EDI, and size the **Standard
  plan** (workflow SKU) to throughput.

## Security and IAM
- **Entra ID** auth + **Azure RBAC**; prefer the workflow's **managed identity** for connector auth and Key
  Vault secrets instead of inline credentials; secure HTTP triggers with **SAS/Entra/IP ranges**; on Standard
  use **VNet integration + private endpoints**; the **data gateway** for on-prem. Scope connections least-priv.

## Cost levers
- **Consumption** = per **action/trigger execution** (+ standard-connector calls); **Standard** = fixed
  **workflow-plan** vCore/memory. Levers: choose the right model (low/spiky volume = Consumption, sustained
  high volume = Standard), prefer **built-in** connectors over metered managed ones on Standard, avoid chatty
  polling triggers, and bound **for-each** concurrency.

## Scaling and limits
- Consumption scales automatically (per-execution); Standard scales the **plan** (and stateless workflows for
  higher throughput). Limits: per-action **timeout**/message-size caps, connector **throttling** limits,
  Consumption **run-history/retention** limits, and B2B/EDI requires an **integration account** (its own tier
  cost). Long-running waits use the built-in delay/until rather than blocking.

## Operating procedure
1. **Provision** — create the workflow via Terraform `azurerm_logic_app_workflow` (Consumption) or
   `azurerm_logic_app_standard` (Standard), Bicep `Microsoft.Logic/workflows`, or `az logic workflow create`.
2. **Configure** — define the **trigger** + **actions/connectors**, add **control flow** + **run-after**
   handling, attach an **integration account** for B2B/EDI, and (Standard) wire **VNet**/built-in connectors.
3. **Secure** — enable **managed identity** for connector/Key Vault auth, lock down HTTP triggers, add
   **VNet/private endpoints** (Standard) or the **data gateway** (on-prem), and scope connection RBAC.
4. **Verify** — apply [[verify-by-running]]: confirm the workflow provisioned, **trigger a run** (fire the
   trigger / `az logic workflow ... ` or HTTP call), then check the **run history** shows **Succeeded** with
   each action green and expected output. Capture result.

## Inputs
The integration to automate (trigger + systems involved), volume/latency profile (drives Consumption vs
Standard), connector + B2B/EDI needs, error-handling/retry requirements, connectivity (VNet/on-prem gateway),
secret management (Key Vault/managed identity), and region.

## Output
An Azure Logic Apps setup: a workflow on the right hosting model with trigger + connectors + control flow and
error handling, B2B/EDI via an integration account where needed, managed-identity auth + secured triggers +
VNet/gateway connectivity, scoped RBAC — plus verification that a run succeeds.

## Notes
- Gotchas: **Consumption vs Standard** is the key fork (per-execution cost + single workflow vs fixed plan +
  VNet + multi-workflow) — picking wrong is expensive/limiting; **connector throttling** caps throughput;
  unbounded **for-each** concurrency overwhelms downstreams; **B2B/EDI needs an integration account**; inline
  secrets leak — use **managed identity**/Key Vault. **Cloud-agnostic integration/orchestration design is the
  architecture team's job** — defer to engineering/integration architects. 2nd consumer: the Azure role team
  (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peer: AWS Step Functions,
  GCP Workflows/Application Integration.
- IaC/CLI: Terraform `azurerm_logic_app_workflow` / `azurerm_logic_app_standard` (+
  `azurerm_logic_app_trigger_*` / `azurerm_logic_app_action_*`); Bicep/ARM `Microsoft.Logic/workflows`. CLI
  `az logic workflow create`.
