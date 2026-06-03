---
name: gcp-resource-manager
description: Use when designing, provisioning, securing, or operating Resource Manager — Google Cloud's service for managing the resource hierarchy and applying governance across it (Resource Manager). Covers the hierarchy (organization → folders → projects → resources), creating/moving/deleting projects and folders, the organization node and Cloud Identity link, organization policies (org policy constraints, boolean and list, custom constraints) for guardrails, labels and tags (with tag-based IAM/policy), liens to prevent deletion, and how IAM and policies inherit down the tree, plus quotas and limits. Loads the Resource Manager knowledge: shape the hierarchy, apply org policies, label/tag, and verify inheritance. Consumed by the Resource Manager specialist and by the GCP role team (gcp-cloud-architect / gcp-security-reviewer) when designing the landing-zone hierarchy and governance (Resource Manager).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, resource-manager, management, hierarchy, org-policy, governance, landing-zone]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Resource Manager

Google Cloud's service for the **resource hierarchy** and the **governance** applied across it. It defines
how resources are organized (**organization → folders → projects → resources**) and is where you attach
**organization policies**, **IAM**, **tags**, and **labels** that **inherit downward** — making it the
foundation of a GCP landing zone and the control point for org-wide guardrails.

## Core concepts and components
- **Resource hierarchy** — **Organization** (root, tied to a Cloud Identity/Workspace domain) → **folders**
  (group projects by department/environment, can nest) → **projects** (the unit that holds resources and
  billing) → **resources** (service objects).
- **Projects** — the billing/quota/IAM boundary; create, **move** between folders, archive/restore, and
  **delete** (30-day soft delete). Each has an ID/number/name.
- **Folders** — organizational grouping for delegated administration and policy scoping; policies/IAM set
  on a folder apply to everything beneath it.
- **Organization policies** — **constraints** (Google-managed **boolean**/**list**, plus **custom
  constraints** in CEL) attached at org/folder/project for guardrails (e.g. restrict regions, disable SA
  key creation, require OS Login). They **inherit and merge** down the tree.
- **Tags** — key/value **tags** bound to resources for **conditional IAM** and **policy targeting**
  (governance-grade, IAM-controlled). Distinct from **labels** (lightweight key/value for billing/
  organization, no access control).
- **Liens** — block accidental **project deletion**.
- **Inheritance** — IAM and org policies set higher in the tree **flow down** (additive for IAM, merge
  rules for org policy) — the basis of centralized governance.

## Configuration and sizing
- Design the **folder structure** to match org/environment boundaries (e.g. `prod`/`nonprod`, business
  units) and to be the right scope for **policy and IAM** inheritance. Decide **org policies** for
  baseline guardrails and where to attach them. Standardize **labels** (billing/allocation) and **tags**
  (governance/conditional IAM). Add **liens** to critical projects. Keep the hierarchy **shallow and
  meaningful**, not deeply nested.

## Security and IAM
- This is the **governance control plane**. Use **org policies** as preventative guardrails (restrict
  regions/public IPs/SA keys/external sharing), bind **IAM at folders** for delegated least-privilege
  admin, and use **tags + conditional IAM** for fine-grained control. Remember **IAM inherits and is
  additive** — a high grant can't be removed lower except via a **deny policy**. Restrict who can
  **create/move/delete projects** and **set org policies** (`roles/orgpolicy.policyAdmin`,
  `roles/resourcemanager.*Admin`). Org-policy admin is highly privileged.

## Cost levers
- Resource Manager itself is **free**; it is a **cost-governance** lever: **labels** drive cost allocation/
  chargeback, **org policies** restrict expensive regions/SKUs, and a clean **folder structure** plus
  **budgets** (Cloud Billing) per folder/project enable accountability.

## Scaling and limits
- Limits on **folder depth/nesting**, **projects per org/folder**, org policies, tags per resource, and
  liens apply. Project IDs are **globally unique and immutable**; deleted projects have a **~30-day
  recovery** window. Policy/IAM changes propagate with **eventual consistency**. Org-policy changes can
  break running workloads — test before broad rollout.

## Operating procedure
1. **Provision** — confirm the **organization** node (Cloud Identity domain link); create the **folder**
   structure and **projects** (Terraform `google_folder`, `google_project`,
   `google_organization` data) in the right hierarchy.
2. **Configure** — attach **organization policies** (boolean/list/**custom constraints**) at the right
   scope (`google_org_policy_policy` / `google_org_policy_custom_constraint`), apply **labels** and **tags**
   (`google_tags_tag_key/value/binding`), and bind **IAM at folders** for delegated admin.
3. **Secure** — set least-privilege **resourcemanager.*/orgpolicy.* IAM** on groups, add **liens** to
   protect critical projects, and use **org policies + tags/conditional IAM** as preventative guardrails.
4. **Verify** — apply [[verify-by-running]]: confirm the **hierarchy** is correct
   (`gcloud resource-manager folders list`, `gcloud projects list`), confirm an **org policy guardrail
   actually blocks** a violating action (e.g. creating a resource in a restricted region fails), and
   confirm **IAM/policy inheritance** by checking effective access on a child project. Capture the
   hierarchy, the enforced-guardrail denial, and the inheritance check.

## Inputs
The organization/domain, the desired folder/project structure and environment boundaries, the governance
guardrails (org policies / custom constraints), labeling and tagging standards, delegated-admin IAM plan,
and which projects need liens.

## Output
A resource hierarchy (org → folders → projects) with organization-policy guardrails at the right scopes,
labels/tags for allocation and conditional IAM, folder-level least-privilege IAM, and liens on critical
projects — plus verification of the hierarchy, an enforced org-policy denial, and IAM/policy inheritance.

## Notes
- Gotchas: **IAM and org policies inherit downward** — a high grant can't be removed at a child except via
  a **deny policy**; **org-policy changes can break running workloads** (test before broad rollout);
  **project IDs are globally unique and immutable**, deletes have a ~30-day recovery window; **tags**
  (governance/conditional IAM) differ from **labels** (billing/organization, no access control); keep the
  hierarchy shallow. This owns the **hierarchy + governance**, not per-service config. 2nd consumer: the
  GCP role team (gcp-cloud-architect / gcp-security-reviewer) designing the landing zone. Cross-cloud peer:
  AWS Organizations (accounts/OUs/SCPs).
- IaC/CLI: Terraform `google_folder`, `google_project`, `google_org_policy_policy`,
  `google_org_policy_custom_constraint`, `google_tags_tag_key/value/binding`,
  `google_resource_manager_lien`, and `google_folder_iam_member`. CLI `gcloud resource-manager folders`,
  `gcloud projects`, `gcloud org-policies`, `gcloud resource-manager liens`; verify a guardrail by
  attempting a violating action and confirming it is denied.
