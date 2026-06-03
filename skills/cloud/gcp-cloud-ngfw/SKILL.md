---
name: gcp-cloud-ngfw
description: Use when designing, provisioning, securing, or operating Cloud Next Generation Firewall (Cloud NGFW) — Google Cloud's fully distributed, stateful, cloud-native network firewall enforced at each VM/interface, managed through global and regional network firewall policies plus hierarchical (org/folder) policies, with FQDN/geo/Threat Intelligence objects and a Layer-7 intrusion prevention service (IPS). Loads the Cloud NGFW knowledge: write firewall policies and rules (ingress/egress, priority, target by tag/secure-tag/service-account), use address groups, FQDN, geolocation and Threat Intelligence matches, enable the Enterprise tier IPS and TLS inspection with packet mirroring/endpoints, plus IAM, logging, and cost/scaling levers. Consumed by the Cloud NGFW specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they build network segmentation and intrusion prevention (Cloud Next Generation Firewall).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-ngfw, networking, firewall-policy, intrusion-prevention, secure-tags, segmentation]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Next Generation Firewall

Cloud NGFW is Google Cloud's **fully distributed, stateful** network firewall, enforced inline at every
VM/interface (no chokepoint appliance). You manage it through **firewall policies** rather than only
legacy VPC firewall rules, layering org-wide guardrails with granular workload controls, and at the
Enterprise tier add Layer-7 **intrusion prevention** and **TLS inspection**.

## Core concepts and components
- **Firewall policy types** — **hierarchical firewall policies** (org/folder, top-priority guardrails),
  **global** and **regional network firewall policies** (associated to VPC networks), and legacy **VPC
  firewall rules** (still supported). Rules are evaluated by **priority** with explicit/implied
  goto_next/allow/deny.
- **Rules** — ingress/egress, **priority**, action **allow/deny/goto_next/apply_security_profile_group**,
  matched on IP ranges, ports/protocols, and **targets** via **secure tags**, network tags, or service
  accounts (deny-by-default ingress, default-allow egress baseline).
- **Network objects** — **address groups** (reusable IP sets), **FQDN objects** (domain-based rules),
  **geolocation** (region-code matches), and **Threat Intelligence** lists (known-malicious IPs/Tor/etc.).
- **Secure tags** — IAM-governed, org-scoped tags bound to resources for **micro-segmentation** that's
  independent of IP, replacing fragile IP-based rules.
- **Enterprise tier (IPS)** — the **intrusion prevention service** via **security profiles / security
  profile groups** inspects Layer-7 traffic for threats; **TLS inspection** decrypts for deep inspection;
  uses **firewall endpoints** zonally.

## Configuration and sizing
- Layer policies: **hierarchical** for org guardrails, **global/regional network firewall policies** for
  VPC-level rules, scoped by **secure tags** for micro-segmentation. Keep ingress **deny-by-default** and
  tighten egress. Use **address groups / FQDN / geo / Threat Intelligence** objects instead of hardcoded
  IPs. For threat detection, enable the **Enterprise tier** with **security profile groups** (IPS) and,
  where required, **TLS inspection** with firewall endpoints.

## Security and IAM
- Enforce **least-privilege** rules: deny-by-default ingress, scope egress, target by **secure tag /
  service account** not broad ranges, and avoid `0.0.0.0/0` to sensitive ports. Use **Threat
  Intelligence** and **geo** blocks for known-bad sources and the **IPS** profile for L7 threats. Govern
  **secure tags** and policy edits with least-privilege IAM (`roles/compute.orgFirewallPolicyAdmin`,
  `roles/compute.networkAdmin`, `roles/compute.securityAdmin`). Enable **firewall rules logging** and IPS
  logging.

## Cost levers
- Standard-tier firewall policies are largely free (egress still applies); the **Enterprise tier (IPS,
  TLS inspection, firewall endpoints)** is billed per **firewall-endpoint hour** and **data inspected**.
  Scope IPS/TLS inspection to the workloads that need it, reuse **address groups**, and consolidate
  policies to control inspection cost.

## Scaling and limits
- Enforcement is **fully distributed** per-VM, so it scales with the fleet without a bottleneck. Limits:
  rules per policy, policies per scope, associations per network, address-group/FQDN entry counts, and
  firewall endpoints per zone. Rule evaluation follows hierarchical → network-policy → VPC rule precedence
  by priority. Enterprise features require endpoints in the relevant zones.

## Operating procedure
1. **Provision** — create the **firewall policy** (Terraform
   `google_compute_network_firewall_policy` / `..._region_...` or
   `google_compute_firewall_policy` for hierarchical) and **associate** it to the VPC network/org/folder.
2. **Configure** — add **rules** (`google_compute_network_firewall_policy_rule`) with priority,
   ingress/egress, targets by **secure tag / service account**, and matches using **address groups / FQDN
   / geo / Threat Intelligence**; for L7 protection attach **security profile groups** (IPS) and **TLS
   inspection** with **firewall endpoints** (Enterprise tier).
3. **Secure** — enforce deny-by-default ingress, tighten egress, govern secure tags and policy IAM
   least-privilege, and enable **firewall rules logging** and IPS logging.
4. **Verify** — apply [[verify-by-running]]: list **effective firewall rules** for a target instance
   (`gcloud compute network-firewall-policies ... describe`, effective-firewalls), run **connectivity
   tests** to confirm allowed/blocked paths (`gcloud network-management connectivity-tests`), send a
   probe matched by a deny/Threat-Intel rule and confirm it's blocked, and (Enterprise) confirm the **IPS**
   flags a test threat in logs — capture the effective-rules listing and connectivity/IPS results.

## Inputs
Segmentation model (secure tags / service accounts), org guardrails (hierarchical policies), VPC scope
(global vs regional policies), allow/deny intent and network objects (address groups/FQDN/geo/Threat
Intel), L7/IPS and TLS-inspection requirements (Enterprise tier), IAM model, logging requirements, and
cost target.

## Output
A layered firewall posture (hierarchical guardrails + global/regional network firewall policies, secure-tag
micro-segmentation, address-group/FQDN/geo/Threat-Intel rules, optional Enterprise IPS + TLS inspection
endpoints) with deny-by-default ingress, least-privilege policy IAM and firewall/IPS logging, plus
verification of effective rules, connectivity tests, and threat detection.

## Notes
- Gotchas: rule **precedence** spans hierarchical → network firewall policy → legacy VPC rules by priority
  — a high-priority allow upstream can override workload denies; mixing **legacy VPC firewall rules** and
  **network firewall policies** needs care to avoid surprises; **secure tags** (IAM-governed) differ from
  network tags — don't conflate them; **FQDN/Threat-Intel** rules depend on resolution/feed freshness;
  **IPS/TLS inspection** require the **Enterprise tier** and zonal **firewall endpoints** (cost + setup);
  default ingress is deny and egress allow — tighten egress for sensitive workloads.
- IaC/CLI: Terraform `google_compute_network_firewall_policy` (+ `..._rule`, `..._association`),
  `google_compute_region_network_firewall_policy`, `google_compute_firewall_policy` (hierarchical),
  `google_network_security_address_group`, `google_network_security_security_profile` /
  `..._security_profile_group`, `google_network_security_firewall_endpoint`. CLI `gcloud compute
  network-firewall-policies` / `... firewall-policies`, `gcloud network-security` (profiles/endpoints);
  verify with effective-firewalls and `gcloud network-management connectivity-tests`.
