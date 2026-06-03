---
name: gcp-security-command-center
description: Use when designing, provisioning, securing, or operating Security Command Center (SCC) — Google Cloud's centralized security/risk platform that surfaces misconfigurations, vulnerabilities, and threats across an organization (Security Command Center). Covers service tiers (Standard/Premium/Enterprise), findings and sources, the built-in detectors (Security Health Analytics, Web Security Scanner, Event/Container/VM Threat Detection), Security Posture definitions/deployments and drift, attack-path simulation and exposure scoring, mute rules and finding lifecycle, and continuous exports to Pub/Sub/BigQuery/SIEM, plus IAM, cost, and limits. Loads the SCC knowledge: enable at the org, choose tier, manage findings/sources, define posture, wire exports, and verify a finding surfaces. Consumed by the SCC specialist and by the GCP role team (gcp-security-reviewer, which does cross-cutting posture/review/triage) when wiring centralized findings (Security Command Center).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, security-command-center, security, findings, posture, threat-detection]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Security Command Center (SCC)

Google Cloud's centralized **security and risk management** platform. It aggregates **findings** —
misconfigurations, vulnerabilities, and threats — from built-in and integrated **sources** across an
**organization** (or project, for activation), scores exposure, and routes findings to remediation/SIEM. It
is GCP's single pane of glass for cloud security posture.

## Core concepts and components
- **Service tiers** — **Standard** (free: Security Health Analytics basics, Web Security Scanner custom
  scans, some detectors), **Premium** (full Security Health Analytics, Event/Container/VM Threat Detection,
  Web Security Scanner managed scans, attack path simulation, posture, compliance reports), and
  **Enterprise** (Premium plus multi-cloud, SIEM/SOAR via integrated Google SecOps, deeper case management).
- **Findings & sources** — a **finding** is a record of a security issue; a **source** is what produces it
  (built-in detectors or third-party/integrated tools). Findings have **state** (active/inactive),
  **severity**, and a **mute** state.
- **Built-in detectors** — **Security Health Analytics** (misconfiguration posture: public buckets, open
  firewalls, missing CMEK, weak IAM), **Web Security Scanner** (app vulnerabilities), **Event Threat
  Detection** (log-based threat signals), **Container Threat Detection** and **VM Threat Detection**.
- **Security Posture** — define a **posture** (set of policies/detectors), **deploy** it to org/folder/
  project, and detect **drift** from the defined posture.
- **Attack path simulation / exposure scoring** — model how an attacker could reach high-value resources;
  prioritize by **attack exposure score** rather than raw severity.
- **Mute rules** — suppress known-accepted findings to cut noise without resolving the underlying config.
- **Continuous exports** — stream findings to **Pub/Sub**, **BigQuery**, or a **SIEM** for downstream
  workflows and alerting.

## Configuration and sizing
- Activate at the **organization** level for full coverage (project-level activation is narrower). Choose
  **Premium/Enterprise** when you need threat detection, posture, attack-path simulation, or SIEM
  integration. Define a **Security Posture** that codifies your baseline, wire **continuous exports** to your
  alerting/SIEM, and use **mute rules** for accepted risk to keep the queue actionable.

## Security and IAM
- Grant least-privilege SCC IAM: `roles/securitycenter.adminViewer` / `...findingsViewer` (read),
  `...findingsEditor` (manage finding state/mute), and admin roles for settings/posture to a narrow set.
  Activation and posture changes are **org-level** and high-impact — restrict who can change tier, mute
  rules, and posture. Treat exported findings as sensitive (they describe weaknesses).

## Cost levers
- **Standard** is free. **Premium/Enterprise** are typically billed on **consumption/resource volume** (and
  enterprise commitments). Levers: scope activation appropriately, use **mute rules** to reduce noise (not
  cost directly, but operational load), and control **BigQuery export** storage/query costs for retained
  findings.

## Scaling and limits
- Scales to org-wide, multi-project (and multi-cloud in Enterprise) estates. Practical limits: detector
  coverage by tier, **continuous export** count/throughput, mute-rule counts, and finding retention. Tuning
  detectors and mute rules is the main effort at scale to keep signal-to-noise high.

## Operating procedure
1. **Provision** — **activate SCC at the organization** (or project) and select the **tier** (Standard/
   Premium/Enterprise) for the detectors and capabilities you need.
2. **Configure** — enable the **built-in detectors** (Security Health Analytics, threat detection, Web
   Security Scanner), define a **Security Posture** and deploy it, set **mute rules** for accepted risk, and
   wire **continuous exports** to Pub/Sub/BigQuery/SIEM.
3. **Secure** — grant least-privilege SCC IAM, restrict who can change tier/posture/mute rules, and protect
   exported finding data.
4. **Verify** — apply [[verify-by-running]]: list active findings
   (`gcloud scc findings list <org> --filter="state=\"ACTIVE\""`), introduce a **known-bad test config**
   (e.g. a public bucket) and confirm Security Health Analytics **raises a finding**, confirm a **mute rule**
   suppresses an accepted one, and confirm the **continuous export** delivers to Pub/Sub/BigQuery — capture
   the finding and the export delivery.

## Inputs
The org/project scope, tier choice (Standard/Premium/Enterprise) and required detectors, posture baseline to
enforce, mute/accepted-risk policy, export destinations (Pub/Sub/BigQuery/SIEM), the SCC IAM model, and cost
constraints.

## Output
An SCC configuration (org-level activation at the right tier, enabled detectors, a deployed Security Posture,
mute rules, continuous exports) with least-privilege IAM, plus verification that a test misconfiguration
surfaces as a finding and exports deliver.

## Notes
- Gotchas: **tier gates capability** — threat detection, posture, and attack-path simulation are
  Premium/Enterprise (Standard alone misses them); **project-level activation** misses org-wide coverage;
  unmanaged finding volume becomes noise — **mute rules** and **attack-exposure scoring** keep it
  actionable; SCC **surfaces** issues but does not fix them (remediation is the service owners' / gcp-iac-
  engineer's job); exported findings describe weaknesses and are **sensitive**; posture **drift** detection
  needs the posture defined and deployed first.
- IaC/CLI: Terraform `google_scc_source`, `google_scc_notification_config` (continuous export to Pub/Sub),
  `google_scc_mute_config`, `google_scc_v2_*` and Security Posture resources
  (`google_securityposture_posture`, `..._posture_deployment`), plus `google_project_service`. CLI
  `gcloud scc findings list`, `gcloud scc sources list`, `gcloud scc notifications` to manage and verify.
