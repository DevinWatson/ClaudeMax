---
name: aws-sagemaker
description: Use when designing, provisioning, securing, or operating Amazon SageMaker — the managed platform for building, training, tuning, deploying, and operating custom machine-learning models (Amazon SageMaker / SageMaker AI). Loads the SageMaker knowledge: Studio and the domain/user-profile model, notebooks, training jobs (built-in algorithms, framework containers, distributed/Spot training), hyperparameter tuning, the Feature Store, the Model Registry and model packages, inference options (real-time endpoints, serverless inference, asynchronous inference, batch transform, multi-model/multi-container endpoints), Pipelines for orchestration, Processing/Clarify/Model Monitor, instance/accelerator sizing, autoscaling, VPC/IAM isolation, KMS, cost levers (Spot, serverless, right-sizing, Savings Plans), quotas, and verification by training and invoking. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect) provisioning ML infrastructure. Consumed by the SageMaker specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, sagemaker, ai-ml, machine-learning, training, inference, mlops]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon SageMaker

A managed platform for the full **custom ML lifecycle**: prepare data, **train and tune** models on
managed compute, register and govern them, and **deploy** them to managed inference — all without
running your own training/serving clusters. It is the place to bring your own model/algorithm
(contrast: Bedrock serves managed foundation models).

## Core concepts and components
- **Studio + Domain** — the web IDE; a **domain** holds **user profiles**, default execution roles,
  VPC, and storage. Notebooks/JupyterLab run on managed kernels/spaces.
- **Training jobs** — managed, ephemeral training on instances using **built-in algorithms**, **AWS
  framework containers** (PyTorch/TF/XGBoost/HF), or your own container; supports **distributed**
  training and **managed Spot** for cheap compute. Inputs from S3, outputs (model artifact) to S3.
- **Hyperparameter tuning** — automatic search jobs over a parameter space.
- **Feature Store** — online (low-latency) + offline (S3/analytics) feature serving with feature
  groups.
- **Model Registry** — versioned **model packages** and approval status for governance/CD.
- **Inference** — **real-time endpoints** (always-on instances), **serverless inference** (scale to
  zero), **asynchronous inference** (large payloads/queued), **batch transform** (offline scoring), and
  **multi-model / multi-container** endpoints for density.
- **Pipelines** — DAG orchestration of processing/training/eval/register/deploy steps; **Processing**
  jobs, **Clarify** (bias/explainability), and **Model Monitor** (drift/quality).

## Configuration and sizing
- Choose **instance families** by workload: `ml.g`/`ml.p` (GPU) for deep learning, `ml.c`/`ml.m` for
  CPU/XGBoost, `inf`/`trn` for Inferentia/Trainium. Size training by data/model + use distributed +
  Spot for cost; size endpoints by latency/throughput and enable **autoscaling** (or serverless for
  spiky/low traffic). Use the offline Feature Store for training, online for serving.

## Security and IAM
- Each domain/job/endpoint runs under an **execution role**; scope it to the specific S3 prefixes,
  ECR repos, and KMS keys it needs (avoid broad `s3:*`/`sagemaker:*`). Run Studio/jobs/endpoints in a
  **VPC** with no/limited internet, use **interface VPC endpoints**, encrypt volumes/artifacts/network
  traffic with **KMS** + inter-container encryption, and isolate per-team domains. Gate who can deploy
  via Model Registry approval.

## Cost levers
- Biggest costs are **training instance-hours** and **always-on endpoint instances**. Levers: managed
  **Spot** training (up to ~70–90% off), **serverless/async** inference to avoid idle endpoints,
  right-size and **autoscale** endpoints, **multi-model endpoints** for density, stop idle Studio
  apps/notebooks, and **Savings Plans** for steady usage. Batch transform beats a standing endpoint for
  offline scoring.

## Scaling and limits
- Per-account, per-instance-type quotas for training/endpoint/notebook usage (often must be raised via
  support before GPU work). Endpoints autoscale on invocation metrics; training scales via distributed
  jobs. Cold starts apply to serverless inference; async/batch handle large payloads.

## Operating procedure
1. **Provision** — create the domain/user profile, execution roles, and (if needed) a model package
   group via Terraform `aws_sagemaker_domain` / `aws_sagemaker_model_package_group`, or `aws sagemaker
   create-domain`.
2. **Configure** — run a **training job** (algorithm/container, instances, Spot, S3 in/out), register
   the resulting **model package**, and create a **model** + **endpoint config** + **endpoint** (or
   serverless/async/batch) with autoscaling; optionally wire a **Pipeline** and **Model Monitor**.
3. **Secure** — least-privilege execution role, VPC + endpoints, KMS encryption, and registry-approval
   gating for deploys.
4. **Verify** — apply [[verify-by-running]]: confirm the training job reaches `Completed`
   (`aws sagemaker describe-training-job`) and the endpoint is `InService`
   (`describe-endpoint`), then invoke it with a representative payload
   (`aws sagemaker-runtime invoke-endpoint`) and confirm a sensible prediction — capture the actual
   output.

## Inputs
Use case (model type/framework), data location/format in S3, training compute + Spot/distributed
choice, inference pattern (real-time/serverless/async/batch) + latency/throughput, VPC/KMS security
model, MLOps needs (Feature Store/Registry/Pipelines/Monitor), cost constraints.

## Output
A SageMaker setup — domain/roles, a training/tuning job, a registered model, and an appropriately-typed
endpoint (or batch job) with autoscaling, VPC/KMS isolation, and optional Pipeline/monitoring — plus
verification that training completed and the endpoint returns correct predictions.

## Notes
- Gotchas: GPU/endpoint quotas usually need a raise before real work; always-on endpoints bill 24/7 —
  use serverless/async/batch when traffic is spiky or offline; execution roles are routinely
  over-privileged; Studio apps keep billing if not stopped; training Spot needs checkpointing for
  interruption; container/framework versions must match the SDK; Model Monitor needs a baseline; the
  endpoint is the deployment unit, not the model package.
- IaC/CLI: Terraform `aws_sagemaker_domain`, `aws_sagemaker_model`, `aws_sagemaker_endpoint_configuration`,
  `aws_sagemaker_endpoint`, `aws_sagemaker_model_package_group`, `aws_sagemaker_feature_group`,
  `aws_sagemaker_pipeline`. CLI `aws sagemaker create-training-job`, `create-model`,
  `create-endpoint-config`, `create-endpoint`, `describe-training-job`, `describe-endpoint`;
  `aws sagemaker-runtime invoke-endpoint`. CloudFormation `AWS::SageMaker::Domain`,
  `AWS::SageMaker::Model`, `AWS::SageMaker::EndpointConfig`, `AWS::SageMaker::Endpoint`,
  `AWS::SageMaker::Pipeline`.
