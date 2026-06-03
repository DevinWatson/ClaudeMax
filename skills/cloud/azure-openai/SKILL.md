---
name: azure-openai
description: Use when designing, provisioning, securing, or operating Azure OpenAI Service — Microsoft Azure's managed access to OpenAI models (GPT-4o/4.1/o-series chat + completions, embeddings, DALL-E, Whisper) with enterprise networking, identity, and quotas (Azure OpenAI Service). Covers the Cognitive Services OpenAI resource, model deployments (Standard / Global / Provisioned PTU), capacity and rate limits (TPM/RPM tokens-per-minute), content filters and abuse monitoring, "On Your Data" / RAG grounding against Azure AI Search, the Assistants API and function/tool calling, keys vs Entra ID auth and managed identity, Private Link/VNet isolation, and cost. Loads the Azure OpenAI knowledge: provision a resource, create model deployments with quota, secure access, and verify a completion. Consumed by the azure-openai specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure OpenAI Service).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-openai, ai-ml, llm, gpt, embeddings, rag]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure OpenAI Service

Microsoft Azure's **managed access to OpenAI models** behind an Azure Cognitive Services resource:
GPT chat/completion models, embeddings, image (DALL-E), and audio (Whisper), wrapped with Azure
identity, networking, quotas, content safety, and SLAs — the enterprise way to consume OpenAI models.

## Core concepts and components
- **Resource** — an `OpenAI` kind **Cognitive Services account** scoped to a region, with a unique
  endpoint and key pair; the unit of RBAC, networking, and billing.
- **Model deployments** — you do not call a model directly; you create a named **deployment** of a
  base model (e.g. `gpt-4o`, `gpt-4.1`, `o3`, `text-embedding-3-large`, `dall-e-3`, `whisper`) at a
  model **version** with a **SKU**: `Standard` (regional), `GlobalStandard` (global pooled, higher
  throughput), or **Provisioned (PTU)** for reserved, latency-predictable capacity.
- **Quota / capacity** — deployments are sized in **TPM (tokens-per-minute)** which also derives an
  **RPM** limit; quota is granted **per model, per region, per subscription** and must be allocated
  across deployments. PTU reserves throughput as a commitment.
- **Content filters & abuse monitoring** — configurable content-safety categories (hate, sexual,
  violence, self-harm) at input/output, plus prompt-shield/jailbreak detection; abuse monitoring can
  be modified via an approved exemption.
- **On Your Data / RAG** — built-in grounding that wires a deployment to a data source (commonly
  **Azure AI Search**) so chat responses cite retrieved documents without hand-rolling retrieval.
- **Assistants API & tool calling** — stateful assistants with threads, file search, code
  interpreter, and **function/tool calling** for app integration.

## Configuration and sizing
- Pick a **region** that offers the model+version you need; choose **SKU** by need (GlobalStandard for
  cheap/high throughput, **PTU** for predictable latency/reserved capacity). Allocate **TPM** per
  deployment within your model quota; raise quota via a request when capped. Set the **content filter**
  policy per deployment. Pin model **version** (or use auto-update deliberately) for reproducibility.

## Security and IAM
- Prefer **Microsoft Entra ID** auth with **managed identity** and the `Cognitive Services OpenAI User`
  / `Contributor` roles over **API keys**; disable local/key auth where possible. Isolate with **Private
  Link / VNet** and `publicNetworkAccess=Disabled`. Store any keys in **Key Vault**. Enable
  **customer-managed keys (CMK)** if required. Restrict who can create deployments or change filters.

## Cost levers
- Billed per **1K/1M tokens** (input + output) per model, or as a **PTU commitment** for reserved
  capacity. Levers: choose smaller/cheaper models where quality allows, use **GlobalStandard** for cheap
  token throughput, **PTU** only when steady high volume justifies the reservation, cap **max tokens**,
  cache/deduplicate prompts, and use embeddings + retrieval instead of stuffing context.

## Scaling and limits
- **TPM/RPM quota per model+region+subscription** gates throughput — request increases ahead of need;
  model+version **availability is region-specific**. Standard deployments share regional capacity (429s
  under load); **PTU** removes that variance. Token context windows and image/audio request limits are
  per-model bounded.

## Operating procedure
1. **Provision** — create the **OpenAI Cognitive Services account** in a region offering your model via
   Terraform `azurerm_cognitive_account` (`kind = "OpenAI"`) (or Bicep/`az cognitiveservices account`).
2. **Configure** — create model **deployments** with SKU + **TPM** capacity
   (`azurerm_cognitive_deployment` / `az cognitiveservices account deployment create`), set the
   **content-filter** policy, and wire **On Your Data** to Azure AI Search if doing RAG.
3. **Secure** — use **Entra ID + managed identity** and least-privilege roles, disable key/local auth,
   set **Private Link** with `publicNetworkAccess=Disabled`, and enable **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the deployment is `Succeeded`
   (`az cognitiveservices account deployment show`), then **call it** with a chat completion against the
   endpoint (curl the `/chat/completions` API with an Entra token, or `az rest`) and confirm a sensible
   response and token usage. Capture the deployment state and the completion output.

## Inputs
The model(s)/versions and use case (chat, embeddings, image, audio, RAG/On Your Data, assistants), the
region, the SKU and TPM/PTU capacity, the content-filter policy, and the networking/identity/CMK
security requirements.

## Output
An Azure OpenAI setup: an OpenAI Cognitive Services account with named model deployments at the chosen
SKU/TPM, content filters, optional On Your Data grounding — isolated by Private Link, Entra ID/managed
identity, and CMK — plus verification that a deployment is Succeeded and returns a valid completion.

## Notes
- Gotchas: model+version **availability is region-specific** — check before choosing a region; **TPM
  quota** is shared across deployments per model+region and gates throughput; Standard deployments 429
  under contention (use **PTU** for predictable latency); content filters can block legitimate output
  (tune the policy); pin model **version** to avoid silent behavior drift. This owns the **managed Azure
  OpenAI service** (resource, deployments, quota, filters, auth) — not the app-side prompt/RAG/eval code
  that *calls* it. Pairs with **azure-ai-search** for the RAG retrieval side. 2nd consumer: the Azure
  role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS Bedrock, GCP Vertex AI.
- IaC/CLI: Terraform `azurerm_cognitive_account` (`kind = "OpenAI"`) + `azurerm_cognitive_deployment`;
  Bicep/ARM `Microsoft.CognitiveServices/accounts` (+ `/deployments`). CLI
  `az cognitiveservices account create` / `... deployment create` / `... deployment show`; verify the
  completion with `az rest` or curl against the `/openai/deployments/<name>/chat/completions` endpoint.
