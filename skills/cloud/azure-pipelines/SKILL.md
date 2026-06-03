---
name: azure-pipelines
description: Use when designing, authoring, configuring, or operating Azure Pipelines — the CI/CD service within Azure DevOps for building, testing, and deploying via YAML or classic pipelines (Azure Pipelines). Covers the YAML pipeline model (triggers, stages → jobs → steps/tasks), templates + parameters, variables + variable groups (Key Vault-linked), agent pools (Microsoft-hosted vs self-hosted) + demands, environments with deployment strategies + approvals/checks, service connections, artifacts + caching, and matrix/multi-stage deploys. Loads the knowledge to author a pipeline, wire agents/environments/approvals, and verify a run succeeds. Consumed by the azure-pipelines specialist and by the github-actions team and Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service (Azure Pipelines).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-pipelines, devops, ci-cd, yaml]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Pipelines

**Azure Pipelines** is the **CI/CD service** within Azure DevOps for **building, testing, and deploying** via
**YAML** (preferred) or **classic** pipelines. This skill owns the **single-service pipeline layer** — pipeline
authoring, agents, environments, approvals, and artifacts. (The surrounding org/project/Repos/Boards/Artifacts
suite is owned with the Azure DevOps skill.)

## Core concepts and components
- **YAML pipeline model** — **triggers** (CI/PR/scheduled/pipeline-resource) → **stages** → **jobs** → **steps**
  (**tasks** or scripts); jobs run on an **agent**; pipelines live in the repo (`azure-pipelines.yml`).
- **Templates & parameters** — reusable **step/job/stage templates** with typed **parameters** and `extends`
  templates for governance.
- **Variables** — pipeline/stage/job variables, **variable groups** (optionally **Key Vault-linked**), and
  **secrets** (masked, never echoed).
- **Agent pools** — **Microsoft-hosted** (ephemeral, per-job) vs **self-hosted/scale-set** agents; jobs target a
  pool with **demands**; container/VMSS agents for isolation/scale.
- **Environments** — deployment targets with **deployment strategies** (runOnce/rolling/canary), **resources**
  (Kubernetes/VM), and **approvals + checks** (manual approval, branch control, business hours, Invoke REST,
  exclusive lock).
- **Service connections** — auth to Azure/registries (prefer **workload identity federation**).
- **Artifacts & caching** — publish/download **pipeline artifacts**, package feeds, and **caching** for deps.

## Configuration and sizing
- Author the **YAML** with stages/jobs/steps, pick an **agent pool** (hosted vs self-hosted scale set), define
  **variable groups** (Key Vault-linked for secrets), set up **environments** + **approvals/checks**, and wire
  **service connections**. Scale throughput with **parallel jobs** + self-hosted/scale-set agents.

## Security and IAM
- Auth via **Entra ID**; pipeline permissions via Azure DevOps security groups. Prefer **workload identity
  federation** service connections over stored secrets; keep secrets in **Key Vault-linked variable groups**
  (masked). Restrict pipeline access to resources via **approvals/checks** and **branch control**; use
  **extends templates** to enforce required steps. Scope self-hosted agents (don't run untrusted PRs on them).

## Cost levers
- Billed by **parallel jobs** (Microsoft-hosted minutes vs self-hosted) and agent infra. Levers: use
  **caching** + incremental builds, **fan-in/fan-out** wisely, self-hosted **scale-set** agents for heavy/long
  builds, skip stages with conditions/`changes`, and avoid idle hosted-agent waits.

## Scaling and limits
- **Parallel job** limits (purchased), hosted-agent **timeout/spec** caps, self-hosted agent capacity, artifact
  size/retention, and per-org rate limits. Self-hosted **scale sets** auto-scale agents; large mono-repos benefit
  from **path filters** + caching.

## Operating procedure
1. **Provision** — define the pipeline via Terraform `azuredevops_build_definition` (pointing at the YAML in the
   repo) or `az pipelines create`; ensure an **agent pool** exists.
2. **Configure** — author the **YAML** (stages/jobs/steps, templates, matrix), create **variable groups**
   (`azuredevops_variable_group`, Key Vault-linked), set up **environments** + **approvals/checks**
   (`azuredevops_environment`), and wire **service connections** (workload identity).
3. **Secure** — prefer **workload identity federation**, keep secrets in Key Vault-linked groups, gate prod with
   **approvals/checks**, restrict self-hosted agents.
4. **Verify** — apply [[verify-by-running]]: queue a run (`az pipelines run`) and read its result
   (`az pipelines runs show` / build status) confirming stages/jobs **succeed** and the deployment gate
   (approval/check) behaves as designed. Capture state and result.

## Inputs
The **repo + YAML** to build, the **triggers**, the **agent pool** choice, the **variable groups/secrets**, the
**environments + approvals/checks**, the **service connections**, and any artifact/caching needs.

## Output
An Azure Pipelines setup: a YAML (or classic) pipeline with triggers → stages → jobs → steps, an agent pool,
variable groups (Key Vault-linked secrets), environments with deployment strategy + approvals/checks, workload-
identity service connections, caching/artifacts — plus verification that a run succeeds and gates behave.

## Notes
- Gotchas: **parallel-job** limits throttle CI; **self-hosted agents** running untrusted PRs are a risk; secrets
  must come from **Key Vault-linked groups** (not echoed); **classic** pipelines are legacy (prefer YAML +
  templates); environment **approvals/checks** are what actually gate prod. The surrounding ALM suite is **Azure
  DevOps'**. 2nd consumers: the github-actions team (cross-platform CI/CD) and the Azure role team
  (azure-platform-engineer / azure-cloud-architect). Cross-platform peers: GitHub Actions, AWS CodePipeline/
  CodeBuild, GCP Cloud Build.
- IaC/CLI: Terraform **azuredevops** provider (`azuredevops_build_definition`, `azuredevops_variable_group`,
  `azuredevops_environment`, `azuredevops_serviceendpoint_*`); pipeline logic in `azure-pipelines.yml`. CLI
  `az pipelines ...`.