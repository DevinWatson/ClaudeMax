---
name: azure-data-factory
description: Use when designing, provisioning, securing, or operating Azure Data Factory — the managed cloud ETL/ELT and data-integration orchestration service (Azure Data Factory). Covers the factory, pipelines and activities (Copy, Lookup, ForEach, control flow), datasets and linked services, integration runtimes (Azure/AutoResolve, Self-Hosted for on-prem/private, Azure-SSIS), mapping data flows (Spark-backed transforms), triggers (schedule/tumbling-window/event), Git + CI/CD with ARM, and managed VNet + private endpoints. Loads the knowledge: create the factory, define linked services/datasets, build pipelines/data flows, pick integration runtimes, secure with Entra/managed identity, and verify a pipeline run. Consumed by the azure-data-factory specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Data Factory).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-data-factory, analytics, etl, orchestration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Data Factory

The managed **ETL/ELT and data-integration orchestration** service. This skill owns the **Azure
managed-service layer** — the factory, linked services, datasets, pipelines/data flows, integration runtimes,
triggers, and CI/CD — and verifying a pipeline runs; it defers **pipeline/data-model design intent** and
**query/transform logic tuning** to the data engine teams.

## Core concepts and components
- **Data Factory** — the top-level resource (`azurerm_data_factory`) hosting pipelines, datasets, linked
  services, data flows, and triggers; managed via Studio, ARM/Bicep, or the azurerm provider.
- **Pipelines & activities** — a **pipeline** orchestrates **activities**: **Copy** (move data),
  **Lookup**/**GetMetadata**, control flow (**ForEach**, **If**, **Until**, **ExecutePipeline**), and external
  compute (Databricks/Synapse/HDInsight/Stored Proc).
- **Linked services & datasets** — a **linked service** is a connection (storage, SQL, SaaS, on-prem); a
  **dataset** is the shape/location of data within it. Parameterize both for reuse.
- **Integration runtime (IR)** — the compute that moves/transforms data: **Azure (AutoResolve)** managed IR,
  **Self-Hosted IR** (on-prem/private-network bridge), and **Azure-SSIS IR** (lift-and-shift SSIS packages).
- **Mapping data flows** — **Spark-backed**, visually-designed transformations (joins, aggregates, derived
  columns) executed on a managed Spark cluster — no code.
- **Triggers** — **schedule**, **tumbling-window** (backfill/dependency-aware), and **event** (storage blob
  created/deleted) triggers.

## Configuration and sizing
- Create the **factory** (with **Git integration** for source control), define **parameterized linked
  services/datasets**, build **pipelines** (Copy + control flow) and **mapping data flows** where transforms
  are needed, pick the right **IR** (Azure for cloud, **Self-Hosted** for on-prem/private, SSIS for legacy
  packages), and wire **triggers**. Size data-flow Spark clusters (compute type + core count + TTL).

## Security and IAM
- **Entra ID** auth + **Azure RBAC** (Data Factory Contributor); use the factory's **managed identity** to
  authenticate to storage/SQL/Key Vault (avoid embedded secrets — store them in **Key Vault** linked
  services); **managed VNet + managed private endpoints** so the Azure IR reaches sources privately;
  **Self-Hosted IR** for secure on-prem connectivity. Scope least-privilege on every linked service.

## Cost levers
- Billing = **pipeline activity runs** + **data-flow vCore-hours** + **IR usage** (+ Self-Hosted IR is your
  own VMs). Levers: **reuse data-flow clusters** via **TTL** to avoid cold-start spin-up per run, right-size
  data-flow compute, prefer **Copy** over data flows for pure movement, batch with **ForEach** concurrency
  sensibly, and avoid chatty low-volume triggers.

## Scaling and limits
- Copy scales via **parallel copies/DIUs**; data flows scale via the Spark cluster; pipelines run concurrently.
  Limits: per-factory **concurrency/pipeline/activity quotas**; **data-flow cold start** adds minutes unless a
  **TTL** keeps a cluster warm; **Self-Hosted IR** is customer-managed (HA = multiple nodes); event triggers
  depend on Event Grid; deep transforms belong in data flows or pushed-down compute, not control flow.

## Operating procedure
1. **Provision** — create the **factory** (with Git) via Terraform `azurerm_data_factory`, Bicep
   `Microsoft.DataFactory/factories`, or `az datafactory create`.
2. **Configure** — define **linked services** (Key Vault for secrets) + **datasets**, build **pipelines**/
   **mapping data flows**, choose **integration runtimes** (Azure/Self-Hosted/SSIS), and add **triggers**.
3. **Secure** — use the **managed identity** + Key Vault, enable **managed VNet + managed private endpoints**
   (or Self-Hosted IR for on-prem), and scope **RBAC** least-privilege.
4. **Verify** — apply [[verify-by-running]]: confirm the factory + objects provisioned (`az datafactory
   pipeline list`), then **trigger a run** (`az datafactory pipeline create-run`) and check the run status
   (`az datafactory pipeline-run show`) is **Succeeded** with expected rows copied/transformed. Capture result.

## Inputs
Sources/sinks + connectivity (cloud vs on-prem/private), the integration/transformation needed (Copy vs data
flows vs pushed-down compute), IR choice, trigger model (schedule/tumbling/event), secret management (Key
Vault), CI/CD (Git + ARM), and region.

## Output
An Azure Data Factory setup: a factory (Git-backed) with parameterized linked services/datasets, pipelines
and/or mapping data flows, the right integration runtimes, triggers, managed-identity + Key Vault + managed
private networking, scoped RBAC — plus verification that a pipeline run succeeds.

## Notes
- Gotchas: **data-flow cold start** is slow — use a cluster **TTL**; embed secrets in **Key Vault** not the
  linked service; **Self-Hosted IR** is customer-managed (plan HA nodes); use **Copy** not data flows for pure
  movement; managed VNet/private endpoints add setup; **event triggers** need Event Grid. **Pipeline/data-model
  design and transform/query logic are the data team's job** — defer to data/etl-architect (pipeline + data
  design) and data/sql-optimizer (query/transform rewrites). 2nd consumer: the Azure role team
  (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peers: AWS Glue, GCP
  Cloud Data Fusion.
- IaC/CLI: Terraform `azurerm_data_factory` (+ `azurerm_data_factory_linked_service_*` /
  `azurerm_data_factory_dataset_*` / `azurerm_data_factory_pipeline` / `azurerm_data_factory_integration
  _runtime_*` / `azurerm_data_factory_trigger_*`); Bicep/ARM `Microsoft.DataFactory/factories`. CLI `az
  datafactory create` / `az datafactory pipeline create-run`.
