---
name: gcp-iam
description: Use when designing, provisioning, securing, or operating Identity and Access Management (IAM) — Google Cloud's authorization system controlling who (members) can do what (roles) on which resources (Identity and Access Management (IAM)). Covers members/principals (users, groups, service accounts, Workload Identity Federation), roles (primitive, predefined, custom), bindings on the resource hierarchy with inheritance, IAM Conditions (CEL), service accounts and impersonation, keyless workloads (WIF + GKE Workload Identity), deny policies, and the Policy Troubleshooter, plus cost and limits. Loads the IAM knowledge: model members to roles to bindings, prefer predefined/custom over primitive roles, eliminate downloaded SA keys via WIF, add conditions, and verify effective access. Consumed by the IAM specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when wiring authorization (Identity and Access Management (IAM)).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, iam, security, authorization, service-accounts, workload-identity-federation, least-privilege]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Identity and Access Management (IAM)

Google Cloud's authorization system. It answers **"who can do what on which resource"** by binding
**members (principals)** to **roles** (collections of permissions) on a **resource** in the GCP hierarchy.
It is foundational to GCP security and is the control plane every other service's access decision flows
through.

## Core concepts and components
- **Members / principals** — Google accounts (users), Google Groups, **service accounts** (workload
  identities), domains, `allAuthenticatedUsers`/`allUsers` (public), and **Workload Identity Federation**
  principals (external IdP identities mapped into GCP).
- **Roles** — **basic/primitive** (`roles/owner`, `roles/editor`, `roles/viewer` — avoid; too broad),
  **predefined** (service-scoped, least-privilege building blocks), and **custom** (your own permission
  set). A role is a bundle of `service.resource.verb` **permissions**.
- **Allow policy / bindings** — a resource's IAM policy is a set of `(role → members)` **bindings**.
  Policies attach at **org → folder → project → resource** and **inherit downward** (effective access is
  the union; you cannot subtract an inherited grant except via **deny policies**).
- **IAM Conditions** — **CEL** expressions on a binding (resource name/tag, time window, request
  attributes) for conditional, context-aware access.
- **Service accounts** — workload identities; supports **impersonation** (`iam.serviceAccountTokenCreator`)
  and short-lived credentials instead of **downloaded long-lived JSON keys** (a key liability).
- **Workload Identity Federation (WIF)** — keyless: external workloads (GitHub Actions, AWS, OIDC IdPs) and
  **GKE Workload Identity** assume a GCP service account without exported keys.
- **Deny policies** — explicitly deny permissions regardless of grants (guardrails).
- **Troubleshooting** — **Policy Troubleshooter** (why can/can't a principal do X), **Policy Analyzer**, and
  **IAM Recommender** (right-sizing toward least privilege).

## Configuration and sizing
- Grant to **groups, not individuals**; prefer **predefined roles**, fall back to **custom roles** when no
  predefined role fits, and reserve primitive roles for sandboxes. Bind at the **lowest level** that
  satisfies the need (project/resource over org). Add **conditions** to narrow time/resource scope. Replace
  every **downloaded SA key** with **WIF/impersonation**.

## Security and IAM
- This *is* the security surface. Eliminate primitive `owner`/`editor` on projects; remove `allUsers`/
  `allAuthenticatedUsers` unless intentionally public; rotate/eliminate SA keys; enforce **separation of
  duties** (who can grant roles, `iam.securityAdmin` vs resource roles); use **deny policies** for hard
  guardrails; and review with the **Recommender** to cut unused permissions.

## Cost levers
- IAM itself is **free**; cost is governed by **policy/role limits** and operational risk, not billing. The
  real "cost" lever is **least privilege** — over-broad roles create breach blast radius and audit toil.

## Scaling and limits
- Bindings per policy, members per binding, custom roles per org/project, and policy size are bounded —
  use **groups** to keep binding counts small. Conditions per policy and deny policies per resource are
  limited. Policy changes are **eventually consistent** (propagation delay).

## Operating procedure
1. **Provision** — enable the IAM/Resource Manager APIs; define **groups** and **service accounts** for
   workloads; design the role model (predefined vs custom).
2. **Configure** — author **bindings** at the right hierarchy level (Terraform `google_*_iam_*`), define
   **custom roles**, add **conditions**, and set up **WIF pools/providers** + **GKE Workload Identity** to
   go keyless.
3. **Secure** — remove primitive `owner`/`editor` and public principals where unintended, eliminate
   downloaded SA keys, add **deny policies** as guardrails, and enforce separation of duties on who can
   grant roles.
4. **Verify** — apply [[verify-by-running]]: use the **Policy Troubleshooter**
   (`gcloud policy-intelligence troubleshoot iam`) and `gcloud projects get-iam-policy` to confirm the
   intended principal **has** the access and an unintended one does **not**, test **impersonation/WIF**
   actually works (short-lived token, no key), and confirm a **deny policy** blocks as expected — capture
   the effective-access result and the token/impersonation check.

## Inputs
The principals (users/groups/SAs/external WIF identities), what each must do, the resource hierarchy and
where to bind, predefined-vs-custom role decisions, any conditions, keyless requirements (WIF/GKE Workload
Identity), and separation-of-duties/guardrail needs.

## Output
An IAM model (group-based bindings at the right hierarchy level, predefined/custom roles, conditions, WIF/
impersonation instead of keys, deny-policy guardrails) with least privilege, plus verification of effective
access via the Policy Troubleshooter and a keyless-token check.

## Notes
- Gotchas: **policies inherit downward and are additive** — an org/folder grant cannot be removed at a child
  except via a **deny policy**; **primitive `editor` on a project** is a common over-grant; **downloaded SA
  keys** are the top credential-leak risk (prefer WIF/impersonation); `allUsers` makes a resource **public**;
  IAM changes are **eventually consistent** (don't assume instant); conditions use **CEL** — test them; the
  **Recommender** flags unused permissions to right-size.
- IaC/CLI: Terraform `google_project_iam_member|binding|policy` (and folder/org/service-resource variants —
  prefer **`_member`** to avoid authoritative `_policy`/`_binding` clobbering), `google_service_account`,
  `google_service_account_iam_member` (impersonation), `google_iam_workload_identity_pool[_provider]`,
  `google_project_iam_custom_role`, `google_*_iam_*` conditions, and deny via `google_iam_deny_policy`. CLI
  `gcloud projects get-iam-policy`, `gcloud iam roles/service-accounts`, and
  `gcloud policy-intelligence troubleshoot iam` to verify effective access.
