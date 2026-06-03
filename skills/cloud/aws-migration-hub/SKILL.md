---
name: aws-migration-hub
description: Use when designing, provisioning, securing, or operating AWS Migration Hub — discovery (Application Discovery Service agent/agentless connector + Migration Hub Strategy Recommendations), application/server grouping, migration-status tracking across DMS / MGN / Server Migration tools, and portfolio/wave planning in a single home Region (AWS Migration Hub). Loads the Migration Hub knowledge: how to inventory a portfolio, group servers into applications, track migration progress from one pane of glass, and verify discovered/tracked state. Consumed by the Migration Hub specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they plan a migration program.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, migration-hub, discovery, portfolio, migration-tracking, wave-planning]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Migration Hub

A single place to discover your on-premises portfolio, group it into applications, and **track
migration progress** across multiple AWS migration tools. Migration Hub does not move servers or
data itself — it is the program-level inventory, planning, and status layer that aggregates the
tools that do (DMS, Application Migration Service / MGN, Server Migration Service).

## Core concepts and components
- **Home Region** — one Region stores all discovery and tracking data; chosen once per account.
- **Application Discovery Service (ADS)** — collects server inventory, performance, and network
  dependencies via the **discovery agent** (per-server) or **agentless connector** (vCenter OVA).
- **Applications / server groups** — logical groupings of discovered servers into migratable units
  and **waves** for the migration plan.
- **Migration tracking** — integrated tools (DMS, MGN, SMS) report status; Migration Hub shows a
  consolidated progress view per application/server.
- **Strategy Recommendations** — analyzes the portfolio and recommends a strategy per app
  (rehost/replatform/refactor) and target.
- **Migration Hub Orchestrator** — workflow templates that sequence migration tasks.

## Configuration and sizing
- Set the home Region first (it is sticky); deploy discovery agents/connectors to the source
  estate and let them collect for long enough to capture real usage and dependencies.
- Group servers into applications that match deployment/ownership boundaries; plan waves so
  dependent systems migrate together.

## Security and IAM
- ADS data is sensitive (inventory + network topology) — scope IAM to `discovery:*` and
  `mgh:*` for the program team; use the AWS-managed Migration Hub roles where provided.
- Restrict who can create/modify applications and import data; treat the home-Region account as
  the program system of record.

## Cost levers
- Migration Hub and ADS tracking are largely no-cost; the spend lives in the underlying tools
  (DMS instances, MGN replication, target compute). Decommission discovery agents after cutover.

## Scaling and limits
- Handles large portfolios (thousands of servers); collection completeness depends on agent
  coverage and collection window. One home Region per account is the main hard constraint.

## Operating procedure
1. **Provision** — choose the home Region (`aws migrationhubconfig create-home-region-control`)
   and enable Application Discovery Service.
2. **Configure** — deploy discovery agents/agentless connector, let collection run, then group
   servers into applications/waves; optionally run Strategy Recommendations.
3. **Secure** — least-privilege IAM for discovery/tracking, protect the inventory data, integrate
   the migration tools (DMS/MGN) so they report status.
4. **Verify** — apply [[verify-by-running]]: `aws discovery list-configurations` /
   `describe-configurations` confirms servers are discovered, `aws mgh list-progress-update-streams`
   and `list-migration-tasks` confirm tools are reporting tracked progress for the expected apps.

## Inputs
Source estate inventory + access for agents/connector, application/ownership boundaries, target
strategy preferences, the migration tools in use (DMS/MGN/SMS), home-Region choice, and
compliance constraints on inventory data.

## Output
A configured home Region with discovery enabled, a grouped application/wave portfolio, integrated
tool tracking, scoped IAM, and verification that servers are discovered and migration tasks report
status in the hub.

## Notes
- Gotchas: the home Region is effectively permanent — choose deliberately; agentless discovery
  misses some OS-level detail vs. the agent; Migration Hub only tracks, it never performs the
  move (use DMS for databases, MGN for servers); discovery agents keep collecting (and incurring
  source load) until removed; cross-account tracking needs the accounts wired to one home Region.
- IaC/CLI: discovery and tracking are mostly API/console-driven (limited Terraform coverage). CLI
  `aws migrationhubconfig create-home-region-control`, `aws discovery start-data-collection-by-agent-ids`,
  `list-configurations`, `aws mgh create-progress-update-stream`, `import-migration-task`,
  `list-migration-tasks`, `notify-migration-task-state`. Strategy Recommendations via
  `aws migrationhubstrategy`.
