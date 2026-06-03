---
name: gcp-looker
description: Use when designing, provisioning, securing, or operating Looker — Google Cloud's enterprise business intelligence and embedded analytics platform built on LookML, its semantic modeling language (models, explores, views, dimensions/measures, derived tables, PDTs), with Looks, dashboards, the SQL Runner, scheduled deliveries, the API/SDK, embedded analytics (signed/SSO embed), and Git-backed LookML projects, plus connections, user/group/role permissions and access filters, and cost. Loads the Looker knowledge: model LookML, build explores and dashboards, configure database connections and row-level access, embed analytics, and verify a query and dashboard render correctly. Consumed by the Looker specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle BI/semantic-layer workloads (Looker).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, looker, data-analytics, business-intelligence, lookml, dashboards]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Looker

Google Cloud's enterprise **business intelligence and embedded analytics** platform. Its
differentiator is **LookML** — a Git-versioned semantic modeling layer that defines metrics and
relationships once, so all queries, dashboards, and embeds resolve to consistent, governed SQL pushed
down to the underlying warehouse.

## Core concepts and components
- **LookML** — the modeling language: **models** (which connection + explores), **explores** (joinable
  starting points), **views** (map to tables/derived tables), **dimensions** and **measures**, and
  **derived tables** / **persistent derived tables (PDTs)** with datagroup-based caching.
- **Looks / dashboards** — saved single visualizations (**Looks**) and multi-tile **dashboards** (and
  newer dashboards-as-code / dashboard LookML).
- **SQL Runner** — run raw SQL against a connection for debugging/exploration.
- **Connections** — database connections (BigQuery, and many SQL dialects) with their own service
  account/credentials; the dialect determines pushdown SQL.
- **Deliveries / scheduling** — scheduled email/Slack/webhook/GCS deliveries of Looks and dashboards.
- **API / SDK** — REST API and SDKs for automation, query, and admin.
- **Embedded analytics** — **private** (SSO) and **public/signed** embeds to put dashboards/explores
  in external apps.

## Configuration and sizing
- Looker is a managed platform (Looker — Google Cloud core, or Looker original). Configure the
  **connection** (warehouse + service account), the **Git** repo for the LookML project, and **PDT**
  build connections/datagroups. Right-size by pushing aggregation to the warehouse (Looker generates
  SQL, the warehouse does the compute) and using aggregate awareness + PDTs to cut repeated scans.

## Security and IAM
- Govern with **roles** (sets of permissions) + **model sets** assigned to **groups**; enforce
  **row-level security** via **access filters** / `access_grant`s and `user_attribute`s. Connection
  credentials use least-privilege warehouse service accounts. For embeds, use **signed/SSO embed** with
  scoped user attributes — never expose admin credentials. Manage platform IAM
  (`roles/looker.instanceAdmin` / Looker admin) least-privilege; audit via Looker's audit logs +
  Cloud Audit Logs.

## Cost levers
- The Looker platform is licensed; the variable warehouse cost is driven by the SQL Looker generates.
  Levers: **caching** via datagroups, **PDTs** and **aggregate awareness** to avoid re-scanning, sane
  default filters/limits on explores so analysts don't run unbounded scans, BI Engine on BigQuery, and
  scheduled-delivery frequency. Push compute to the warehouse rather than fetching raw data.

## Scaling and limits
- Concurrency and query performance are bounded by the underlying warehouse and the LookML query
  patterns; PDTs and caching reduce load. Limits: API rate limits, PDT build concurrency on the PDT
  connection, and embed/SSO configuration constraints. Scale by warehouse capacity + aggressive
  caching/aggregation.

## Operating procedure
1. **Provision** — provision the Looker instance/project, create the **database connection** (with a
   least-privilege warehouse service account) and the **Git** repository for the LookML project; set
   up the PDT build connection/datagroups.
2. **Configure** — author LookML (models, explores, views, dimensions/measures, derived tables/PDTs),
   build Looks and dashboards, configure scheduled deliveries, and set up **embed** (SSO/signed) if
   needed; commit + deploy LookML to production.
3. **Secure** — define roles/model sets/groups, add row-level **access filters** with user attributes,
   scope the connection service account and embed user attributes least-privilege, and review audit
   logs.
4. **Verify** — apply [[verify-by-running]]: validate the LookML (`LookML validator` / API content
   validation), run an explore/query via the **API** or **SQL Runner** and confirm correct results and
   the generated SQL, then confirm a dashboard renders and (if embedded) the signed/SSO embed loads
   with the right access filter applied — capture the query result and validation status.

## Inputs
Warehouse + connection details, the metrics/dimensions to model, explore/join requirements, dashboard
and delivery needs, embedding requirements (SSO/signed), access-control model (groups/roles/row-level),
Git repo, and cost/performance constraints.

## Output
A Looker setup (connection, Git-backed LookML model with explores/views/measures and PDTs, Looks and
dashboards, scheduled deliveries, embed config) with role/model-set/access-filter governance, plus
verification of valid LookML, a correct query, and a rendering dashboard/embed.

## Notes
- Gotchas: LookML changes must be **committed and deployed to production** to take effect (dev mode is
  isolated); PDTs need a writable build connection and correct datagroups or they rebuild too often /
  go stale; **access filters** are the row-level security mechanism — misconfiguring them leaks data
  across tenants, especially in embeds; symmetric aggregates affect measure math on fan-out joins;
  caching is datagroup-driven, not time-of-day. Looker owns the MANAGED BI / semantic-layer service
  (the GCP analog of **AWS QuickSight**); cloud-agnostic metric/pipeline DESIGN is data/etl-architect's
  and ad-hoc query tuning is data/sql-optimizer's.
- IaC/CLI: LookML lives in a **Git** repository (the source of truth); platform/connection automation
  uses the **Looker API/SDK** (and `terraform-provider-looker` community providers). For Looker (Google
  Cloud core) instances, Terraform `google_looker_instance` and `google_project_service` provision the
  instance.
