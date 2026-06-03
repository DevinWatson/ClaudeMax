---
name: azure-policy
description: Use when designing, provisioning, configuring, or operating Azure Policy — the governance service that enforces organizational rules and assesses compliance across Azure resources at scale (Azure Policy). Covers policy definitions (the JSON if/then rule with an effect), initiatives/policy sets, assignments (scoped to a management group, subscription, or resource group, with exclusions/parameters), the effect types (Audit, Deny, DeployIfNotExists, Modify, Append, AuditIfNotExists, Disabled), the compliance dashboard and evaluation cycle, managed-identity remediation tasks, exemptions, built-in vs custom definitions, and the management-group hierarchy. Loads the knowledge: author definitions/initiatives, assign at the right scope with the right effect, remediate non-compliant resources, and verify compliance. Consumed by the azure-policy specialist and by the Azure role team (azure-security-reviewer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Policy).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-policy, management-governance, compliance, governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Policy

**Azure Policy** is the governance service that **enforces organizational rules** and **assesses compliance**
across Azure resources at scale — denying disallowed configurations, auditing drift, and auto-remediating. This
skill owns the **single-service Policy layer** — authoring definitions/initiatives, assigning them at the right
scope with the right effect, and remediating — typically against a management-group hierarchy.

## Core concepts and components
- **Policy definition** — a JSON rule with an **`if` condition** (matching resource fields/aliases) and a
  **`then` effect**; can take **parameters**. Many **built-ins** exist; you author **custom** ones for
  org-specific rules.
- **Initiative (policy set)** — a **named group** of definitions with shared parameters and a compliance goal
  (e.g. a regulatory baseline); assigned as a unit.
- **Assignment** — binds a definition/initiative to a **scope** (**management group**, **subscription**, or
  **resource group**) with **parameters** and optional **exclusions**; inheritance flows down the hierarchy.
- **Effects** — **Audit** (flag), **Deny** (block at create/update), **DeployIfNotExists (DINE)** and
  **Modify**/**Append** (remediate/mutate, need a **managed identity**), **AuditIfNotExists**, **Mutate**, and
  **Disabled**. Choosing the effect is the core design decision.
- **Compliance & evaluation** — a **compliance dashboard** shows compliant/non-compliant counts; evaluation runs
  on a **cycle** (~24h) and on resource changes — it is **not instant**.
- **Remediation** — for DINE/Modify, a **remediation task** brings existing resources into compliance using the
  assignment's **managed identity** (which needs the right RBAC role).
- **Exemptions** — time-bound, justified **exemptions** suppress findings for specific resources without
  deleting the assignment.

## Configuration and sizing
- Author/select **definitions**, group them into an **initiative**, assign at the **highest appropriate scope**
  (usually a **management group** for org-wide rules), set **parameters** + **exclusions**, choose the **effect**
  per rule (start **Audit**, graduate to **Deny/DINE**), and grant the assignment's **managed identity** the RBAC
  it needs for remediation. Scope, not size, is the lever.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Resource Policy Contributor** (author/assign). DINE/Modify
  assignments create a **managed identity** that must be granted the **least-privilege RBAC role** required to
  remediate (e.g. Contributor on the target). Policy is itself a security control (Deny risky config); route
  compliance state into reporting. Don't over-grant the remediation identity.

## Cost levers
- Azure Policy for ARM resources is **free**; cost arises indirectly (e.g. **Defender/Guest Configuration**
  add-ons, or resources that **DINE** deploys). Levers: prefer **Audit** before **DINE** to avoid surprise
  deployments, scope assignments tightly, and review what remediation **creates** (it incurs the resource's
  own cost).

## Scaling and limits
- Scales across the whole **management-group hierarchy** with inheritance. Limits: evaluation is **periodic
  (~24h)**, not real-time — compliance state lags; **Deny** blocks new/updated resources but does **not**
  delete existing non-compliant ones (use **remediation**); there are **caps** on definitions/assignments per
  scope and initiative size; **DINE/Modify** apply only on evaluation/remediation, not retroactively without a
  remediation task. Test effects (especially **Deny**) before broad rollout.

## Operating procedure
1. **Provision** — author definitions and initiatives via Terraform `azurerm_policy_definition` +
   `azurerm_policy_set_definition`, Bicep `Microsoft.Authorization/policyDefinitions` +
   `/policySetDefinitions`, or `az policy definition create` / `az policy set-definition create`.
2. **Configure** — create **assignments** at the right scope via
   `azurerm_management_group_policy_assignment` / `azurerm_subscription_policy_assignment` /
   `azurerm_resource_group_policy_assignment` (set parameters, exclusions, **effect**, and the **identity** for
   DINE/Modify), or `az policy assignment create`.
3. **Secure** — grant the remediation **managed identity** least-privilege RBAC, start effects at **Audit**,
   then promote to **Deny/DINE**; add justified **exemptions** where needed.
4. **Verify** — apply [[verify-by-running]]: trigger an on-demand scan (`az policy state trigger-scan`),
   read **compliance state** (`az policy state list` / `az policy state summarize`), confirm a **Deny** blocks a
   non-compliant create, and run a **remediation task** (`az policy remediation create`) and confirm resources
   become compliant. Capture state and result.

## Inputs
The **rules** to enforce (built-in vs custom), how to **group** them (initiative), the **scope** (management
group / subscription / resource group) and exclusions, the **effect** per rule (Audit → Deny/DINE), the
**remediation** needs and identity RBAC, and any **exemptions**.

## Output
An Azure Policy setup: definitions/initiatives authored, assignments scoped at the right level with parameters
and exclusions, effects chosen (Audit→Deny/DINE), remediation identity granted least-privilege RBAC,
exemptions where justified — plus verification that the compliance dashboard reflects state, Deny blocks
violations, and remediation brings resources into compliance.

## Notes
- Gotchas: evaluation is **periodic (~24h)**, not instant — trigger a scan to see results; **Deny** only blocks
  new/changed resources (existing non-compliant ones need **remediation**); always pilot effects (especially
  **Deny**) at narrow scope first; DINE/Modify **managed identity** must have the right RBAC or remediation
  fails; use **exemptions**, not assignment deletion, for one-offs. Cross-cutting governance/landing-zone
  strategy is the role team's call. 2nd consumer: the Azure role team (azure-security-reviewer /
  azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS Config (+ SCPs/Control Tower), GCP
  Organization Policy.
- IaC/CLI: Terraform `azurerm_policy_definition`, `azurerm_policy_set_definition`,
  `azurerm_management_group_policy_assignment` / `_subscription_` / `_resource_group_`,
  `azurerm_policy_remediation`; Bicep/ARM `Microsoft.Authorization/policyDefinitions` +
  `/policySetDefinitions` + `/policyAssignments`. CLI `az policy definition/assignment/state/remediation`.
