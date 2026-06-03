---
name: gcp-vertex-ai
description: Use when designing, provisioning, securing, or operating Vertex AI — Google Cloud's unified ML platform for custom training (custom/pre-built containers, distributed, hyperparameter tuning), Vertex AI Pipelines (KFP/TFX), the Model Registry, online prediction endpoints and batch prediction, the Feature Store, Generative AI (Gemini, Model Garden, tuning, RAG/grounding), and AutoML, plus accelerator/machine sizing, autoscaling, IAM/service accounts, VPC-SC/CMEK, and cost (Vertex AI). Loads the Vertex AI knowledge: run a training job, register a model, deploy an endpoint or batch job, call Gemini/Model Garden, and verify a prediction. Consumed by the Vertex AI specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle ML platform workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, vertex-ai, ai-ml, machine-learning, training, prediction, gemini]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Vertex AI

Google Cloud's unified, end-to-end machine learning platform. It covers the full lifecycle —
data, training, tuning, model management, deployment, and prediction — for both custom-trained
models and Google's foundation models (Gemini and Model Garden), under one set of APIs, IAM, and
networking controls.

## Core concepts and components
- **Custom training** — training jobs (`CustomJob` / training pipelines) using **pre-built** or
  **custom containers**, single-node or **distributed**, with **hyperparameter tuning**; artifacts
  land in Cloud Storage.
- **Vertex AI Pipelines** — managed, serverless orchestration of ML workflows authored with **KFP**
  (Kubeflow Pipelines SDK) or **TFX**, with experiment tracking and lineage.
- **Model Registry** — versioned catalog of trained/imported models; the unit you deploy.
- **Prediction** — **online prediction** via **Endpoints** (deploy a model version to an endpoint
  with a machine type, optional GPU/TPU, autoscaling) and **batch prediction** for large offline
  scoring jobs.
- **Feature Store** — managed online/offline feature serving (Vertex AI Feature Store, BigQuery-backed
  in the newer version).
- **Generative AI** — **Gemini** models, **Model Garden** (first/third-party/open models),
  supervised tuning, embeddings, grounding/RAG (Vertex AI Search/RAG Engine).
- **AutoML** — train tabular/image/text models without custom code.

## Configuration and sizing
- Pick the worker machine type + accelerator (NVIDIA GPUs / Cloud TPUs) per training and per endpoint
  deployment; enable endpoint **autoscaling** (min/max replicas, target utilization). Use pre-built
  containers when the framework matches; custom containers otherwise. Region selection affects model
  and accelerator availability. For Gemini, pick the model tier and set quotas/region.

## Security and IAM
- Run jobs and endpoints with a dedicated **service account** granted least-privilege roles
  (`roles/aiplatform.user`, scoped Cloud Storage / BigQuery access) — avoid broad
  `roles/aiplatform.admin`. Protect data exfiltration with **VPC Service Controls**, use **CMEK**
  for artifacts/models, deploy endpoints with **private endpoints / PSC** where required, and audit
  via Cloud Audit Logs. Gate Generative AI access and grounding sources via IAM.

## Cost levers
- Biggest levers: accelerator type/count and training duration; idle **online endpoints** bill for
  provisioned replicas continuously, so use autoscaling with sensible min replicas (or batch
  prediction for offline work). Prefer batch over always-on endpoints when latency allows; right-size
  machine types; clean up undeployed models and stale endpoints. For Gemini, cost is per token —
  manage context size and model tier.

## Scaling and limits
- Endpoints autoscale within configured replica bounds; batch prediction scales with the job's worker
  pool. Per-project/region quotas govern accelerators, concurrent jobs, and online prediction QPS —
  raise via the quotas page. Distributed training scales across worker pools.

## Operating procedure
1. **Provision** — enable the Vertex AI API, create the runtime **service account** + Cloud Storage
   staging bucket (Terraform `google_project_service`, `google_service_account`,
   `google_storage_bucket`), and set the region.
2. **Configure** — run a training job (pre-built/custom container, machine type + accelerator,
   distributed/HP tuning) or an AutoML/Gemini-tuning job, **register** the model in the Model
   Registry, then deploy it to an **Endpoint** (machine type, autoscaling) or define a **batch
   prediction** job; optionally wire Pipelines and Feature Store.
3. **Secure** — scope the service account least-privilege, apply CMEK, enable VPC-SC / private
   endpoints, and restrict Generative AI usage via IAM.
4. **Verify** — apply [[verify-by-running]]: confirm the training/tuning job reaches `JOB_STATE_SUCCEEDED`
   (`gcloud ai custom-jobs describe`), the model is registered (`gcloud ai models list`), and the
   endpoint is deployed (`gcloud ai endpoints describe`) by sending a representative request
   (`gcloud ai endpoints predict`) and confirming a sensible prediction — capture the actual output.

## Inputs
Problem type (custom training / AutoML / Gemini), framework + container, data location + size,
machine/accelerator needs, online-vs-batch serving + latency/QPS targets, region, IAM/service-account
scope, CMEK/VPC-SC requirements, and cost constraints.

## Output
A Vertex AI setup (service account + staging bucket, training/tuning job, registered model, endpoint
or batch job with autoscaling, optional Pipeline/Feature Store) as the chosen machine/accelerator
config, plus verification of a succeeded job and a working prediction.

## Notes
- Gotchas: online endpoints bill for provisioned replicas even when idle (delete or scale to a low
  min when unused); accelerator quota is per region and often the real blocker; model + endpoint
  regions must match; the legacy and BigQuery-backed Feature Store differ; Gemini quotas and model
  availability vary by region; undeployed models still incur storage. Vertex AI is for the MANAGED
  GCP service — app-side LLM/RAG/eval code is built by the language ai/rag/evals roles.
- IaC/CLI: Terraform `google_vertex_ai_endpoint`, `google_vertex_ai_featurestore`,
  `google_vertex_ai_dataset`, `google_vertex_ai_index`/`_index_endpoint`, plus
  `google_project_service`, `google_service_account`, `google_storage_bucket`; jobs/training are
  typically submitted via the SDK/CLI rather than declared in Terraform. CLI `gcloud ai custom-jobs`,
  `gcloud ai models`, `gcloud ai endpoints`, `gcloud ai batch-prediction-jobs`; the Vertex AI Python
  SDK (`google-cloud-aiplatform`) for pipelines, tuning, and Gemini.
