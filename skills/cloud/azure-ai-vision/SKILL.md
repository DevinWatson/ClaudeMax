---
name: azure-ai-vision
description: Use when designing, provisioning, securing, or operating Azure AI Vision — Microsoft Azure's managed computer-vision service for image analysis, OCR, spatial analysis, and face recognition (Azure AI Vision). Covers the Computer Vision / Azure AI services resource, Image Analysis 4.0 (tags, captions/dense captions, objects, people, smart crops, background removal), the Read OCR API (printed + handwritten text extraction), image/video embeddings and visual search, Spatial Analysis, the gated Face service (detection/verification/identification/liveness), multi-service vs single-service resources and pricing tiers (F0/S1), keys vs Entra ID/managed identity, Private Link/VNet, and cost. Loads the Azure AI Vision knowledge: provision a resource, call analysis/Read, secure access, and verify a result. Consumed by the azure-ai-vision specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure AI Vision).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ai-vision, ai-ml, computer-vision, ocr, image-analysis, face]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure AI Vision

Microsoft Azure's **managed computer-vision service**: analyze images, extract text (OCR), generate
visual embeddings, run spatial analysis on video, and (gated) detect/identify faces — a prebuilt vision
API behind an Azure AI services resource.

## Core concepts and components
- **Resource** — a `ComputerVision` single-service or **multi-service Azure AI services
  (`CognitiveServices`)** account, scoped to a region with an endpoint + key pair; the unit of RBAC,
  networking, and billing.
- **Image Analysis 4.0** — one call returns **visual features**: tags, **caption / dense captions**,
  **objects**, **people**, **smart crops**, **background removal**, and **Read (OCR)** text.
- **Read / OCR** — extracts **printed and handwritten text** with bounding boxes and reading order,
  synchronous (Image Analysis) or async for large/multipage inputs.
- **Image embeddings & visual search** — vectorize images/text into a shared space for **retrieval /
  visual search** (multimodal embeddings).
- **Spatial Analysis** — detects people movement/presence in **video** (containerized).
- **Face** — a **gated/limited-access** API for **detection, verification, identification, grouping,
  and liveness**; identity scenarios require approval and are restricted (no general surveillance).

## Configuration and sizing
- Choose a **single-service** (`ComputerVision`) vs **multi-service** (`CognitiveServices`) account
  depending on whether you consolidate AI services on one key. Pick **pricing tier** (`F0` free vs `S1`
  standard). Select only the **visual features** you need per call. For Face, apply for **Limited Access**
  before provisioning. Use **containers** for disconnected/edge OCR/spatial where required.

## Security and IAM
- Prefer **Microsoft Entra ID + RBAC** (`Cognitive Services User`) with **managed identity** over keys;
  disable local/key auth where possible. Isolate with **Private Link** / `publicNetworkAccess=Disabled`,
  store keys in **Key Vault**, and enable **CMK** if required. **Face** has extra Responsible-AI gating
  and data-handling obligations.

## Cost levers
- Billed **per transaction** (per 1K images/pages) by feature and tier. Levers: use **F0** for
  dev/low volume, request only needed **visual features** per call, downscale/compress images,
  batch where possible, and avoid redundant re-analysis (cache results keyed by content hash).

## Scaling and limits
- **TPS/transaction-rate limits per tier** (F0 is very low) gate throughput — request increases or use
  S1. Image **size/resolution/format** and Read **page/file-size** limits apply. **Face** is gated and
  region/feature-restricted. Some features (Spatial Analysis, certain models) are region-specific.

## Operating procedure
1. **Provision** — create the **Computer Vision / Azure AI services account** in a supported region via
   Terraform `azurerm_cognitive_account` (`kind = "ComputerVision"` or `"CognitiveServices"`) (or
   Bicep/`az cognitiveservices account create`); for **Face**, complete Limited Access approval first.
2. **Configure** — choose the **tier**, select the **visual features**/Read mode for your call, and (if
   edge) deploy the relevant **container**.
3. **Secure** — use **Entra ID + managed identity** and least-privilege RBAC, disable key auth, set
   **Private Link** with `publicNetworkAccess=Disabled`, and enable **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the resource is provisioned, then **call
   Image Analysis / Read** against a representative image (curl the `imageanalysis:analyze` endpoint or
   `az rest`) and confirm sensible **tags/caption/OCR text** with confidence scores. Capture the API
   response.

## Inputs
The vision task (analysis features, OCR/Read, embeddings/visual search, spatial, face), expected volume
(tier), region, edge/container needs, Face Limited-Access status, and the networking/identity security
requirements.

## Output
An Azure AI Vision setup: a Computer Vision / Azure AI services account at the chosen tier with the
selected features (and any edge containers) — isolated by Private Link, Entra ID/managed identity, and
CMK — plus verification that an analysis/Read call returns sensible results with confidences.

## Notes
- Gotchas: **F0 tier rate limits are very low** (use S1 for real volume); **Face is gated Limited
  Access** — apply before relying on it and respect Responsible-AI restrictions (no surveillance);
  Read/Image-Analysis have **image size/page** limits; some features are **region-specific**; cache to
  avoid paying for repeat analysis. This owns the **managed Azure AI Vision service** (resource, tier,
  features, RBAC, scaling) — not the app-side pipeline/model-training code that *calls* it (custom models
  belong to Azure ML / Custom Vision). 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peers: AWS Rekognition, GCP Vision API.
- IaC/CLI: Terraform `azurerm_cognitive_account` (`kind = "ComputerVision"` / `"CognitiveServices"`);
  Bicep/ARM `Microsoft.CognitiveServices/accounts`. CLI `az cognitiveservices account create`; verify by
  calling the **Image Analysis 4.0** (`/computervision/imageanalysis:analyze`) or **Read** endpoint via
  `az rest` or curl with an Entra token or key.
