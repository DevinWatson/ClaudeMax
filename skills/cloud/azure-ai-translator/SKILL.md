---
name: azure-ai-translator
description: Use when designing, provisioning, securing, or operating Azure AI Translator — Microsoft Azure's managed machine-translation service for real-time text translation, async document translation, and custom translation models (Azure AI Translator). Covers the Translator (Cognitive Services) resource and region (global vs geo-scoped endpoints), the Text Translation API (translate/transliterate/detect/dictionary), Document Translation (async, format-preserving batch over Blob), Custom Translator (domain models on parallel corpora), tiers, keys vs Entra ID/managed identity, Private Link, and cost. Loads the knowledge: provision a resource, call text/document translation, secure access, and verify. Consumed by the azure-ai-translator specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure AI Translator).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ai-translator, ai-ml, translation, machine-translation, localization]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure AI Translator

Microsoft Azure's **managed machine-translation service**: translate text in real time across 100+
languages, translate whole documents while preserving formatting, and train domain-tuned custom models —
behind an Azure AI services Translator resource.

## Core concepts and components
- **Resource** — a `TextTranslation` single-service or **multi-service Azure AI services
  (`CognitiveServices`)** account; region matters because endpoints are **global** or **regional/
  geo-scoped** (data-residency), and **Document Translation** needs a regional resource.
- **Text Translation API** — **translate**, **transliterate**, **detect** language, **dictionary
  lookup/examples**, and **break-sentence**; supports auto-detect, multiple target languages per call,
  HTML/markup preservation, and profanity handling.
- **Document Translation** — **asynchronous batch** translation of whole files (PDF, Office, etc.) from
  a source **Blob** container to a target container, **preserving layout/format**; also supports
  synchronous single-document translation.
- **Custom Translator** — train **domain/industry-tuned** models on **parallel corpora** (and dictionary
  data) in the Custom Translator portal, then call them by **category/model ID**.
- **Containers** — disconnected/edge text translation containers where required.

## Configuration and sizing
- Choose **single-** vs **multi-service** resource and a **region** matching **data-residency** (global
  vs geo endpoint); Document Translation requires a **regional** resource + **Blob** containers. Pick
  **tier** (`F0` free vs `S1` standard, or commitment tiers for high volume). Use **Custom Translator**
  only when generic quality is insufficient for the domain.

## Security and IAM
- Prefer **Microsoft Entra ID + RBAC** (`Cognitive Services User`) with **managed identity** over keys;
  disable key auth where possible. Use **managed identity** for **Document Translation** access to source/
  target **Blob** containers (avoid SAS where possible). Isolate with **Private Link** /
  `publicNetworkAccess=Disabled`, keep keys in **Key Vault**, and enable **CMK** if required. Mind the
  **region/geo** for data-residency.

## Cost levers
- Billed **per character** translated (text + document), by tier; **commitment tiers** discount steady
  high volume. Levers: use **F0** for dev, deduplicate/cache repeated strings, batch documents, strip
  untranslatable markup, and avoid retranslating unchanged content (translation memory / hashing).

## Scaling and limits
- **Characters-per-request and rate limits per tier** (F0 low) gate throughput. **Array size and
  request character** limits apply to text calls; **Document Translation** has file-size/count and async
  job limits. Custom Translator needs **minimum parallel-sentence counts**. Some features/regions vary.

## Operating procedure
1. **Provision** — create the **Translator / Azure AI services account** in a region matching residency
   via Terraform `azurerm_cognitive_account` (`kind = "TextTranslation"` or `"CognitiveServices"`) (or
   Bicep/`az cognitiveservices account create`); for **Document Translation** ensure a **regional**
   resource + Blob containers.
2. **Configure** — choose **text vs document** translation and source/target languages; for domain
   quality, train and publish a **Custom Translator** model and note its **category ID**.
3. **Secure** — use **Entra ID + managed identity** (incl. managed-identity to Document Translation Blob
   containers), disable key auth, set **Private Link** with `publicNetworkAccess=Disabled`, choose the
   right **geo endpoint** for residency, and enable **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the resource is ready, then **call text translate**
   on a sample (`POST .../translate?to=<lang>` via `az rest`/curl) and/or **start a Document Translation
   batch** and poll it, confirming the translated text/document is correct. Capture the translation
   output.

## Inputs
The translation task (real-time text vs batch document vs transliterate/detect), source/target
languages, data-residency/region needs, custom-model requirement + parallel corpora, expected volume
(tier), and the networking/identity security requirements.

## Output
An Azure AI Translator setup: a Translator / Azure AI services account at the chosen tier and geo, text
and/or document translation configured, optional custom model — isolated by Private Link, Entra
ID/managed identity, and CMK — plus verification that a translate call (or document batch) returns
correct output.

## Notes
- Gotchas: **region/geo controls data-residency** and **Document Translation requires a regional
  resource** + Blob containers (managed-identity access); **F0 limits are low** (use S1); custom models
  need **minimum parallel-sentence counts**; per-request character/array limits apply; cache/dedupe to
  cut character billing. This owns the **managed Azure AI Translator service** (resource, text/document
  translation, custom models, RBAC, scaling) — not the app-side localization pipeline/eval code that
  *calls* it. 2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud
  peers: AWS Translate, GCP Cloud Translation.
- IaC/CLI: Terraform `azurerm_cognitive_account` (`kind = "TextTranslation"` / `"CognitiveServices"`)
  (custom models via the Custom Translator portal); Bicep/ARM `Microsoft.CognitiveServices/accounts`. CLI
  `az cognitiveservices account create`; verify via the **Translator Text REST API** (`/translate`) and/
  or the **Document Translation** batch API with `az rest` or curl using an Entra token or key.
