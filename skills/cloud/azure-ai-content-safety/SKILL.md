---
name: azure-ai-content-safety
description: Use when designing, provisioning, securing, or operating Azure AI Content Safety — Microsoft Azure's managed service for moderating text and image content and protecting LLM apps from prompt attacks (Azure AI Content Safety). Covers the Content Safety / Cognitive Services resource, the text and image moderation APIs with four harm categories (Hate, Sexual, Violence, Self-Harm) scored by severity, custom blocklists, Prompt Shields (jailbreak/indirect prompt-injection detection), Groundedness detection and Protected Material detection, keys vs Entra ID/managed identity, Private Link/VNet, and cost. Loads the Content Safety knowledge: provision a resource, configure categories/blocklists/Prompt Shields, secure access, and verify a moderation call. Consumed by the azure-ai-content-safety specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure AI Content Safety).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ai-content-safety, ai-ml, content-moderation, prompt-shields, responsible-ai]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure AI Content Safety

Microsoft Azure's **managed content-moderation service** that detects harmful or unwanted material in
**text and images** and defends LLM applications against prompt-based attacks — exposed through an
Azure AI Services / Cognitive Services resource with Azure identity, networking, and SLAs.

## Core concepts and components
- **Resource** — a `ContentSafety` (or multi-service `CognitiveServices`/`AIServices`) account scoped to
  a region with an endpoint and key pair; the unit of RBAC, networking, and billing.
- **Text moderation** (`/text:analyze`) — classifies input across four **harm categories** (Hate,
  Sexual, Violence, Self-Harm), each returned with a **severity** level (0/2/4/6 full scale, or 0–7); the
  caller decides a threshold per category to allow/block.
- **Image moderation** (`/image:analyze`) — same four categories with severity for image content
  (base64 or blob reference).
- **Blocklists** — custom term lists managed via the blocklist API and attached to a text-analyze call to
  block or flag exact/substring terms beyond the ML categories.
- **Prompt Shields** — detection of **direct jailbreak** (user-prompt attacks) and **indirect**
  prompt-injection embedded in documents, for protecting LLM prompts.
- **Groundedness detection** — flags ungrounded/hallucinated LLM output against provided source text.
- **Protected Material detection** — flags known copyrighted text (and code) in model output.

## Configuration and sizing
- Choose a **region** offering Content Safety and your needed features (Prompt Shields, Groundedness,
  Protected Material availability varies). Set **per-category severity thresholds** in your application
  policy (the service scores; you enforce). Create and version **blocklists**; attach them per request.
  Pin the API version for reproducible behavior. There is no per-deployment sizing — throughput is gated
  by RPS/TPS quota on the resource SKU (Free F0 vs Standard S0).

## Security and IAM
- Prefer **Microsoft Entra ID** auth with **managed identity** and the `Cognitive Services User` role over
  **API keys**; disable local/key auth where possible. Isolate with **Private Link / VNet** and
  `publicNetworkAccess=Disabled`. Store any keys in **Key Vault**. Enable **customer-managed keys (CMK)**
  if required. Restrict who can edit blocklists or change resource configuration.

## Cost levers
- Billed per **1K text records / per image / per Prompt Shield or Groundedness call**. Levers: use **F0
  Free** tier for low volume/testing; pre-filter with cheap blocklists before ML calls; batch where the
  API allows; only call **Groundedness/Protected Material** on outputs that warrant it; cache decisions
  for identical inputs.

## Scaling and limits
- Throughput is gated by **RPS quota** on the SKU (request increases ahead of need). Text payloads and
  blocklist counts/terms are size-bounded; image size limits apply. Feature + region availability varies —
  confirm before choosing a region.

## Operating procedure
1. **Provision** — create the **Content Safety / AI Services account** in a feature-bearing region via
   Terraform `azurerm_cognitive_account` (`kind = "ContentSafety"` or `"CognitiveServices"`) (or
   Bicep/`az cognitiveservices account create`).
2. **Configure** — define **blocklists** and terms (blocklist API / `az`), decide **per-category severity
   thresholds** in app policy, and select which detections (text, image, Prompt Shields, Groundedness,
   Protected Material) you will call.
3. **Secure** — use **Entra ID + managed identity** and least-privilege roles, disable key/local auth, set
   **Private Link** with `publicNetworkAccess=Disabled`, and enable **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the resource is provisioned
   (`az cognitiveservices account show`), then **call it** — POST a known-harmful sample to `/text:analyze`
   (curl with an Entra token or `az rest`) and confirm the expected category severities, and POST a
   jailbreak sample to the Prompt Shields API and confirm detection. Capture the actual responses.

## Inputs
The moderation needs (text and/or image, which categories matter, severity thresholds), whether you need
Prompt Shields / Groundedness / Protected Material, any custom blocklist terms, the region, the SKU, and
the networking/identity/CMK security requirements.

## Output
An Azure AI Content Safety setup: a Content Safety / AI Services account with configured blocklists and a
documented per-category threshold policy, the chosen detections enabled — isolated by Private Link, Entra
ID/managed identity, and CMK — plus verification that text and Prompt Shields calls return the expected
results.

## Notes
- Gotchas: the service **scores**, your app **enforces** — choosing thresholds is a policy decision, not a
  service setting; **severity scales differ** by API version (4-level vs 8-level) so pin the version;
  **Prompt Shields / Groundedness / Protected Material** availability is region- and version-specific;
  blocklists match terms literally and can over/under-block — test them. This owns the **managed Content
  Safety service** (resource, blocklists, detections, auth) — not the app-side moderation orchestration or
  eval harness that *calls* it. 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peers: AWS Bedrock Guardrails / Rekognition Moderation, GCP Model
  Armor / Vision SafeSearch.
- IaC/CLI: Terraform `azurerm_cognitive_account` (`kind = "ContentSafety"`); Bicep/ARM
  `Microsoft.CognitiveServices/accounts`. CLI `az cognitiveservices account create` / `... show`; verify by
  POSTing to the `/contentsafety/text:analyze` and Prompt Shields endpoints with `az rest` or curl.
