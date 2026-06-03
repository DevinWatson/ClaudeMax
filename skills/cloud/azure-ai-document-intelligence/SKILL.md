---
name: azure-ai-document-intelligence
description: Use when designing, provisioning, securing, or operating Azure AI Document Intelligence — Microsoft Azure's managed document-processing service (formerly Form Recognizer) that extracts text, layout, tables, key-value pairs, and structured fields from documents (Azure AI Document Intelligence). Covers the Document Intelligence (Cognitive Services) resource, prebuilt models (read/OCR, layout, general document, invoice, receipt, ID, tax/W-2, contract, health card), custom models (template/neural extraction + classification + composed), the layout API (incl. RAG chunking), training/labeling over Blob, async analyze operations, tiers, keys vs Entra ID/managed identity, Private Link, and cost. Loads the knowledge: provision a resource, analyze with prebuilt or train a custom model, secure, and verify. Consumed by the azure-ai-document-intelligence specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure AI Document Intelligence).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ai-document-intelligence, ai-ml, ocr, forms, document-extraction]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure AI Document Intelligence

Microsoft Azure's **managed document-processing service** (formerly Form Recognizer): extract text,
layout, tables, key-value pairs, and structured fields from documents using **prebuilt** or **custom**
models — turning PDFs/images/forms into structured data behind an Azure AI services resource.

## Core concepts and components
- **Resource** — a `FormRecognizer` single-service or **multi-service Azure AI services
  (`CognitiveServices`)** account with a regional endpoint + key pair; the unit of RBAC, networking, and
  billing.
- **Prebuilt models** — ready-to-use extractors: **read/OCR**, **layout** (text + tables + selection
  marks + reading order), **general document** (key-value pairs), and domain models — **invoice,
  receipt, ID document, business card, W-2/tax, contract, health insurance card**.
- **Layout API** — structural extraction (paragraphs, tables, selection marks, reading order),
  commonly used to **chunk documents for RAG** ingestion.
- **Custom models** — **template** (form-consistent) and **neural** (varied layouts) **extraction**
  models, **custom classification** models, and **composed models** (route to the right sub-model);
  trained from labeled samples in **Document Intelligence Studio** over **Blob storage**.
- **Analyze operations** — submit a document (URL or bytes) to a model; analysis is **async** (poll the
  operation for the structured JSON result with confidences + bounding regions).

## Configuration and sizing
- Choose **single-** vs **multi-service** resource and a supported **region**. Pick **tier** (`F0` free
  vs `S0` standard). Use a **prebuilt** model if one fits; otherwise label samples and train a **custom
  neural/template** model (and a **classifier** + **composed** model when documents are mixed). Attach a
  **storage account** for training data. Use the **layout** model for RAG chunking.

## Security and IAM
- Prefer **Microsoft Entra ID + RBAC** (`Cognitive Services User`) with **managed identity** over keys;
  disable key auth where possible. Use **managed identity** for access to **Blob** training/analyze data
  (avoid SAS where possible). Isolate with **Private Link** / `publicNetworkAccess=Disabled`, keep keys in
  **Key Vault**, and enable **CMK** if required.

## Cost levers
- Billed **per page** by model type/tier (custom can differ from prebuilt; read/layout vs structured).
  Levers: use **F0** for dev, pick the **cheapest model that meets accuracy** (read/layout < custom for
  many cases), batch documents, downscale large scans, and cache results by content hash to avoid
  re-analysis.

## Scaling and limits
- **Transactions-per-second per tier** (F0 very low) gate throughput. **Page count and file-size per
  document** are bounded; analysis is **async** with operation-result retention windows. Custom-model
  **training-sample minimums**, model count limits, and **region availability** apply.

## Operating procedure
1. **Provision** — create the **Document Intelligence / Azure AI services account** in a supported region
   via Terraform `azurerm_cognitive_account` (`kind = "FormRecognizer"` or `"CognitiveServices"`) (or
   Bicep/`az cognitiveservices account create`); attach **storage** for custom training.
2. **Configure** — pick a **prebuilt** model, or label samples and **train a custom** extraction/
   classification (+ composed) model in Document Intelligence Studio.
3. **Secure** — use **Entra ID + managed identity** (incl. managed-identity to Blob data), disable key
   auth, set **Private Link** with `publicNetworkAccess=Disabled`, and enable **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the resource (and any **custom model**) is ready,
   then **analyze** a representative document (`POST .../documentModels/<model>:analyze` via `az rest`/
   curl, poll the operation) and confirm the extracted **fields/tables/text** with confidences are
   correct. Capture the analyze result.

## Inputs
The document types and extraction goal (read/layout vs prebuilt domain vs custom fields/classification),
labeled training data for custom models, expected volume (tier), region, RAG-chunking needs, and the
networking/identity security requirements.

## Output
An Azure AI Document Intelligence setup: a Document Intelligence / Azure AI services account at the chosen
tier with a selected prebuilt model and/or a trained custom/composed model — isolated by Private Link,
Entra ID/managed identity, and CMK — plus verification that an analyze call returns correct structured
fields/tables with confidences.

## Notes
- Gotchas: **F0 TPS is very low** (use S0 for volume); **custom models need labeled samples + a
  train/test cycle** and linked storage (managed-identity access); analysis is **async** (poll the
  operation; results expire); **page-count/file-size** limits per document; pick the **cheapest adequate
  model** (read/layout vs custom). The **layout** model is the usual RAG chunker. This owns the **managed
  Azure AI Document Intelligence service** (resource, prebuilt/custom models, RBAC, scaling) — not the
  app-side ingestion/RAG/eval code that *calls* it. 2nd consumer: the Azure role team (azure-iac-engineer
  / azure-cloud-architect). Cross-cloud peers: AWS Textract, GCP Document AI.
- IaC/CLI: Terraform `azurerm_cognitive_account` (`kind = "FormRecognizer"` / `"CognitiveServices"`)
  (custom models via Document Intelligence Studio/REST); Bicep/ARM `Microsoft.CognitiveServices/accounts`.
  CLI `az cognitiveservices account create`; verify via the **Document Intelligence REST API**
  (`/documentintelligence/documentModels/<model>:analyze`) with `az rest` or curl using an Entra token or
  key.
