---
name: azure-microsoft-sentinel
description: Use when designing, provisioning, configuring, or operating Microsoft Sentinel — Azure's cloud-native SIEM + SOAR built on a Log Analytics workspace (Microsoft Sentinel). Covers onboarding Sentinel onto a workspace, data connectors (Azure activity, Entra ID, Defender/M365, AWS, GCP, Syslog/CEF, codeless connectors), analytics rules (scheduled KQL, near-real-time, Microsoft security, anomaly, threat intelligence) that create incidents, incident management and entities, threat hunting (hunting queries + livestream + bookmarks + notebooks), automation rules and SOAR playbooks (Logic Apps), workbooks for visualization, UEBA, watchlists, and content hub solutions. Loads the knowledge: onboard the workspace, wire connectors, author analytics rules, build hunting + automation, and verify incidents fire. Consumed by the azure-microsoft-sentinel specialist and by the Azure role team (azure-security-reviewer / azure-observability-engineer / azure-iac-engineer) when standing up the managed service (Microsoft Sentinel).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-microsoft-sentinel, security, siem, soar]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Sentinel

**Microsoft Sentinel** is Azure's **cloud-native SIEM + SOAR**, layered on a **Log Analytics workspace**. It
ingests security telemetry, runs **analytics rules** that raise **incidents**, supports proactive **threat
hunting**, and automates response with **playbooks**. This skill owns the **single-service Sentinel layer** —
onboarding the workspace, connectors, detections, hunting, automation, and workbooks.

## Core concepts and components
- **Workspace + onboarding** — Sentinel is enabled **on a Log Analytics workspace**; data lives in workspace
  tables (`SecurityEvent`, `SigninLogs`, `CommonSecurityLog`, etc.) queried with **KQL**.
- **Data connectors** — bring in telemetry: **Azure Activity**, **Entra ID** sign-in/audit, **Defender for
  Cloud / Microsoft 365 Defender**, **AWS** and **GCP**, **Syslog/CEF** via the AMA, **codeless connector
  platform (CCP)** and API-based sources. Connectors drive ingestion cost.
- **Analytics rules** — detections that create **incidents**: **scheduled** (KQL on a cadence), **near-real-
  time (NRT)**, **Microsoft security** (promote provider alerts), **anomaly**, and **threat intelligence**
  map rules. Rules define entity mapping, severity, and grouping into incidents.
- **Incidents & entities** — grouped alerts with **entities** (user, host, IP, file), investigation graph,
  status/severity, and assignment for SOC triage.
- **Threat hunting** — **hunting queries** (MITRE ATT&CK aligned), **livestream**, **bookmarks** to preserve
  findings, and **Jupyter notebooks** for advanced analysis.
- **Automation (SOAR)** — **automation rules** (triggers/conditions on incidents) and **playbooks** (Azure
  **Logic Apps**) that enrich, notify, or remediate; can run on incident or alert triggers.
- **Workbooks, UEBA, watchlists, content hub** — interactive **workbooks** for dashboards, **UEBA** behavioral
  analytics, **watchlists** for reference data, and the **content hub** for packaged solutions.

## Configuration and sizing
- Pick (or create) a dedicated **Log Analytics workspace**, set a **commitment tier** and **retention** for
  cost, enable the **connectors** that match your sources, install **content hub solutions** for those sources,
  then enable their **analytics rule** templates and tune thresholds to control noise.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Microsoft Sentinel Reader / Responder / Contributor** and
  **Automation Contributor** (for playbooks). Playbooks (Logic Apps) should use **managed identities**, not
  stored credentials, to reach target services. Restrict who can edit analytics rules and run playbooks; keep
  the workspace and its data access least-privilege.

## Cost levers
- Cost is dominated by **data ingestion + retention** in the workspace (Sentinel adds a per-GB analysis charge
  on top of Log Analytics). Levers: use **commitment tiers**, filter/transform at ingest (DCR transforms,
  **basic/auxiliary logs** for high-volume low-value data), set **table-level retention** and archive,
  exclude noisy sources, and prefer **interactive** vs long retention thoughtfully.

## Scaling and limits
- Sentinel scales to large workspaces and multi-workspace (Lighthouse/MSSP) architectures. Limits: NRT rules
  have constraints (single table, no joins on some); scheduled rule **frequency/lookback** bounds; ingestion
  has **latency** (detections aren't instant); **playbook** runs are billed Logic Apps executions; and
  cross-workspace queries add complexity. Retention/commitment changes have minimum periods.

## Operating procedure
1. **Provision** — onboard Sentinel onto a workspace via Terraform
   `azurerm_sentinel_log_analytics_workspace_onboarding` (on an `azurerm_log_analytics_workspace`), Bicep
   `Microsoft.OperationalInsights/workspaces` + `Microsoft.SecurityInsights/onboardingStates`, or
   `az sentinel` (extension) / `az monitor log-analytics workspace create`.
2. **Configure** — enable **data connectors** (`azurerm_sentinel_data_connector_*`), author **analytics rules**
   (`azurerm_sentinel_alert_rule_scheduled` / `_nrt` / `_ms_security_incident`), add **watchlists**, install
   **content hub** solutions, and build **workbooks**.
3. **Secure** — scope **Sentinel RBAC** (Reader/Responder/Contributor), give **playbooks** managed identities,
   and restrict rule/playbook editing; wire **automation rules** to playbooks for response.
4. **Verify** — apply [[verify-by-running]]: confirm connectors are **ingesting** (run a KQL query against the
   expected table), confirm an **analytics rule** is enabled and (via a test event or `Heartbeat`/sample data)
   that it **creates an incident**, and confirm an **automation rule/playbook** triggers. Capture state and
   result.

## Inputs
The target **Log Analytics workspace** (or one to create), the **data sources/connectors** to onboard, the
**detections** required (which analytics rule templates + custom KQL), the **retention/commitment** plan, the
**automation/SOAR** response actions (playbooks), and the SOC RBAC model.

## Output
A Microsoft Sentinel setup: Sentinel onboarded on a workspace, the right data connectors ingesting, analytics
rules enabled and tuned, hunting queries + workbooks in place, automation rules/playbooks wired for response,
scoped RBAC and managed-identity playbooks — plus verification that data ingests, a rule creates an incident,
and automation triggers.

## Notes
- Gotchas: ingestion **cost** is the main risk — filter/transform and use commitment tiers + basic logs;
  detections have **ingest latency** (not real-time); **NRT** rules have query restrictions; playbooks should
  use **managed identities** (no stored secrets); disabling a connector stops data but historical data remains
  billable by retention; tune rule thresholds or the SOC drowns in noise. Broad posture review/findings triage
  is the role team's call. 2nd consumer: the Azure role team (azure-security-reviewer /
  azure-observability-engineer / azure-iac-engineer). Cross-cloud peers: AWS Security Hub + Detective +
  CloudTrail/Lake, GCP Security Command Center + Chronicle.
- IaC/CLI: Terraform `azurerm_sentinel_log_analytics_workspace_onboarding`, `azurerm_sentinel_data_connector_*`,
  `azurerm_sentinel_alert_rule_scheduled` / `_nrt` / `_ms_security_incident`, `azurerm_sentinel_automation_rule`,
  `azurerm_sentinel_watchlist`; Bicep/ARM `Microsoft.SecurityInsights/*`. CLI `az sentinel` / `az monitor
  log-analytics workspace`.
