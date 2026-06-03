---
name: gcp-translation
description: Use when designing, provisioning, securing, or operating Cloud Translation — Google Cloud's pretrained machine translation service: the Basic edition (v2, simple text/HTML translation + language detection) and the Advanced edition (v3, glossaries, batch document and text translation, custom AutoML translation models, model selection, and Cloud Storage I/O), plus language support, format handling, IAM, residency, and cost (Cloud Translation). Loads the Translation knowledge: pick Basic vs Advanced, translate text/documents synchronously or in batch, attach glossaries and custom models, secure the identity, and verify an accurate translation. Consumed by the Cloud Translation specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add translation.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, translation, ai-ml, machine-translation, glossary, localization]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Translation

A pretrained machine translation service that converts text and documents between languages. You send
source content plus source/target language codes and it returns translations — no model hosting
required, with an optional Advanced edition for glossaries, batch, and custom models.

## Core concepts and components
- **Editions** — **Basic (v2)**: simple synchronous text/HTML translation and **language detection**,
  no glossaries or batch. **Advanced (v3)**: everything in Basic plus glossaries, batch translation,
  document translation, custom models, and model selection.
- **Translation modes** — **online/synchronous** text translation, **document translation** (translate
  PDF/DOCX/PPTX preserving formatting), and **batch** text/document translation reading from and
  writing to **Cloud Storage** for large jobs.
- **Glossaries** (Advanced) — uploaded term mappings (unidirectional or equivalent-term sets) that
  force consistent translation of product names, brand terms, and domain vocabulary.
- **Custom models** — **AutoML Translation** custom models trained on your bilingual data, selected
  per request alongside the NMT base model.
- **Language detection** — identify the source language when unknown; **language support** lists the
  ~100+ supported pairs.

## Configuration and sizing
- Pick **Basic** for plain low-volume text and detection; pick **Advanced** when you need glossaries,
  batch, document translation, or custom models. Set source (or auto-detect) + target language codes,
  declare the MIME type for HTML/document content, and for batch point at Cloud Storage input/output
  prefixes. Select a regional endpoint for residency/latency; glossaries and custom models are
  regional resources referenced by request.

## Security and IAM
- Translate with a dedicated **service account** scoped to `roles/cloudtranslate.user` and the relevant
  Cloud Storage buckets — avoid API keys for server use. Source text may be **sensitive/PII**: CMEK-encrypt
  Cloud Storage I/O for batch, restrict bucket access, enable **VPC Service Controls**, choose a
  regional endpoint for residency, and audit via Cloud Audit Logs.

## Cost levers
- Cost is per **character** translated (Advanced features and document/batch are priced separately;
  language detection is also per character). Levers: cache repeated translations, de-duplicate content,
  batch large jobs instead of many tiny online calls, avoid re-translating unchanged content, and use
  glossaries rather than re-running to fix terminology.

## Scaling and limits
- Online requests have per-request size limits (chunk large text); batch handles large corpora from
  Cloud Storage. Per-project QPS and character-per-100-seconds quotas apply — raise via the quotas
  page. The service is fully managed (no infrastructure to scale).

## Operating procedure
1. **Provision** — enable the Translation API (`gcloud services enable translate.googleapis.com`;
   Terraform `google_project_service`), create a least-privilege **service account**, and (for
   batch/document) the Cloud Storage **buckets**.
2. **Configure** — choose **Basic vs Advanced**, set source/target languages (or detection), declare
   MIME type, and for Advanced attach a **glossary** and/or **custom model** and wire batch/document
   Cloud Storage I/O.
3. **Secure** — scope the service account least-privilege, CMEK-encrypt batch buckets, pick the
   regional endpoint for residency, enable VPC-SC, and protect sensitive source text.
4. **Verify** — apply [[verify-by-running]]: confirm enablement via `gcloud services list`, then
   translate a representative sample (`gcloud ml translate translate-text` or the v3 SDK) and confirm
   an accurate translation with the glossary terms honored — capture the actual output.

## Inputs
Content type + volume (text / HTML / document / batch), source + target language(s), edition need
(glossary / batch / custom model), region/residency, sensitivity + encryption requirements, and IAM
scope.

## Output
A Cloud Translation integration (Basic or Advanced, online/document/batch wiring, optional
glossary/custom model, regional endpoint, scoped service account, CMEK on batch I/O) plus verification
of an accurate sample translation with glossary terms honored.

## Notes
- Gotchas: Basic (v2) has no glossaries/batch/custom models — needing any of those forces Advanced
  (v3); glossaries and custom models are regional and must match the request region; declaring the
  wrong MIME type breaks HTML/document handling; batch I/O lives in Cloud Storage (CMEK, VPC-SC for
  sensitive text); pricing differs by edition/feature. This is text→text translation — for speech use
  Speech-to-Text + Text-to-Speech; the AWS equivalent is Amazon Translate.
- IaC/CLI: Terraform `google_project_service` (enable) + `google_service_account`/IAM and
  `google_storage_bucket` for batch I/O; glossaries/custom models have limited first-class Terraform
  coverage — create via API/SDK. CLI `gcloud ml translate translate-text`,
  `gcloud ml translate detect-language`; the Translation v3 REST/SDK for glossaries, batch, document,
  and custom-model requests.
