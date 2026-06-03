---
name: aws-detective
description: Use when designing, provisioning, securing, or operating Amazon Detective — security investigation and root-cause analysis built on an automatically maintained behavior graph from CloudTrail management events, VPC Flow Logs, GuardDuty findings, and EKS audit logs, finding groups that correlate related findings/entities into a single investigation, entity profiles and time-range scoping, investigations that surface indicators of compromise and MITRE ATT&CK tactics, the behavior-graph ingestion model, and delegated-administrator org enablement with member accounts (Amazon Detective). Loads the Detective knowledge: enable the graph, pivot across entities, and verify ingestion. Consumed by the Detective specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they add investigation tooling.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, detective, security-investigation, behavior-graph, threat-hunting, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Detective

AWS's **security investigation** service. It automatically builds and maintains a **behavior
graph** of activity across your accounts and lets analysts pivot through entities (accounts,
roles, IPs, instances, findings) to determine the **root cause and scope** of suspicious
activity. Detective investigates; it does not detect (GuardDuty/others raise the findings).

## Core concepts and components
- **Behavior graph** — a linked data model continuously built from **CloudTrail management
  events, VPC Flow Logs, GuardDuty findings, and Amazon EKS audit logs** (and Amazon Security
  Lake where integrated). It retains roughly a year of data for time-scoped analysis.
- **Entity profiles** — per-entity (IAM role/user, AWS account, IP address, EC2 instance, EKS
  cluster, finding) pages showing baseline vs anomalous behavior over selectable time ranges.
- **Finding groups** — Detective correlates related GuardDuty findings and entities into a
  single **finding group**, summarizing a likely incident instead of isolated alerts.
- **Investigations** — automated analysis that flags **indicators of compromise (IoCs)** and
  maps activity to **MITRE ATT&CK** tactics for a role or resource over a window.
- **Source-data ingestion** — once enabled, Detective ingests directly; you do not build the
  graph, but ingestion requires the source data to exist (CloudTrail on, GuardDuty enabled).
- **Org model** — a **delegated administrator** enables Detective and manages member accounts;
  the graph spans the org for cross-account investigation.

## Configuration and sizing
- Enable Detective in the same org/delegated-admin model as GuardDuty for best correlation, and
  ensure the underlying sources (CloudTrail, VPC Flow Logs, GuardDuty, EKS audit logs) are on so
  the graph is populated. Add members so investigations follow activity across accounts. Optional
  data sources (EKS audit logs) are toggled per graph.

## Security and IAM
- Investigation access is read-heavy but reveals sensitive activity — grant the Detective
  console/API (`detective:*`, `detective:StartInvestigation`, `GetInvestigation`) to the SecOps/IR
  team only. Member-account enablement uses invitations or org auto-enable. Detective does not
  modify resources, so blast radius is limited to data exposure.

## Cost levers
- Billed on the **volume of ingested data** (GB) per source per account per month, with a free
  trial. Levers: only enable Detective where investigation is actually needed, prune noisy
  accounts, and toggle off optional high-volume sources (EKS audit logs) where unused.

## Scaling and limits
- Graph data retention is ~1 year; member-account and graph quotas apply. Ingestion scales with
  source-data volume; first-time graph population takes time before profiles are meaningful.

## Operating procedure
1. **Provision** — designate the Detective **delegated administrator**, create the behavior
   graph, and enable it via Terraform `aws_detective_graph` /
   `aws_detective_organization_admin_account` or `aws detective create-graph`.
2. **Configure** — add member accounts (`aws_detective_member` / `create-members` or org
   auto-enable), toggle optional data sources (EKS audit logs), and confirm CloudTrail/VPC Flow
   Logs/GuardDuty are feeding the graph.
3. **Secure** — grant investigation access only to the IR/SecOps team and integrate with the
   GuardDuty/Security Hub workflow so findings open Detective investigations directly.
4. **Verify** — apply [[verify-by-running]]: `aws detective list-graphs` confirms the graph
   exists, `aws detective list-members` confirms members are ENABLED, and the console/API
   `start-investigation` + `get-investigation` (or a finding-group/entity profile) returns
   populated data for a known entity rather than an empty graph — capture the actual output.

## Inputs
The accounts to investigate, org/delegated-admin model, which source data is available
(CloudTrail, VPC Flow Logs, GuardDuty, EKS audit logs), the IR/SecOps access list, and the
GuardDuty/Security Hub integration points.

## Output
The Detective configuration (behavior graph, delegated admin, member accounts, optional data
sources, IR access wiring) as code, plus verification that the graph exists, members are
enabled, and an investigation/entity profile returns populated data.

## Notes
- Gotchas: Detective **investigates but does not detect** — pair it with GuardDuty as the
  finding source; the graph needs **time and live source data** to populate (empty profiles right
  after enablement are expected); CloudTrail and VPC Flow Logs must already be enabled to feed it;
  data retention is bounded (~1 year), so investigate before evidence ages out; ingestion-volume
  billing can surprise on chatty accounts.
- IaC/CLI: Terraform `aws_detective_graph`, `aws_detective_member`,
  `aws_detective_organization_admin_account`, `aws_detective_organization_configuration`. CLI
  `aws detective create-graph`, `list-graphs`, `create-members`, `list-members`,
  `start-investigation`, `get-investigation`, `update-datasource-packages`. CloudFormation
  `AWS::Detective::Graph`, `AWS::Detective::MemberInvitation`,
  `AWS::Detective::OrganizationAdmin`.
