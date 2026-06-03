---
name: azure-ai-foundry
description: Use when designing, provisioning, securing, or operating Azure AI Foundry — Microsoft Azure's end-to-end platform for building, evaluating, and operating generative-AI apps and agents (Azure AI Foundry). Covers Foundry hubs and projects, the model catalog and Models-as-a-Service / serverless and managed deployments, the Foundry Agent Service, prompt flow for orchestration, evaluations (built-in and custom evaluators) and safety/groundedness checks, connections to Azure OpenAI / Azure AI Search / storage, tracing and content safety integration, Entra ID/managed identity, Private Link/VNet, and cost. Loads the Foundry knowledge: provision a hub and project, wire connections and model deployments, secure access, and verify a deployed model and a flow. Consumed by the azure-ai-foundry specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure AI Foundry).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ai-foundry, ai-ml, genai, agents, prompt-flow]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure AI Foundry

Microsoft Azure's **unified AI development platform** for building, evaluating, deploying, and operating
generative-AI applications and agents — the workspace layer that ties together models, data connections,
orchestration, evaluation, and observability behind Azure identity and networking.

## Core concepts and components
- **Hub** — a top-level collaboration resource (backed by storage, Key Vault, and optional Azure AI
  Services / Azure OpenAI) that holds shared **connections**, compute, and security; the unit of RBAC and
  networking.
- **Project** — a workspace under a hub where teams build a specific app: it inherits hub connections and
  adds its own model deployments, flows, indexes, evaluations, and agents.
- **Model catalog** — curated foundation models (Azure OpenAI, Microsoft, Meta, Mistral, others) deployed
  as **Models-as-a-Service / serverless** (pay-per-token endpoints), **managed compute** (dedicated VMs),
  or via **Azure OpenAI** deployments.
- **Foundry Agent Service** — managed agents with tools (function calling, file/knowledge tools, Azure AI
  Search grounding) and threads for stateful conversation.
- **Prompt flow** — graph-based orchestration of prompts, Python tools, and LLM nodes for building and
  versioning RAG/chat pipelines.
- **Evaluations** — built-in and custom **evaluators** (relevance, groundedness, coherence, fluency,
  safety/harm) run over datasets to score quality before/after deployment.
- **Connections** — typed references to Azure OpenAI, **Azure AI Search**, storage, and other resources,
  shared at the hub or scoped to a project.

## Configuration and sizing
- Create the **hub** with its storage/Key Vault and (optionally) an Azure AI Services/OpenAI connection,
  then **projects** per app. Choose deployment shape per model: **serverless** (pay-per-token, fastest to
  stand up) vs **managed compute** (reserved instances/SKU you size). Wire **connections** to Azure OpenAI
  and Azure AI Search rather than embedding keys. Pin model versions for reproducibility.

## Security and IAM
- Prefer **Microsoft Entra ID** auth with **managed identity**; assign least-privilege roles (`Azure AI
  Developer`, project-scoped) over keys; disable local/key auth where possible. Isolate the hub with a
  **managed VNet / Private Link** and `publicNetworkAccess=Disabled`. Store secrets in the hub's **Key
  Vault**; enable **CMK** if required. Integrate **Azure AI Content Safety** for input/output filtering.

## Cost levers
- Costs come from **model usage** (per-token for serverless / Azure OpenAI, per-hour for managed compute),
  plus the hub's storage/Key Vault and any AI Search/compute. Levers: prefer **serverless** until volume
  justifies managed compute; pick smaller/cheaper catalog models where quality allows; delete idle managed
  endpoints; scope evaluations to representative samples; reuse a shared hub across projects.

## Scaling and limits
- **Quota** gates model deployments (Azure OpenAI TPM; serverless and managed-compute capacity per
  region+subscription); model + feature availability is **region-specific**. Managed-compute endpoints
  scale by instance count/SKU. Per-region limits on projects/connections apply — check before scaling.

## Operating procedure
1. **Provision** — create the **hub** (with storage + Key Vault, optional AI Services/OpenAI connection)
   and a **project** via Terraform `azurerm_ai_foundry` (hub) + `azurerm_ai_foundry_project` (or
   Bicep/`az ml`/the Foundry SDK).
2. **Configure** — add **connections** (Azure OpenAI, Azure AI Search, storage), deploy a **catalog
   model** (serverless or managed compute), and build a **prompt flow** and **evaluation** as needed; wire
   **Content Safety**.
3. **Secure** — use **Entra ID + managed identity** and least-privilege roles, disable key/local auth, set
   the **managed VNet / Private Link** with `publicNetworkAccess=Disabled`, and enable **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the hub/project and the model **deployment** are
   provisioned (`az ml` / show), then **call** the deployed model endpoint (curl with an Entra token or
   `az rest`) and confirm a valid response, and run a small **evaluation** and confirm scores return.
   Capture the deployment state and the call/eval output.

## Inputs
The app/agent use case, which catalog model(s) and deployment shape (serverless vs managed compute), the
connections needed (Azure OpenAI, Azure AI Search, storage), whether you need prompt flow / agents /
evaluations / Content Safety, the region, and the networking/identity/CMK security requirements.

## Output
An Azure AI Foundry setup: a hub and project with typed connections, a deployed catalog/Azure OpenAI model,
optional prompt flow / agent / evaluation — isolated by managed VNet/Private Link, Entra ID/managed
identity, and CMK — plus verification that the deployment is provisioned, the model returns a valid
response, and an evaluation produces scores.

## Notes
- Gotchas: a **hub vs project** mix-up is common — shared connections/compute live on the hub, app-specific
  artifacts on the project; **serverless vs managed compute** have very different cost/scaling profiles;
  model + feature **availability is region-specific**; Azure OpenAI deployments under Foundry still consume
  **TPM quota**; the **managed VNet** must be provisioned before private connections work. This owns the
  **managed Foundry platform** (hubs, projects, connections, deployments, flows, evaluations) — not the
  app-side product code that calls the deployed endpoints. Pairs with **azure-openai** (model deployments)
  and **azure-ai-search** (RAG retrieval). 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peers: AWS Bedrock / SageMaker Studio, GCP Vertex AI.
- IaC/CLI: Terraform `azurerm_ai_foundry` + `azurerm_ai_foundry_project` (+ `azurerm_cognitive_deployment`
  for Azure OpenAI); Bicep/ARM `Microsoft.MachineLearningServices/workspaces` (`kind = "Hub"`/`"Project"`).
  CLI `az ml workspace`/`az cognitiveservices`; verify by calling the deployed endpoint with `az rest` or
  curl and running an evaluation via the Foundry SDK.
