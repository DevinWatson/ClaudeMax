---
name: azure-entra-id-governance
description: Use when designing, provisioning, securing, or operating Microsoft Entra ID Governance — controlling the identity lifecycle and access at scale across employees, partners, and guests (Microsoft Entra ID Governance). Covers entitlement management (access packages, catalogs, connected organizations) for self-service access requests with approval and expiry, access reviews (recurring recertification of group/app/role membership), lifecycle workflows (automated joiner/mover/leaver tasks), Privileged Identity Management (PIM) for just-in-time privileged role activation with approval/audit, terms of use, and separation-of-duties checks. Loads the knowledge: design catalogs and access packages, schedule access reviews, build lifecycle workflows, configure PIM, and verify request/approval/review/elevation flows. Consumed by the entra-id-governance specialist and by the Azure role team when standing up the managed service (Microsoft Entra ID Governance).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-entra-id-governance, identity, access-reviews, pim]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Entra ID Governance

Governs the **identity lifecycle and access at scale** — who can request what, who approves, when access
expires, and how privileged roles are elevated and audited. Built on Entra ID P2 / Governance licensing. This
skill owns the **governance layer**: entitlement management, access reviews, lifecycle workflows, and PIM.

## Core concepts and components
- **Entitlement management** — **access packages** bundle resources (groups, apps, SharePoint sites, Azure
  roles) that users (internal or **connected organization** guests) request via a **catalog**; requests have
  **approval** workflows, **expiry/renewal**, and policies scoping who can request.
- **Access reviews** — scheduled **recertification** of group/app/role/access-package membership; reviewers
  (self, manager, designated) attest; non-reviewed access can be auto-removed. Closes the loop on access creep.
- **Lifecycle workflows** — automated **joiner / mover / leaver** task sequences (enable account, assign access
  packages, send notifications, disable/remove on offboarding) triggered by attribute/time conditions.
- **Privileged Identity Management (PIM)** — make privileged **Entra roles, Azure roles, and PIM-for-Groups**
  **eligible** (not permanent); users **activate just-in-time** with **approval**, MFA, justification, and a
  time limit, all **audited**. Also supports access reviews of privileged roles.
- **Terms of use & SoD** — enforce **terms-of-use** acceptance and **separation-of-duties** (incompatible
  access-package) checks at request time.

## Configuration and sizing
- Requires **Entra ID P2** or the **Microsoft Entra ID Governance** SKU (per-user). Build **catalogs** and
  **access packages** with approval/expiry policies, schedule **access reviews** on the highest-risk
  groups/roles, author **lifecycle workflows** for joiner/mover/leaver, and configure **PIM** eligibility +
  activation settings. Sizing is by **licensed users**.

## Security and IAM
- This is the **governance** control plane for IAM. Enforce **least standing access** (eligible-not-permanent
  via PIM, expiring access packages), **separation of duties**, **periodic recertification** (access reviews),
  **approval + MFA + justification** on privileged activation, and complete **audit** trails. Scope who can
  administer governance objects via Entra roles; protect Global Admin with PIM + approval.

## Cost levers
- Billed **per user per month** on **P2 / Governance** licensing (only users in scope of governed access need
  it). Levers: license only **governed users** (e.g. those using access packages / eligible for privileged
  roles), prefer **automation** (lifecycle workflows) to manual ops cost, and right-size review frequency.

## Scaling and limits
- Scales across employees, partners, and guests; limits include **access packages/catalogs** per tenant,
  **access reviews** in flight, **lifecycle workflow** tasks/runs, and PIM **activation/eligibility** counts.
  Connected-organization scope and recurring-review volume need governance to avoid reviewer fatigue.

## Operating procedure
1. **Provision** — confirm **P2/Governance** licensing; create **catalogs** and add resources to govern.
2. **Configure** — build **access packages** (resources + approval + expiry + scoped policies), schedule
   **access reviews** for high-risk groups/roles, author **lifecycle workflows** (joiner/mover/leaver), and set
   up **PIM** eligibility + activation (approval/MFA/duration).
3. **Secure** — enforce **least standing access** (PIM eligible, expiring packages), **SoD** and **terms of
   use**, MFA/approval on privileged activation, and audit logging; scope governance admin roles.
4. **Verify** — apply [[verify-by-running]]: submit a test **access package request** and confirm the
   **approval → grant → expiry** flow, run/inspect an **access review** decision and confirm removal on
   denial, trigger a **lifecycle workflow** and confirm tasks ran, and perform a **PIM activation** confirming
   approval/MFA and audit entry. Capture state and result.

## Inputs
The resources to govern (groups/apps/roles) and who may request them, approval/expiry policies, recertification
scope and cadence (access reviews), joiner/mover/leaver automation needs, privileged-role model (PIM
eligibility/approval), SoD/terms-of-use requirements, licensing (P2/Governance), and tenant scope.

## Output
A Microsoft Entra ID Governance setup: catalogs and access packages with approval/expiry, scheduled access
reviews, lifecycle workflows for joiner/mover/leaver, PIM-governed privileged roles, SoD/terms-of-use — plus
verification that request/approval, review removal, workflow execution, and PIM activation all work.

## Notes
- Gotchas: governance features require **P2 / Governance licensing** — verify before designing; **access
  reviews** cause reviewer fatigue if over-scoped (target high-risk first) and auto-remove can revoke needed
  access if reviewers don't act — set sensible defaults; **lifecycle workflows** acting on bad attribute data
  can disable the wrong accounts (test in scope); **PIM** eligibility is useless if activation settings skip
  approval/MFA. This is **governance** — actual Entra config/objects live in **azure-microsoft-entra-id**;
  posture *review* belongs to **azure-security-reviewer**. 2nd consumer: the Azure role team
  (azure-iam-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS IAM Access
  Analyzer / IAM Identity Center reviews, GCP access governance.
- IaC/CLI: largely **Microsoft Graph**-driven; Terraform **azuread** has partial coverage
  (`azuread_access_package`, `azuread_access_package_catalog`, `azuread_access_package_assignment_policy`); PIM/
  access-reviews mostly via Graph/portal. CLI `az rest` against Graph / PowerShell Microsoft.Graph modules.
