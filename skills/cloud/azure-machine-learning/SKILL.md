---
name: azure-machine-learning
description: Use when designing, provisioning, securing, or operating Azure Machine Learning — Microsoft Azure's managed platform for building, training, deploying, and operating ML models (Azure Machine Learning). Covers workspaces and the studio, compute (compute instances, compute clusters, attached/serverless, Kubernetes), jobs (command/sweep/pipeline) and pipelines, datastores and data assets, the model registry and environments, managed online endpoints (real-time) and batch endpoints, AutoML, MLflow tracking/registry integration, prompt flow for LLM apps, plus instance sizing, autoscaling, VNet/Private Link, managed identity/RBAC, CMK, and cost. Loads the Azure ML knowledge: provision a workspace + compute, run training jobs, register models, deploy endpoints, and verify. Consumed by the Azure ML specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed ML platform (Azure Machine Learning).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-machine-learning, ai-ml, machine-learning, training, endpoints, mlops]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# Azure Machine Learning

Microsoft Azure's **managed platform for the full ML lifecycle**: building, training, tuning, deploying,
and operating models. It centers on a **workspace** that ties together compute, data, jobs, a model
registry, and endpoints, with MLflow integration, AutoML, and prompt flow for LLM apps — the Azure
equivalent of a managed ML service.

## Core concepts and components
- **Workspace + studio** — the top-level resource that groups all ML assets (jobs, models, endpoints,
  data, compute) and the **Azure ML studio** UI; backed by a storage account, key vault, container
  registry, and Application Insights.
- **Compute** — **compute instances** (dev boxes/notebooks), **compute clusters** (autoscaling training,
  CPU/GPU, low-priority/Spot), **serverless** compute, and **attached Kubernetes (AKS)** for inference/
  training.
- **Jobs & pipelines** — **command jobs** (a single run), **sweep jobs** (hyperparameter tuning), and
  **pipeline jobs** (multi-step DAGs of reusable components); jobs run on compute with an **environment**
  (curated/custom Docker) and data inputs.
- **Data** — **datastores** (links to Blob/ADLS Gen2/etc.) and **data assets** (versioned datasets) that
  jobs consume.
- **Model registry & environments** — versioned **registered models** and reusable **environments**;
  integrates with **MLflow** for tracking and registry.
- **Endpoints** — **managed online endpoints** (real-time, autoscaling, blue/green deployments with
  traffic split) and **batch endpoints** (async scoring over data); deployments bind a model + environment
  + compute.
- **AutoML & prompt flow** — **AutoML** for automated model selection; **prompt flow** for building/
  evaluating/deploying LLM-based apps within the workspace.

## Configuration and sizing
- Size **compute clusters** by VM family (CPU vs GPU), min/max nodes (scale-to-zero), and **Spot/
  low-priority** for cheap training; pick **compute-instance** size for dev. For **online endpoints**
  choose instance SKU + count and **autoscaling** rules; for **batch** size the cluster. Use **curated
  environments** where possible. Pin **data-asset versions** and **model versions** for reproducibility.

## Security and IAM
- Use the workspace **managed identity** and **Azure RBAC** (e.g. AzureML Data Scientist, AzureML Compute
  Operator) — least privilege, grant to **groups**; avoid broad Owner/Contributor. Isolate with a
  **managed VNet / Private Link** (no public workspace/endpoint exposure), put secrets in the linked **Key
  Vault**, and enable **customer-managed keys (CMK)** for encryption where required. Endpoints support
  **key/token (Microsoft Entra) auth**. Restrict who can deploy/approve models.

## Cost levers
- Main cost is **compute** (training cluster node-hours + endpoint instance-hours), not the workspace.
  Levers: **scale clusters to zero** when idle, use **Spot/low-priority** for fault-tolerant training,
  right-size endpoint SKU + **autoscale** (or use **batch** instead of always-on online for non-real-time),
  delete idle **compute instances**, and prune old models/data versions. Plus underlying storage/ACR.

## Scaling and limits
- **Core/quota limits per region and VM family** (especially GPU) gate cluster scale — request increases
  ahead of need. Online-endpoint instance count, deployments per endpoint, and request size/timeout are
  bounded. Cluster scale-up has cold-start latency; GPU availability is region-specific. Workspace and
  endpoint names are scoped/immutable per resource group.

## Operating procedure
1. **Provision** — create the **workspace** (and its storage/key-vault/ACR/App Insights) and **compute**
   (instance + autoscaling cluster) via Terraform `azurerm_machine_learning_workspace` /
   `azurerm_machine_learning_compute_cluster` (or Bicep/`az ml`).
2. **Configure** — register **datastores/data assets** and **environments**, run **command/sweep/pipeline
   jobs** (`az ml job create`), **register the model** (MLflow/registry), and deploy a **managed online**
   or **batch endpoint** with autoscaling (`az ml online-endpoint`/`online-deployment` with traffic split).
3. **Secure** — use the workspace **managed identity + RBAC** (least privilege), enable **managed VNet/
   Private Link** (no public exposure), store secrets in **Key Vault**, and enable **CMK** where required.
4. **Verify** — apply [[verify-by-running]]: confirm the training **job completes**
   (`az ml job show -n <job>` → `Completed`), the model is **registered**, and the **online endpoint** is
   succeeded/healthy (`az ml online-endpoint show`); then **invoke it** (`az ml online-endpoint invoke`)
   with a representative payload and confirm a sensible prediction. Capture the job completion, the
   registered model, and the endpoint prediction.

## Inputs
The ML task and data (datastores/assets), the training approach (custom job / sweep / pipeline / AutoML /
prompt flow), compute needs (CPU/GPU, Spot, sizes), the inference pattern (real-time online vs batch),
and the networking/identity/CMK security requirements.

## Output
An Azure ML setup: workspace + autoscaling compute, registered datastores/data assets/environments, a
completed training job, a registered model, and a managed online or batch endpoint with autoscaling —
isolated by managed VNet/Private Link, RBAC/managed identity, and CMK — plus verification of job
completion, model registration, and an endpoint prediction.

## Notes
- Gotchas: **GPU core quota per region/VM family** gates training — request increases early; **scale
  clusters to zero** and delete idle **compute instances** or costs run; **online endpoints are always-on**
  (use **batch** for non-real-time); pin **data and model versions** for reproducibility; **managed VNet/
  Private Link** is needed to avoid public exposure. This owns the **managed Azure ML service** (workspace,
  compute, jobs, endpoints, RBAC, scaling) — not the app-side LLM/RAG/eval code that *calls* a model. 2nd
  consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect) standing up the managed ML
  platform. Cross-cloud peers: AWS SageMaker, GCP Vertex AI.
- IaC/CLI: Terraform `azurerm_machine_learning_workspace`, `azurerm_machine_learning_compute_cluster`,
  `azurerm_machine_learning_compute_instance` (+ the linked storage/key-vault/ACR/App Insights); Bicep/ARM
  `Microsoft.MachineLearningServices/workspaces`. CLI `az ml workspace/compute/job/model/online-endpoint/
  online-deployment/batch-endpoint`; verify with `az ml job show`, `az ml online-endpoint show`, and
  `az ml online-endpoint invoke`.
