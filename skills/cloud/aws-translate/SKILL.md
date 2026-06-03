---
name: aws-translate
description: Use when designing, provisioning, securing, or operating Amazon Translate — the managed neural machine-translation service that translates text between languages (Amazon Translate). Loads the Translate knowledge: real-time translation (TranslateText) vs asynchronous batch translation jobs over S3, automatic source-language detection, the supported language-pair matrix, custom terminology (CSV/TMX glossaries) to enforce brand/domain term translations, parallel data + Active Custom Translation (ACT) for domain-adapted output, profanity masking and formality settings, document translation (translating formatted documents), IAM/KMS/VPC security, cost (per character, tiered; ACT surcharge) and quotas/TPS, and verification by running a translation. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Translate specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, translate, ai-ml, machine-translation, localization, nlp]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Translate

A managed **neural machine-translation (NMT)** service that translates text and documents between
languages via API calls, with **no model to build**, plus customization (terminology, parallel data) to
adapt output to your domain and brand.

## Core concepts and components
- **Real-time translation** — **TranslateText** for low-latency, on-demand translation of short text;
  source language can be explicit or **auto-detected**.
- **Asynchronous batch jobs** — `StartTextTranslationJob` over many documents in **S3**, output back to
  S3; ideal for bulk/large content.
- **Document translation** — translate **formatted documents** (e.g., HTML/DOCX/plain text) in real time
  while preserving structure.
- **Custom terminology** — upload **CSV/TMX glossaries** so specific source terms always map to chosen
  translations (brand names, product terms).
- **Active Custom Translation (ACT)** — supply **parallel data** (example translations) so output is
  tailored to your domain style **without training a custom model**.
- **Controls** — **profanity masking** and **formality** (formal/informal) where the language pair
  supports it.

## Configuration and sizing
- Choose **real-time vs batch** by volume/latency. Set source (or auto-detect) + target language(s),
  attach a **custom terminology** and/or **parallel data** (ACT) for domain accuracy, and set
  profanity/formality. Nothing to size — throughput is governed by TPS quotas and batch concurrency.

## Security and IAM
- Gate with IAM (`translate:*` scoped to operations/terminologies/parallel-data) plus a **data-access
  role** granting `s3:GetObject`/`s3:PutObject` on input/output buckets for batch jobs and
  terminology/parallel-data import. Encrypt input/output with **KMS**, run privately via **VPC
  endpoints**, and lock down buckets. Source text may be sensitive — control what is sent and where
  output lands.

## Cost levers
- Bills **per character** translated (tiered), with a **surcharge for ACT** (parallel-data) translations.
  Levers: deduplicate/cache repeated strings, batch instead of high-volume real-time calls, use custom
  terminology (cheap) before reaching for ACT, and trim text to what needs translating.

## Scaling and limits
- Per-account **TPS quotas** and document-size/byte limits per real-time call; batch jobs have
  concurrency limits and per-document size caps. Language-pair support and features (formality, ACT)
  vary. Raise quotas via Service Quotas/support.

## Operating procedure
1. **Provision** — create input/output S3 buckets, a **data-access IAM role**, and any **custom
   terminology** and **parallel data**; via Terraform `aws_translate_*` where available, or
   `aws translate import-terminology` / `create-parallel-data`.
2. **Configure** — choose real-time or batch, set source/target languages (or auto-detect), attach
   terminology/parallel data, and set profanity/formality.
3. **Secure** — least-privilege IAM + data-access role, KMS on data, VPC endpoints, locked buckets.
4. **Verify** — apply [[verify-by-running]]: run a representative translation
   (`aws translate translate-text --source-language-code auto --target-language-code <lang>
   --text "..."`) and confirm a sensible translation that honors any custom terminology; for batch, run
   `start-text-translation-job`, poll `describe-text-translation-job` until `COMPLETED`, and inspect the
   S3 output — capture the actual output.

## Inputs
Mode (real-time vs batch vs document), source (or auto-detect) + target language(s), customization
(custom terminology, parallel data/ACT), profanity/formality controls, S3 input/output + data-access
role, security/compliance (KMS/VPC), throughput (TPS / batch concurrency) targets.

## Output
A Translate setup — the chosen mode (real-time / batch S3 job / document) with the right language pairs,
custom terminology and/or ACT parallel data, profanity/formality controls, and least-privilege IAM/KMS —
plus verification that translation returns sensible, terminology-honoring output.

## Notes
- Gotchas: batch jobs need a data-access role with the right S3 permissions or they fail; custom
  terminology is case/format-sensitive (CSV/TMX) and applies per direction; ACT adds cost and needs good
  parallel data; auto language detection can misfire on short text; formality is only supported on some
  language pairs; per-character billing means deduping repeated strings saves money.
- IaC/CLI: Terraform coverage for Translate resources is limited (some `aws_translate_*` resources may
  not exist) — import terminology/parallel data via CLI/SDK as a fallback. CLI
  `aws translate translate-text`, `translate-document`, `start-text-translation-job`,
  `describe-text-translation-job`, `import-terminology`, `create-parallel-data`,
  `update-parallel-data`. CloudFormation coverage is limited — provision via CLI/SDK.
