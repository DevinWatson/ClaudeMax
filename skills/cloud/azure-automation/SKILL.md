---
name: azure-automation
description: Use when designing, provisioning, configuring, or operating Azure Automation — the managed process-automation service for runbooks, configuration management, and update orchestration across Azure, on-prem, and other clouds (Azure Automation). Covers PowerShell/Python/PowerShell-Workflow/graphical runbooks, schedules and webhooks, Hybrid Runbook Workers for on-prem/multicloud execution, shared resources (variables/credentials/certificates/connections/modules), State Configuration (DSC), and Update Management. Loads the knowledge to stand up an Automation account, author and schedule runbooks, wire hybrid workers, and verify a job runs. Consumed by the azure-automation specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect / azure-iac-engineer) when operating the managed service (Azure Automation).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-automation, management-governance, runbooks, dsc]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Automation

**Azure Automation** is the managed **process-automation** service: it runs **runbooks**, manages configuration
with **State Configuration (DSC)**, and orchestrates **updates**. This skill owns the **single-service Automation
layer** — the Automation account, runbooks + schedules/webhooks, hybrid workers, shared resources, and DSC — for
one workload or subscription.

## Core concepts and components
- **Automation account** — the container for runbooks, assets, schedules, and the **system/user-assigned managed
  identity** used to authenticate to Azure (replacing the legacy Run As account).
- **Runbooks** — **PowerShell**, **PowerShell Workflow**, **Python 2/3**, and **graphical** runbooks; published
  vs draft; triggered by **schedules**, **webhooks**, alerts, or other runbooks.
- **Hybrid Runbook Workers** — run runbooks **on-prem or in other clouds** (extension-based, on Arc-enabled
  machines), reaching resources outside Azure.
- **Shared resources** — **variables**, **credentials**, **certificates**, **connections**, and imported
  **modules/packages**; encrypted assets for secrets.
- **State Configuration (DSC)** — author/compile **DSC configurations**, register nodes, and report compliance/
  drift (PowerShell DSC; note Microsoft's guidance to move to **Azure Machine Configuration** for new work).
- **Update Management** — assess and schedule **OS patching** (now largely Azure Update Manager) across Azure +
  Arc machines.

## Configuration and sizing
- Create the **Automation account** with a **managed identity**, import required **modules**, author + **publish**
  runbooks, attach **schedules/webhooks**, and (for outside-Azure targets) register a **Hybrid Worker group** on
  Arc machines. No instance sizing — concurrency is governed by job limits and worker capacity.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Automation Contributor / Operator / Job Operator**. Runbooks
  authenticate with the account's **managed identity** (grant it least-privilege RBAC on target resources) — do
  **not** use stored credentials where a managed identity works. Protect webhook URLs (they are bearer secrets),
  and store secrets as encrypted **credentials/variables**, never inline in runbook code.

## Cost levers
- Billed by **job run minutes** (first 500 min/month free) and **node** count for DSC/Update Management. Levers:
  trim runbook runtime, avoid chatty polling loops, consolidate schedules, use webhooks/event triggers over busy
  timers, and right-size hybrid worker VMs.

## Scaling and limits
- Job runtime cap (~3h for cloud "fair share" — long jobs belong on **hybrid workers**), concurrent-job limits per
  account, module import constraints, and shared-resource quotas. Hybrid workers scale by adding machines. DSC is
  in maintenance mode — prefer **Machine Configuration** for greenfield.

## Operating procedure
1. **Provision** — create the account via Terraform `azurerm_automation_account` (with `identity`), Bicep
   `Microsoft.Automation/automationAccounts`, or `az automation account create`; import modules
   (`azurerm_automation_module`).
2. **Configure** — author runbooks (`azurerm_automation_runbook`), publish, attach schedules
   (`azurerm_automation_schedule` + `azurerm_automation_job_schedule`) / webhooks, define DSC configs/node configs,
   and register **Hybrid Worker** groups for outside-Azure targets.
3. **Secure** — assign least-privilege RBAC to the **managed identity**, store secrets as encrypted credentials/
   variables, and protect webhook URLs.
4. **Verify** — apply [[verify-by-running]]: start a runbook job (`az automation runbook start`) and read its
   status/output (`az automation job show` / stream), confirming a successful completion; for DSC confirm node
   compliance. Capture state and result.

## Inputs
The **Automation account** + identity model, the **runbooks** (language + logic) and their **triggers**
(schedule/webhook), required **modules**, the **hybrid worker** targets, **shared resources/secrets**, and any
**DSC/Update** scope.

## Output
An Azure Automation setup: an Automation account with a managed identity, published runbooks wired to
schedules/webhooks, hybrid worker groups for outside-Azure execution, encrypted shared resources, DSC/Update
configuration, scoped RBAC — plus verification that a runbook job runs successfully.

## Notes
- Gotchas: the **3h fair-share** runtime cap on cloud jobs (use hybrid workers for long work); **module version**
  conflicts; webhook URLs are **secrets**; Run As accounts are **retired** — use managed identities; **DSC** is in
  maintenance (prefer Machine Configuration); Python runbooks need matching runtime packages. 2nd consumer: the
  Azure role team (azure-platform-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peer: AWS
  Systems Manager (Automation/Run Command + State Manager).
- IaC/CLI: Terraform `azurerm_automation_account`, `azurerm_automation_runbook`, `azurerm_automation_schedule`,
  `azurerm_automation_job_schedule`, `azurerm_automation_module`, `azurerm_automation_variable_*`,
  `azurerm_automation_dsc_configuration`/`_nodeconfiguration`; Bicep/ARM `Microsoft.Automation/automationAccounts`.
  CLI `az automation ...`.