---
name: azure-resource-manager
description: Use when designing, authoring, deploying, or operating Azure Resource Manager (ARM) deployments — the native deployment and management layer of Azure and its declarative IaC via ARM JSON templates and Bicep (Azure Resource Manager). Covers the ARM control plane and resource providers, resource groups and the subscription/management-group hierarchy, ARM JSON vs Bicep templates (modules, parameters, outputs), deployment scopes (RG/subscription/MG/tenant), modes (Incremental vs Complete), deployment stacks with deny-settings, what-if preview, template specs and the Bicep registry, resource locks, tags, and the relationship between native IaC and third-party Terraform. Loads the knowledge: author the template/Bicep, deploy at the right scope/mode, apply locks/tags/stacks, and verify the deployment. Consumed by the azure-resource-manager specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect / azure-security-reviewer) when standing up the managed service (Azure Resource Manager).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-resource-manager, management-governance, arm, bicep]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Resource Manager

**Azure Resource Manager (ARM)** is the **native control plane** of Azure — every create/update/delete goes
through it — and the foundation for **declarative IaC** via **ARM JSON templates** and **Bicep**. This skill
owns the **single-service ARM/Bicep layer** — authoring templates, deploying at the right scope and mode,
deployment stacks, locks, and tags. (It is the **native** alternative to Terraform.)

## Core concepts and components
- **Control plane & resource providers** — ARM brokers all management operations; each service is a **resource
  provider** (`Microsoft.Compute`, `Microsoft.Storage`, …) with API versions.
- **Hierarchy** — **management groups → subscriptions → resource groups → resources**; a **resource group** is
  the basic deployment + lifecycle container (and a region for its metadata).
- **Templates** — **ARM JSON** (parameters, variables, resources, functions, outputs) and **Bicep** (a concise
  DSL that transpiles to ARM, with **modules**, type safety, and simpler syntax). Bicep is the recommended
  authoring experience.
- **Deployment scopes** — deploy at **resource group**, **subscription**, **management group**, or **tenant**
  scope depending on what you create (e.g. RGs/policies at subscription scope).
- **Deployment modes** — **Incremental** (default; adds/updates, leaves others) vs **Complete** (deletes
  resources in the RG not in the template — powerful and dangerous).
- **Deployment stacks** — manage a **collection of resources as one lifecycle unit** with **deny settings**
  (block out-of-band changes/deletes) and clean teardown — a step beyond plain deployments.
- **What-if, template specs, registry** — **what-if** previews changes before deploy; **template specs** and
  the **Bicep module registry** (in an ACR) share/version reusable templates.
- **Locks & tags** — **resource locks** (**CanNotDelete**, **ReadOnly**) protect resources; **tags** drive
  cost allocation and governance (often enforced via Azure Policy).

## Configuration and sizing
- Author **Bicep** (with **modules** for reuse), choose the **deployment scope** matching the resources, default
  to **Incremental** mode (use **Complete** only deliberately), wrap critical stacks in **deployment stacks**
  with **deny settings**, and apply **locks + tags**. Parameterize per environment (params files / `.bicepparam`).

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** scoped to the **deployment scope** (e.g. Contributor on the RG);
  CI/CD should deploy with a **workload-identity-federated** service principal or **managed identity**, not a
  client secret. Use **deployment stack deny settings** and **resource locks** to prevent drift/accidental
  deletion, never hardcode secrets in templates (reference **Key Vault** via `getSecret`/parameters), and use
  **what-if** in review gates. Tag governance is enforced via Azure Policy.

## Cost levers
- ARM/Bicep deployment itself is **free**; cost is the **resources deployed**. Levers: use **what-if** to catch
  unintended creates, parameterize **SKUs/counts** per environment, tag for **cost allocation/showback**, and
  use **deployment stacks** to cleanly tear down ephemeral environments (avoid orphaned billable resources).

## Scaling and limits
- Scales via **modules**, **nested/linked** deployments, and the **registry/template specs**. Limits:
  **template/parameter size** and **resource-count per deployment** caps (use modules/linked templates);
  **Complete mode deletes** un-templated resources in the RG — handle with care; some changes force
  **replacement**; deployment stacks and tenant-scope deploys have their own constraints; ARM is **per-region**
  for some operations. Always **what-if** before applying to shared scopes.

## Operating procedure
1. **Author** — write **Bicep** (`main.bicep` + modules) or ARM JSON; define **parameters** (`.bicepparam` /
   params file) per environment; validate with `az bicep build` / `bicep lint`.
2. **Preview & deploy** — run **what-if** (`az deployment group what-if`), then deploy at the right scope/mode
   (`az deployment group/sub/mg create`, or **deployment stacks** `az stack group/sub create`); in CI/CD use a
   federated identity.
3. **Govern** — apply **resource locks** (`az lock create`) and **tags**, and use **deployment-stack deny
   settings** to block out-of-band changes; reference secrets from **Key Vault**, never inline.
4. **Verify** — apply [[verify-by-running]]: confirm the deployment **succeeded**
   (`az deployment group show --query properties.provisioningState`), confirm the **resources exist** as
   expected (`az resource list -g <rg>`), and confirm **what-if** showed no unexpected deletes; capture state
   and result.

## Inputs
The resources to deploy, the **deployment scope** (RG/sub/MG/tenant) and **mode** (Incremental/Complete),
whether to use a **deployment stack** (+ deny settings), the **parameterization**/environment model, required
**locks + tags**, secret sources (**Key Vault**), and the CI/CD identity.

## Output
An Azure Resource Manager deployment: Bicep/ARM templates (modular, parameterized) deployed at the right
scope and mode (optionally as a deployment stack with deny settings), with resource locks and tags applied,
secrets referenced from Key Vault, and a CI/CD federated identity — plus verification that the deployment
succeeded, resources exist, and what-if showed no unintended deletes.

## Notes
- Gotchas: **Complete mode deletes** resources not in the template — default to **Incremental** and always
  **what-if** first; **resource locks** can block your own automation (manage them in code); deployment-stack
  **deny settings** can lock out legitimate changes if too broad; never inline secrets (use **Key Vault**
  references); **size/count caps** mean modularize; some property changes force **replacement**. This is the
  **native IaC**, a sibling choice to **Terraform** — broad IaC strategy/module-platform decisions are the role
  team's call. 2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect /
  azure-security-reviewer). Cross-cloud peer: AWS CloudFormation (+ CDK).
- IaC/CLI: **Bicep** (`main.bicep`, modules, `.bicepparam`) / **ARM JSON**; deploy with
  `az deployment group/sub/mg create`, **deployment stacks** `az stack group create`, preview with
  `az deployment group what-if`. Governance via `azurerm_resource_group` / `azurerm_management_lock` /
  `az lock create` and tags. (Terraform `azurerm` is the third-party alternative to ARM/Bicep.)
