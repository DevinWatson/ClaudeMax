---
name: gcp-application-integration
description: Use when designing, provisioning, securing, or operating Application Integration — Google Cloud's iPaaS (integration platform as a service) for connecting apps and automating business processes: integration flows on a visual canvas, triggers (API/scheduler/Pub-Sub/Cloud-Pub-Sub/event), tasks (data mapping, REST/SOAP calls, connector tasks, conditions/loops, sub-integrations, suspend/approval), the Integration Connectors fabric (managed connectors to SaaS, databases, and Google services), variables, authentication profiles, and error handling, plus regions, IAM, and cost (Application Integration). Loads the Application Integration knowledge: build an integration flow with a trigger and tasks, attach connectors and auth profiles, secure the identity, publish, and verify an execution. Consumed by the Application Integration specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add integration.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, application-integration, application-development, ipaas, connectors, integration-flow]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Application Integration

Google Cloud's **iPaaS** (integration platform as a service): a low-code/visual platform for
connecting applications and automating business processes. You build an **integration flow** on a
canvas — a trigger fires it, tasks transform data and call systems, and managed **connectors** reach
SaaS apps, databases, and Google services.

## Core concepts and components
- **Integrations (flows)** — the unit you author on a visual canvas: a sequence/graph of tasks driven
  by data variables, **published** as versions.
- **Triggers** — what starts a flow: **API trigger** (invoke via REST), **Cloud Scheduler**,
  **Pub/Sub**, **Cloud Pub/Sub**, and event triggers.
- **Tasks** — the building blocks: **Data Mapping** (transform variables), **REST/SOAP call**,
  **Connectors task** (call a managed connector), **For Each / conditions / edges**, **Call Sub-Integration**,
  **Suspend / approval**, **Email**, JavaScript, and more.
- **Integration Connectors** — a managed connectivity fabric: provisioned **connections** to SaaS
  (Salesforce, ServiceNow, …), databases (Cloud SQL, BigQuery, …), and Google services, invoked from
  the Connectors task.
- **Variables** — typed integration variables carry data between tasks (input/output/local).
- **Authentication profiles** — stored credentials (OAuth, API key, service account) referenced by
  REST/connector tasks instead of inline secrets.
- **Error handling** — task-level error catches, retries, and edge conditions.

## Configuration and sizing
- Pick the **trigger** (API / scheduler / Pub/Sub / event) for how the flow starts, lay out **tasks**
  with **data mapping** between **variables**, attach **Integration Connectors** connections for
  external systems, and reference **authentication profiles** for credentials. Choose the **region**.
  Sizing is managed — execution scales with the service; long-running flows use suspend/approval.

## Security and IAM
- Run integrations with a dedicated **service account** scoped least-privilege to only the
  connectors/resources used; reference credentials via **authentication profiles** /
  **Secret Manager**, never inline. Restrict who can edit/publish with Application Integration IAM
  roles (`roles/integrations.integrationEditor` vs admin), keep connector connections least-privilege
  to their target systems, enable VPC-SC where required, and audit via Cloud Audit Logs.

## Cost levers
- Cost is driven by **integration executions** (and node/step count) plus **Integration Connectors**
  connection-node/usage charges and any downstream service cost. Levers: minimize unnecessary
  executions (batch, debounce triggers), reuse connections, prune chatty per-record flows in favor of
  batched processing, and retire unused integrations/connections (idle connector nodes can bill).

## Scaling and limits
- Executions scale with the managed service; per-project/region quotas govern concurrent executions,
  connectors throughput, and execution duration — raise via the quotas page. Confirm regional
  availability. Connector throughput depends on provisioned connection nodes.

## Operating procedure
1. **Provision** — enable the Application Integration + Connectors APIs
   (`gcloud services enable integrations.googleapis.com connectors.googleapis.com`), set up the region
   (one-time client setup), create the runtime **service account**, and provision any **Integration
   Connectors** connections needed.
2. **Configure** — build the **integration flow**: choose the **trigger**, add **tasks** (data
   mapping, REST/connector calls, conditions/loops, sub-integrations), wire **variables**, attach
   **authentication profiles**, and **publish** a version.
3. **Secure** — scope the service account + connector connections least-privilege, store credentials
   in auth profiles/Secret Manager (never inline), restrict edit/publish IAM, enable VPC-SC.
4. **Verify** — apply [[verify-by-running]]: confirm the integration is **published/active**, then
   **execute** it (trigger the API/scheduler or run a test execution) and inspect the execution log to
   confirm tasks ran, mappings produced the expected output, and connectors returned data — capture
   the actual execution result.

## Inputs
The process to automate (systems + steps), the trigger type, the external systems needing connectors,
data mappings/variables, credential/auth requirements, region, and IAM scope.

## Output
An Application Integration setup (published integration flow with its trigger + tasks + variable
mappings, Integration Connectors connections, authentication profiles, scoped service account) plus
verification of a successful execution with the expected task outputs.

## Notes
- Gotchas: integrations are **published as versions** (publish to activate changes); credentials must
  live in auth profiles/Secret Manager, never inline in tasks; **Integration Connectors** connections
  are separate billable resources (idle connection nodes bill — retire unused ones); regional client
  setup is required up front; data-mapping type mismatches between variables are a common failure;
  long-running approval flows use the Suspend task. This is iPaaS — for code-defined GCP workflow
  orchestration use **Workflows**, for event routing use **Eventarc**; the AWS equivalent is AWS
  AppFlow/Step Functions, Azure is Logic Apps.
- IaC/CLI: Terraform covers Integration Connectors (`google_integration_connectors_connection`,
  `_endpoint_attachment`) and `google_project_service`; integration flows themselves are authored in
  the console/API and have limited Terraform support (deploy via API/`gcloud`). CLI/SDK: the
  Application Integration REST API (create/publish/execute integrations) and `gcloud` connectors
  commands.
