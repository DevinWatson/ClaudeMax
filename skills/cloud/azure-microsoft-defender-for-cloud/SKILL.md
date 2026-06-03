---
name: azure-microsoft-defender-for-cloud
description: Use when designing, provisioning, configuring, or operating Microsoft Defender for Cloud — the cloud-native CSPM + CWPP platform that hardens posture and protects workloads across Azure, AWS, GCP, and hybrid (Microsoft Defender for Cloud). Covers Cloud Security Posture Management (free foundational CSPM + Defender CSPM), secure score and security recommendations, regulatory compliance dashboard (MCSB, PCI, CIS, NIST, ISO), the per-resource-type Defender plans (Servers/CWPP, Storage, SQL, Containers/AKS, App Service, Key Vault, ARM, DNS, APIs), agentless scanning and the AMA/MDE agents, multicloud connectors, and exporting alerts/recommendations. Loads the knowledge: enable CSPM, turn on the right Defender plans, drive secure score, map compliance standards, and verify protection. Consumed by the azure-microsoft-defender-for-cloud specialist and by the Azure role team (azure-security-reviewer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Microsoft Defender for Cloud).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-microsoft-defender-for-cloud, security, cspm, cwpp]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Defender for Cloud

**Microsoft Defender for Cloud (MDC)** is Azure's **Cloud Security Posture Management (CSPM)** plus
**Cloud Workload Protection Platform (CWPP)**. The free foundational layer continuously assesses
configuration, drives a **secure score**, and maps findings to compliance standards; paid **Defender plans**
add threat protection (CWPP) per resource type. This skill owns the **single-service MDC layer** — enabling
CSPM, selecting Defender plans, and operating recommendations — across Azure and connected multicloud accounts.

## Core concepts and components
- **CSPM** — continuous assessment against the **Microsoft Cloud Security Benchmark (MCSB)**. **Foundational
  CSPM** is free; **Defender CSPM** (paid) adds agentless scanning, attack path analysis, the cloud security
  graph, data-aware posture, and governance rules.
- **Secure score** — a single weighted percentage rolled up from grouped **security recommendations**; raising
  it is the core posture workflow. Each recommendation has remediation steps and (often) **quick fix**.
- **Regulatory compliance** — a dashboard mapping resources to standards (MCSB by default, plus PCI DSS, CIS,
  NIST 800-53, ISO 27001) so you track pass/fail controls and produce audit evidence.
- **Defender plans (CWPP)** — per-resource-type protection: **Defender for Servers** (P1/P2; integrates
  Microsoft Defender for Endpoint, vulnerability assessment, FIM, JIT), **Storage**, **SQL** (+ on machines),
  **Containers/AKS**, **App Service**, **Key Vault**, **Resource Manager**, **DNS**, **APIs**, **Cosmos DB**.
- **Agents & agentless** — **agentless scanning** (disk snapshots) for VMs/containers; the **Azure Monitor
  Agent (AMA)** and **Microsoft Defender for Endpoint (MDE)** where deep telemetry is needed.
- **Multicloud** — **security connectors** onboard **AWS** and **GCP** accounts for CSPM + workload protection.
- **Recommendations & alerts** — findings flow to recommendations (posture) and **security alerts** (threats);
  both can be **exported** continuously to Log Analytics, Event Hubs, or Microsoft Sentinel.

## Configuration and sizing
- Enable **foundational CSPM** broadly, turn on **Defender CSPM** and the **Defender plans** that match the
  resources actually present, scope plans at the **subscription** (or connector) level, set **auto-provisioning**
  for agents, and choose **Servers P1 vs P2** (P2 adds agentless scanning, vuln assessment, EDR, FIM, JIT).

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Security Admin** / **Security Reader** built-in roles, plus
  Owner/Contributor to change plans. Use **managed identities** for connectors and continuous export targets.
  Apply **governance rules** to assign recommendation owners + due dates, and restrict who can dismiss/exempt
  findings. Multicloud connectors use scoped cross-cloud roles (AWS IAM role, GCP workload identity).

## Cost levers
- Foundational CSPM is **free**; Defender plans bill per **resource/hour** (per server, per 10K Storage txns,
  per vCore, per container core-hour, etc.). Levers: enable only the **plans for resources you run**, choose
  **Servers P1** if you don't need agentless/EDR/FIM, scope plans per-subscription, exclude non-prod where
  acceptable, and use **agentless** scanning to avoid per-agent overhead.

## Scaling and limits
- MDC scales across many subscriptions via **management-group** enablement and multicloud connectors. Limits:
  some features require an **agent** (AMA/MDE) and OS support; **agentless** scanning has a snapshot refresh
  interval (not real-time); plan availability varies by **resource type and region**; secure score updates are
  periodic, not instant; and dismissing a recommendation needs an explicit **exemption**.

## Operating procedure
1. **Provision** — enable **foundational CSPM** and turn on chosen **Defender plans** per subscription via
   Terraform `azurerm_security_center_subscription_pricing` (one per resource_type, `tier = "Standard"`),
   Bicep `Microsoft.Security/pricings`, or `az security pricing create`. Onboard multicloud via
   `azurerm_security_center_*` connector resources / security connectors.
2. **Configure** — set **auto-provisioning** / agent settings, enable **Defender CSPM** features, add
   **regulatory compliance** standards, configure **continuous export** to Log Analytics/Sentinel/Event Hub,
   and define **governance rules** (owners + due dates).
3. **Secure** — assign **Security Admin/Reader** RBAC least-privilege, use **managed identities** for exports
   and connectors, and control who can dismiss/exempt findings.
4. **Verify** — apply [[verify-by-running]]: confirm plans are **Standard**
   (`az security pricing list`), confirm the **secure score** and that recommendations populate
   (`az security task list` / portal), and confirm a **continuous export** target receives data. Capture
   state and result.

## Inputs
The subscriptions/management groups in scope, which **resource types** run (to pick Defender plans), the
**Servers tier** (P1/P2) needed, **compliance standards** to track, **multicloud** accounts to connect, the
**continuous export** destination (Sentinel/Log Analytics/Event Hub), and the RBAC/ownership model.

## Output
A Defender for Cloud setup: foundational CSPM + Defender CSPM enabled, the correct per-resource Defender plans
turned on, regulatory compliance standards mapped, continuous export wired to Sentinel/Log Analytics, scoped
RBAC and governance rules — plus verification that plans are Standard, secure score/recommendations populate,
and export is flowing.

## Notes
- Gotchas: turning on **every** Defender plan everywhere is expensive — enable per resource type; **secure
  score** changes lag (not real-time); **agentless** scanning is snapshot-based, not continuous; some
  recommendations need an **agent** (AMA/MDE) before they evaluate; dismissing a finding requires an explicit
  **exemption**, not a delete; multicloud needs connector roles in AWS/GCP. Broad posture review/findings
  triage is the role team's call. 2nd consumer: the Azure role team (azure-security-reviewer /
  azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS Security Hub + GuardDuty, GCP Security
  Command Center.
- IaC/CLI: Terraform `azurerm_security_center_subscription_pricing`, `azurerm_security_center_setting`,
  `azurerm_security_center_contact`, `azurerm_security_center_auto_provisioning`; Bicep/ARM
  `Microsoft.Security/pricings`. CLI `az security pricing create/list` / `az security task list`.
