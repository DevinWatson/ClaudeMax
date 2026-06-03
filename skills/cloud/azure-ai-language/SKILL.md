---
name: azure-ai-language
description: Use when designing, provisioning, securing, or operating Azure AI Language — Microsoft Azure's managed natural-language-processing service (formerly Text Analytics + LUIS) for understanding text (Azure AI Language). Covers the Language (Cognitive Services) resource, prebuilt features (NER, entity linking, key-phrase extraction, sentiment + opinion mining, language detection, PII/PHI detection/redaction, summarization, health text analytics), and custom features (CLU, custom NER, custom text classification, Custom Question Answering), tiers, keys vs Entra ID/managed identity, Private Link, and cost. Loads the knowledge: provision a resource, call analysis or train a custom model, secure access, and verify. Consumed by the azure-ai-language specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure AI Language).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ai-language, ai-ml, nlp, ner, sentiment, pii]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure AI Language

Microsoft Azure's **managed NLP service** (formerly Text Analytics + LUIS): understand text through
prebuilt models — entities, sentiment, PII, key phrases, summarization — plus **custom** classification,
NER, and conversational understanding, all behind an Azure AI services resource.

## Core concepts and components
- **Resource** — a `TextAnalytics` single-service or **multi-service Azure AI services
  (`CognitiveServices`)** account with a regional endpoint + key pair; the unit of RBAC, networking, and
  billing.
- **Prebuilt features** — **Named Entity Recognition (NER)** + **entity linking**, **key-phrase
  extraction**, **sentiment analysis + opinion mining**, **language detection**, **PII/PHI detection
  and redaction**, **summarization** (extractive + abstractive, text and conversation), and
  **Text Analytics for health** (clinical entity extraction).
- **Custom features** — **Conversational Language Understanding (CLU)** (intents + entities for
  bots/voice, the LUIS successor), **custom NER**, **custom text classification** (single/multi-label),
  and **Custom Question Answering** (knowledge bases over docs/URLs).
- **Projects & training** — custom features use a **Language Studio project**, labeled data in linked
  **Blob storage**, a **train → evaluate → deploy** loop, and a **deployment** the app calls.
- **Sync vs async** — short calls are synchronous; long-running analysis (summarization, custom,
  multi-doc) uses **async jobs** with operation polling.

## Configuration and sizing
- Choose **single-** vs **multi-service** resource. Pick **tier** (`F0` free vs `S` standard). For
  **custom** features, attach a **storage account** for training data and budget a train/evaluate/deploy
  cycle; CLU/custom models support multiple **deployments** (e.g. staging/prod) per project. Pick the
  feature/version and language(s) per call.

## Security and IAM
- Prefer **Microsoft Entra ID + RBAC** (`Cognitive Services User` / language roles) with **managed
  identity** over keys; disable key auth where possible. Use **managed-identity** access from the Language
  resource to the **training storage**. Isolate with **Private Link** / `publicNetworkAccess=Disabled`,
  keep keys in **Key Vault**, and enable **CMK** if required. **PII detection** itself helps meet data
  obligations.

## Cost levers
- Billed **per text record (per 1K)** by feature/tier (custom training/deployment may bill separately).
  Levers: use **F0** for dev, batch documents per call, request only needed features, avoid re-analyzing
  unchanged text (cache by hash), and right-size custom **deployments** (retire unused ones).

## Scaling and limits
- **Records-per-request and rate limits per tier** (F0 low) gate throughput. **Document size/count per
  request** is bounded; async jobs have duration limits. Custom-feature **training data minimums** and
  language/region availability apply; some features are region-specific.

## Operating procedure
1. **Provision** — create the **Language / Azure AI services account** in a supported region via
   Terraform `azurerm_cognitive_account` (`kind = "TextAnalytics"` or `"CognitiveServices"`) (or
   Bicep/`az cognitiveservices account create`); attach **storage** if using custom features.
2. **Configure** — for prebuilt, pick features/version; for **custom (CLU/NER/classification/QnA)**,
   create the **Language Studio project**, label data, **train**, **evaluate**, and **deploy**.
3. **Secure** — use **Entra ID + managed identity** and least-privilege RBAC (incl. managed-identity to
   training storage), disable key auth, set **Private Link** with `publicNetworkAccess=Disabled`, and
   enable **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the resource (and any **custom deployment**) is
   ready, then **call analysis** on representative text (curl the `language/:analyze-text` endpoint or
   `az rest`, or call the custom CLU/classification deployment) and confirm sensible
   entities/sentiment/intents with confidences. Capture the API response.

## Inputs
The NLP task (NER/sentiment/PII/key-phrase/summarization vs custom CLU/NER/classification/QnA), expected
volume (tier), languages, training data for custom features, region, and the networking/identity
security requirements.

## Output
An Azure AI Language setup: a Language / Azure AI services account at the chosen tier, prebuilt features
selected and/or a trained+deployed custom project — isolated by Private Link, Entra ID/managed identity,
and CMK — plus verification that an analysis (or custom deployment) call returns sensible results.

## Notes
- Gotchas: **F0 rate/record limits are low** (use S for real volume); **custom features need labeled
  data, a train/evaluate/deploy cycle, and linked storage** (managed-identity access); long analyses are
  **async** (poll the operation); document size/count per request is bounded; some features/languages are
  **region-specific**. This owns the **managed Azure AI Language service** (resource, prebuilt/custom
  features, deployments, RBAC, scaling) — not the app-side NLP orchestration/eval code that *calls* it.
  CLU often feeds **azure-bot-service**. 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peer: AWS Comprehend.
- IaC/CLI: Terraform `azurerm_cognitive_account` (`kind = "TextAnalytics"` / `"CognitiveServices"`)
  (custom projects via Language Studio/REST); Bicep/ARM `Microsoft.CognitiveServices/accounts`. CLI
  `az cognitiveservices account create`; verify with the **Language REST API**
  (`/language/:analyze-text` or the custom deployment) via `az rest` or curl.
