---
name: gcp-vpc-service-controls
description: Use when designing, provisioning, securing, or operating VPC Service Controls (VPC-SC) — Google Cloud's data-exfiltration-prevention layer that draws service perimeters around managed APIs so data cannot leave the trust boundary (VPC Service Controls). Covers service perimeters (enforced vs dry-run), restricted/protected services, access levels from Access Context Manager (IP, device, identity, geo), ingress and egress rules (from/to identities and resources), perimeter bridges, the access policy on the org, dry-run audit before enforcement, and how it composes with Private Google Access and IAM, plus limits and operations. Loads the VPC-SC knowledge: define a perimeter, add access levels and ingress/egress rules, dry-run, then enforce and verify. Consumed by the VPC Service Controls specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when building a data perimeter (VPC Service Controls).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, vpc-service-controls, security, data-perimeter, exfiltration-prevention, access-levels, perimeter]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# VPC Service Controls (VPC-SC)

Google Cloud's **data-exfiltration-prevention** layer. It draws a **service perimeter** around a set of
projects and **Google-managed APIs** so that data in services like Cloud Storage, BigQuery, and
Bigtable **cannot be read or copied across the perimeter boundary** — even by an identity with valid
IAM — unless an explicit rule allows it. It is the GCP **data perimeter** control.

## Core concepts and components
- **Access policy** — an org-level container (one per org, scoped to a node) holding access levels and
  perimeters; managed via Access Context Manager.
- **Service perimeter** — a boundary around **projects** (and VPC networks) and a list of **restricted
  (protected) services**; API calls reading protected-service data across the boundary are **blocked**.
  Modes: **dry-run** (logs violations, enforces nothing) and **enforced**.
- **Restricted/protected services** — the managed APIs (`storage.googleapis.com`,
  `bigquery.googleapis.com`, …) the perimeter governs; the **VPC accessible services** list further
  limits what a network inside can reach.
- **Access levels** — conditions (corp **IP** ranges, **device** trust, **identity**, **geo**) from
  Access Context Manager that grant controlled entry; attached to ingress rules.
- **Ingress / egress rules** — explicit allow rules: **ingress** (who/what outside may call in — by
  identity, source, access level) and **egress** (what inside may call out — to which identities/
  resources/services). The replacement for the older perimeter bridges in many designs.
- **Perimeter bridges** — allow two perimeters to share specific services without merging.

## Configuration and sizing
- Put projects sharing a **trust boundary** in one perimeter; list the **restricted services** that hold
  sensitive data. Grant controlled entry with **access levels** (corp IP/device) and precise
  **ingress/egress** rules — keep them minimal. Use **Private Google Access** + the
  `restricted.googleapis.com` VIP so in-perimeter traffic reaches APIs without leaving. **Always dry-run
  first** and analyze violation logs before enforcing.

## Security and IAM
- VPC-SC is a **second gate on top of IAM** — IAM says *who can*, VPC-SC says *from where/across which
  boundary*. Manage perimeters with `roles/accesscontextmanager.policyAdmin` (tightly held). Over-broad
  ingress/egress rules **defeat the perimeter** — review them like firewall rules. Combine with IAM
  least privilege; the perimeter stops exfiltration even when credentials are stolen.

## Cost levers
- VPC-SC itself is **free**; "cost" is **operational** — misconfigured perimeters break legitimate
  workflows (CI, cross-project pipelines). The lever is careful **dry-run + scoped rules** to avoid
  outages and rework, not billing.

## Scaling and limits
- Limits on **perimeters per policy**, **projects per perimeter**, access levels, and ingress/egress
  rules apply. Not all services are supported/restricted — check coverage. Changes are **eventually
  consistent** (propagation delay) and a wrong enforce can **break access org-wide** — hence dry-run.

## Operating procedure
1. **Provision** — enable Access Context Manager; ensure the org **access policy** exists; identify the
   projects and the **restricted services** to protect.
2. **Configure** — create the **service perimeter** in **dry-run** with the projects + restricted
   services, define **access levels** (corp IP/device/identity), and author minimal **ingress/egress
   rules**, via Terraform `google_access_context_manager_*`; wire **Private Google Access** /
   `restricted.googleapis.com` for in-perimeter API reachability.
3. **Secure** — keep ingress/egress rules minimal and reviewed; tightly hold the policy-admin role;
   enable Private Google Access; document the trust boundary.
4. **Verify** — apply [[verify-by-running]]: while in **dry-run**, generate real traffic and analyze
   **violation logs** to confirm only intended flows would break; then **enforce** and confirm an
   **in-perimeter call from an allowed context succeeds** while a **cross-perimeter exfiltration attempt
   is blocked** (e.g. copying a GCS object out to a project outside the perimeter fails). Capture the
   dry-run violations, the allowed call, and the blocked exfiltration.

## Inputs
The projects/services that form the trust boundary, the restricted services holding sensitive data, the
access contexts allowed to enter (corp IP/device/identity), the precise ingress/egress flows needed,
and whether to start in dry-run.

## Output
A service perimeter (dry-run then enforced) around the right projects with restricted services, scoped
access levels and minimal ingress/egress rules, Private Google Access wiring, plus verification of
dry-run violations being acceptable, an allowed in-perimeter call, and a blocked exfiltration attempt.

## Notes
- Gotchas: **always dry-run first** — a wrong enforced perimeter can break access org-wide; **over-broad
  ingress/egress rules defeat the control**; needs **Private Google Access / restricted VIP** so
  in-perimeter workloads reach APIs; **not every service is supported**; changes are **eventually
  consistent**; VPC-SC complements but does **not replace IAM**. 2nd consumer: the GCP role team builds
  the org data perimeter, not just the specialist. Cross-cloud peer concept: AWS SCPs + VPC endpoint
  policies / resource perimeters.
- IaC/CLI: Terraform `google_access_context_manager_access_policy`,
  `google_access_context_manager_service_perimeter` (with `spec` dry-run vs `status` enforced and
  `ingress_policies`/`egress_policies`), and `google_access_context_manager_access_level`. CLI
  `gcloud access-context-manager perimeters` / `levels` to configure, and violation-log analysis
  (`protoPayload` `VPC Service Controls`) plus a cross-boundary copy attempt to verify.
