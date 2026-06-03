---
name: gcp-sensitive-data-protection
description: Use when designing, provisioning, securing, or operating Sensitive Data Protection (Cloud DLP) — Google Cloud's service for discovering, classifying, and de-identifying sensitive data such as PII, PHI, and credentials (Sensitive Data Protection). Covers infoTypes (built-in + custom regex/dictionary/stored), inspection templates and inspect jobs over text/images/BigQuery/Cloud Storage/Datastore, de-identification templates (masking, redaction, tokenization, format-preserving and deterministic encryption, date shifting, bucketing), data-profiling/discovery for org-wide classification, and risk analysis (k-anonymity, l-diversity, re-identification), plus IAM and cost. Loads the DLP knowledge: build infoType/inspect/deidentify templates, run jobs, and verify findings. Consumed by the Sensitive Data Protection specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when classifying or masking data (Sensitive Data Protection).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, sensitive-data-protection, cloud-dlp, security, pii, de-identification, classification]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Sensitive Data Protection (Cloud DLP)

Google Cloud's service for **discovering, classifying, and de-identifying sensitive data** — PII, PHI,
credentials, financial identifiers — across text, images, and structured stores. Formerly "Cloud DLP",
it powers data classification, masking/tokenization, and re-identification risk analysis.

## Core concepts and components
- **infoTypes** — detectors for sensitive categories (built-in like `EMAIL_ADDRESS`,
  `CREDIT_CARD_NUMBER`, `US_SOCIAL_SECURITY_NUMBER`) plus **custom** detectors (regex, **dictionary**,
  **stored** large dictionaries) and **likelihood** thresholds. Hotword/exclusion rules tune precision.
- **Inspection templates / inspect jobs** — reusable config that scans **text, images, BigQuery,
  Cloud Storage, and Datastore** for infoTypes and emits **findings** (type, location, likelihood);
  jobs can write findings to BigQuery and trigger on schedules.
- **De-identification templates** — transformations: **masking**, **redaction**, **replacement**,
  **bucketing/generalization**, **date shifting**, **crypto tokenization** — deterministic
  (DeterministicConfig), **format-preserving encryption (FPE)**, and re-identifiable via a KMS-wrapped
  key. Used to produce safe copies or stream-redact.
- **Discovery / data profiles** — org/folder/project **data profiling** that continuously classifies
  BigQuery (and more) tables, scoring sensitivity/risk without per-job setup.
- **Risk analysis** — **k-anonymity, l-diversity, k-map, δ-presence** metrics on a dataset to quantify
  **re-identification** risk before sharing.

## Configuration and sizing
- Centralize **inspect** and **deidentify templates** so jobs/pipelines reuse them. Tune **infoTypes +
  likelihood + custom detectors** to your data to cut false positives. For reversible tokenization use
  **FPE/deterministic** with a **KMS-wrapped crypto key**; for one-way safety use masking/redaction.
  Use **discovery profiles** for continuous org-wide classification rather than ad-hoc jobs.

## Security and IAM
- Grant `roles/dlp.user` (run jobs/inspect/deidentify) and `roles/dlp.admin` sparingly. Protect the
  **KMS crypto key** used for tokenization — control of it controls re-identification. Findings output
  (BigQuery) reveals where sensitive data lives — **secure the findings dataset**. Run jobs under a
  least-privilege **service account** with read access to only the scanned sources.

## Cost levers
- Billed by **bytes inspected/transformed** (with discovery priced separately). Levers: scope jobs to
  the right tables/buckets, **sample** large datasets, limit infoTypes to what matters, and avoid
  re-scanning unchanged data — use discovery profiles' incremental scanning.

## Scaling and limits
- Per-request content-size limits (inspect/deidentify content vs storage jobs differ), findings caps
  per job, and per-project **quotas** (jobs, requests/min). Storage jobs scale to large BigQuery/GCS
  datasets; very large stores should use **sampling** and partitioned scans.

## Operating procedure
1. **Provision** — enable `dlp.googleapis.com`; create a least-privilege **service account** with read
   on the sources and write on the findings destination; if tokenizing, create the **KMS key**.
2. **Configure** — author an **inspection template** (infoTypes, likelihood, custom detectors) and a
   **de-identification template** (masking/redaction/FPE/tokenization), via Terraform
   `google_data_loss_prevention_*`; define **inspect/deidentify jobs** or wire templates into pipelines
   (Dataflow/Cloud Functions); optionally enable **discovery profiles**.
3. **Secure** — lock the **findings dataset** and the **KMS crypto key**; scope the service account;
   ensure de-identified outputs are stored separately from raw data.
4. **Verify** — apply [[verify-by-running]]: run `gcloud dlp` (or the API) **inspect** on a known
   sample and confirm it **finds the planted PII** at the expected likelihood, run **deidentify** and
   confirm the output is **masked/tokenized** (and, for FPE, **re-identifies** correctly with the key),
   and run **risk analysis** to confirm the k-anonymity metric. Capture the findings and the
   before/after de-identified payload.

## Inputs
The data sources to scan (text/images/BigQuery/GCS/Datastore), which infoTypes/sensitive categories
matter, whether de-identification must be reversible (FPE/tokenization) or one-way (mask/redact), the
findings destination, and IAM/KMS constraints.

## Output
Reusable inspection and de-identification templates, configured inspect/deidentify jobs or pipeline
integration (and optionally discovery profiles), with least-privilege IAM and a secured KMS key, plus
verification that inspection finds planted sensitive data and de-identification masks/tokenizes it
correctly.

## Notes
- Gotchas: **likelihood thresholds + custom detectors** drive precision — untuned scans over-report;
  reversible **tokenization depends on the KMS key** (lose/leak it and you lose/expose re-id ability);
  **content** methods have small size limits vs **storage** jobs (sample big data); **findings output
  is itself sensitive** — secure it; discovery profiling and per-job inspection are **billed
  separately**. 2nd consumer: the GCP role team uses this for data classification/posture, not just the
  specialist. Cross-cloud peer is AWS Macie.
- IaC/CLI: Terraform `google_data_loss_prevention_inspect_template`,
  `google_data_loss_prevention_deidentify_template`, `google_data_loss_prevention_job_trigger`,
  `google_data_loss_prevention_stored_info_type`, and `google_kms_crypto_key` for tokenization. CLI
  `gcloud dlp` (inspect/deidentify/jobs) and the `dlp.googleapis.com` REST API to run and verify.
