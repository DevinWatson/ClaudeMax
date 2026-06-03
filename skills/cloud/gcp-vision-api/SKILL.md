---
name: gcp-vision-api
description: Use when designing, provisioning, securing, or operating the Cloud Vision API — Google Cloud's pretrained image-understanding REST/SDK service: label detection, OCR (text + document text detection), object localization, face and landmark/logo detection, image properties, crop hints, web detection, and SafeSearch (explicit-content) moderation, with single-image annotate and batch async annotation from Cloud Storage (Vision API). Loads the Vision API knowledge: enable the API, call the right feature(s), batch large jobs, secure the key/service account, and verify annotations. Consumed by the Vision API specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add image analysis.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, vision-api, ai-ml, image-analysis, ocr, safesearch]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Vision API

A pretrained, REST/SDK image-understanding service. You send an image (inline bytes or a Cloud
Storage URI) and request one or more **features**; it returns annotations — no model training or
hosting required. It is the single-image counterpart to Vertex AI Vision's streaming video pipelines.

## Core concepts and components
- **Features** (request one or many per image):
  - **Label detection** — general content labels.
  - **Text detection / Document text detection** — OCR for sparse text vs dense document pages.
  - **Object localization** — bounding boxes for multiple objects.
  - **Face detection** — face bounding boxes + landmarks/emotions (not identity recognition).
  - **Landmark / Logo detection**, **Web detection** (matching web entities/images).
  - **Image properties** (dominant colors), **Crop hints**.
  - **SafeSearch** — explicit-content likelihood (adult/violence/racy/medical/spoof) for moderation.
- **Requests** — `annotate` (synchronous single/small image) and `asyncBatchAnnotate` (batch from
  Cloud Storage to Cloud Storage for many/large images, e.g. multipage PDFs/TIFFs).
- **Product Search** — a separate Vision capability for visual product matching (catalog-based).

## Configuration and sizing
- Request only the features you need (each adds cost). Use inline bytes for small interactive images;
  use Cloud Storage URIs + **async batch** for large volumes or PDF/TIFF. Choose the right OCR mode
  (`TEXT_DETECTION` for sparse, `DOCUMENT_TEXT_DETECTION` for dense documents). There is no model to
  size — it is fully managed and pretrained.

## Security and IAM
- Prefer a **service account** with `roles/serviceusage` + the Vision scope over long-lived **API
  keys**; if a key is used, restrict it (API + referrer/IP restrictions) and rotate it. Images may
  contain PII/faces — encrypt Cloud Storage inputs/outputs (CMEK), restrict bucket access, use SafeSearch
  for moderation pipelines, and audit via Cloud Audit Logs. VPC-SC where exfiltration control is
  required.

## Cost levers
- Cost is per **feature per image** (or per page for documents), so the levers are: request only
  needed features, batch instead of many synchronous calls, cache results to avoid re-annotating, and
  downscale oversized images. SafeSearch + label on every upload is a common cost surprise.

## Scaling and limits
- Synchronous `annotate` has per-request image-count and size limits and per-project QPS quotas; use
  **async batch** for large jobs. Quotas are raisable via the quotas page. No infrastructure to
  scale — it is fully managed.

## Operating procedure
1. **Provision** — enable the Vision API (`gcloud services enable vision.googleapis.com`;
   Terraform `google_project_service`) and create a least-privilege **service account** (or a
   restricted API key) plus, for batch, source/output **Cloud Storage** buckets.
2. **Configure** — choose the **feature(s)** and OCR mode, decide synchronous vs **async batch**, and
   wire input/output Cloud Storage locations for batch.
3. **Secure** — prefer a scoped service account over API keys (and restrict keys if used), CMEK-encrypt
   image buckets, restrict access (PII/faces), and enable VPC-SC where required.
4. **Verify** — apply [[verify-by-running]]: enable confirmed via `gcloud services list`, then call
   the API on a representative image (`gcloud ml vision detect-labels`/`detect-text` or the SDK) and
   confirm the expected annotations (labels/text/SafeSearch) come back with sensible scores — capture
   the actual output.

## Inputs
Image source (inline vs Cloud Storage URI), the analysis feature(s) needed, volume + synchronous-vs-batch,
output location for batch, region/residency, PII/moderation requirements, and IAM/key strategy.

## Output
A Vision API integration (enabled API, scoped service account or restricted key, chosen feature set,
synchronous or async-batch wiring with Cloud Storage, CMEK on buckets) plus verification of a real
annotation response (labels/text/SafeSearch) with sensible confidence scores.

## Notes
- Gotchas: cost is per feature per image — don't request every feature by default; face detection is
  detection, NOT identity recognition; use `DOCUMENT_TEXT_DETECTION` for dense pages; async batch is
  required for large/PDF jobs; API keys are easily leaked — prefer scoped service accounts and
  restrict any key. For document STRUCTURE (forms/entities) use Document AI; for VIDEO use Vertex AI
  Vision; for CUSTOM image models use Vertex AI; the AWS equivalent is Amazon Rekognition.
- IaC/CLI: Terraform `google_project_service` (enable the API) + `google_service_account`/IAM and
  `google_storage_bucket` for batch I/O — there are no per-call Terraform resources (the API is
  invoked at runtime). CLI `gcloud ml vision detect-labels / detect-text / detect-safe-search`; the
  Vision REST API (`images:annotate`, `images:asyncBatchAnnotate`) / client SDKs for application use.
