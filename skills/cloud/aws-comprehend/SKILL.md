---
name: aws-comprehend
description: Use when designing, provisioning, securing, or operating Amazon Comprehend — the managed natural-language-processing service that extracts insight from text without building models (Amazon Comprehend). Loads the Comprehend knowledge: the built-in detect APIs (entities, key phrases, dominant language, sentiment and targeted sentiment, syntax/POS, and PII detection/redaction), synchronous single-document vs real-time-endpoint vs asynchronous batch analysis jobs over S3, custom models (custom entity recognition and custom document classification, trained on your labeled data and served via real-time endpoints measured in inference units), Comprehend Medical for clinical text/PHI, IAM/KMS security and VPC, cost (per unit of text for built-ins, training + endpoint inference units for custom), quotas/TPS, and verification by running detection. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Comprehend specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, comprehend, ai-ml, nlp, text-analytics, sentiment]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Comprehend

A managed **natural-language-processing** service that extracts meaning from text — entities,
sentiment, language, key phrases, PII — through API calls, with **no model to build** for the built-in
features and optional **custom models** for domain-specific entities/classification.

## Core concepts and components
- **Built-in detect APIs** — **DetectEntities**, **DetectKeyPhrases**, **DetectDominantLanguage**,
  **DetectSentiment** and **DetectTargetedSentiment**, **DetectSyntax** (POS), and **DetectPiiEntities**
  / PII redaction. Batch variants process up to 25 documents per call.
- **Analysis modes** — **synchronous** single/batch calls for small/real-time text; **asynchronous
  jobs** (`StartEntitiesDetectionJob`, etc.) over many documents in **S3** with results back to S3;
  **real-time endpoints** for custom models (provisioned **inference units**).
- **Custom models** — **Custom Entity Recognition** (recognize your domain entities) and **Custom
  Document Classification** (categorize documents), trained on your **labeled data** in S3; served via
  a real-time endpoint or run as an async job.
- **Comprehend Medical** — separate APIs for clinical text: medical entities, **PHI detection**,
  ICD-10/RxNorm ontology linking.

## Configuration and sizing
- For built-ins there is nothing to size — pick the API and (where relevant) the language. For **custom
  models**, supply enough labeled training data, then size **inference units** on the real-time endpoint
  for throughput (each unit ~ a fixed TPS/throughput) and **stop/delete the endpoint when idle** since
  it bills while provisioned. Use async jobs for large corpora; synchronous for low-latency single
  documents.

## Security and IAM
- Gate with IAM (`comprehend:*` scoped to operations/endpoints/models) plus a **data-access role**
  granting `s3:GetObject`/`s3:PutObject` on input/output buckets for async jobs and training. Encrypt
  input/output and model artifacts with **KMS**, run via **VPC** for async jobs, and lock down buckets.
  PII and medical (PHI) text are sensitive — restrict who can run detection and where output lands;
  confirm compliance (HIPAA for Medical).

## Cost levers
- Built-ins bill **per 100-character unit** (min per request); **custom** bills **training** + **
  inference-unit hours** while an endpoint runs (or per async job). Levers: batch documents, trim text
  to the needed span, **stop/delete idle custom endpoints**, prefer built-ins over custom unless
  accuracy requires custom, and use async jobs (cheaper for bulk) instead of high-volume sync calls.

## Scaling and limits
- Per-account **TPS quotas** per operation and document-size/byte limits per call; async jobs have
  concurrency limits. Custom-endpoint throughput scales with **inference units** (raise via support).
  Language support varies by feature.

## Operating procedure
1. **Provision** — create supporting resources: input/output S3 buckets, a **data-access IAM role**,
   and (custom) a classifier/entity-recognizer; via Terraform `aws_comprehend_document_classifier` /
   `aws_comprehend_entity_recognizer`, or `aws comprehend create-*`.
2. **Configure** — choose the detect API/job, language, and (custom) train the model and create a
   real-time **endpoint** with inference units; wire async jobs to S3 input/output.
3. **Secure** — least-privilege IAM + data-access role, KMS on data/models, VPC for jobs, locked
   buckets, and PII/PHI handling controls.
4. **Verify** — apply [[verify-by-running]]: run a representative call
   (`aws comprehend detect-sentiment` / `detect-entities` / `detect-pii-entities`, or for custom
   `classify-document` against the endpoint) on sample text and confirm sensible, above-threshold
   results; for an async job, poll `describe-*-detection-job` until `COMPLETED` and inspect the S3
   output — capture the actual output.

## Inputs
Analysis type(s) (entities/sentiment/PII/key-phrases/language/custom), text source + volume (sync vs
async vs endpoint), language(s), labeled data for custom models, S3 input/output + data-access role,
security/compliance model (PII/PHI/KMS), throughput (TPS / inference units) targets.

## Output
A Comprehend setup — the chosen built-in or custom NLP operations with the right analysis mode (sync /
async S3 job / real-time endpoint), trained custom models where needed, and least-privilege IAM/KMS —
plus verification that detection returns sensible results.

## Notes
- Gotchas: custom endpoints bill while provisioned — stop/delete when idle; async jobs need a
  data-access role with the right S3 bucket permissions or they fail; per-100-char unit billing means
  trimming text saves money; sync calls have document-size limits (use async for large docs); PII and
  Medical (PHI) output is sensitive — control output location and access; language support differs per
  feature; custom models need adequate labeled data.
- IaC/CLI: Terraform `aws_comprehend_document_classifier`, `aws_comprehend_entity_recognizer`. CLI
  `aws comprehend detect-entities`, `detect-sentiment`, `detect-pii-entities`,
  `start-entities-detection-job` / `describe-entities-detection-job`,
  `create-document-classifier`, `create-endpoint`, `classify-document`. There is no dedicated
  CloudFormation resource for most Comprehend objects — provision via CLI/SDK or custom resources.
