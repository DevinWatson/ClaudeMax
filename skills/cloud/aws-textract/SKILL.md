---
name: aws-textract
description: Use when designing, provisioning, securing, or operating Amazon Textract — the managed document-analysis / OCR service that extracts text, structure, and data from scanned documents and images (Amazon Textract). Loads the Textract knowledge: synchronous APIs (DetectDocumentText, AnalyzeDocument) for single-page/small documents vs asynchronous jobs (StartDocumentTextDetection, StartDocumentAnalysis) over multi-page PDFs/TIFFs in S3, the analysis feature types (raw TEXT/OCR, FORMS key-value pairs, TABLES, QUERIES natural-language questions, SIGNATURES, LAYOUT), AnalyzeExpense for invoices/receipts and AnalyzeID for identity documents, the block/geometry/confidence output model, SNS/SQS completion notifications for async, human review with A2I, IAM/KMS/VPC security, cost (per page by feature) and quotas/concurrency, and verification by running an extraction. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Textract specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, textract, ai-ml, ocr, document-analysis, idp]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Textract

A managed **document-analysis / OCR** service that extracts printed and handwritten text, plus
**structure** (forms, tables, layout) and **answers** (queries) from documents and images via API
calls, with **no model to build**, in both synchronous and asynchronous modes.

## Core concepts and components
- **Synchronous APIs** — **DetectDocumentText** (raw OCR) and **AnalyzeDocument** (with feature types)
  for **single-page** images/PDFs and small documents; immediate response.
- **Asynchronous jobs** — **StartDocumentTextDetection** / **StartDocumentAnalysis** over **multi-page
  PDFs/TIFFs in S3**; results fetched via `GetDocument*` after a completion notification.
- **Feature types** — **FORMS** (key-value pairs), **TABLES** (rows/cells), **QUERIES**
  (natural-language questions answered from the document), **SIGNATURES**, and **LAYOUT** (titles,
  paragraphs, headers, lists, reading order); raw **OCR** needs no feature type.
- **Specialized APIs** — **AnalyzeExpense** (invoices/receipts → line items, totals) and **AnalyzeID**
  (passports/driver's licenses → typed identity fields).
- **Output model** — a graph of **Blocks** (PAGE/LINE/WORD/KEY_VALUE_SET/CELL/QUERY/…) with
  **geometry** (bounding boxes) and **confidence** scores; relationships link keys to values and tables
  to cells.
- **Completion + review** — async jobs notify via **SNS/SQS**; route low-confidence results to
  **Amazon A2I** for human review.

## Configuration and sizing
- Choose **sync vs async** by page count (sync = single page; async = multi-page PDF/TIFF in S3).
  Select only the **feature types** you need (each adds cost), define **QUERIES** for targeted
  extraction, and wire **SNS/SQS** for async completion. Nothing to size — throughput is governed by
  per-operation TPS and async concurrency quotas.

## Security and IAM
- Gate with IAM (`textract:*` scoped to operations) plus S3 access for documents and a role for async
  **SNS** publication. Encrypt documents and output with **KMS**, access privately via **VPC
  endpoints**, and lock down buckets. Documents often contain PII/PHI/financial data — restrict who can
  start jobs and where output and notifications go; confirm compliance.

## Cost levers
- Bills **per page**, priced by **feature type** (raw text cheapest; FORMS/TABLES/QUERIES/expense/ID
  cost more, and combining features stacks cost). Levers: request only the feature types you need, split
  multi-feature needs deliberately, pre-filter pages, and cache results for re-processed documents.

## Scaling and limits
- Per-account **TPS quotas** per operation and **async concurrency** limits; max document size/pages and
  resolution constraints per call. Feature/region availability varies. Raise quotas via Service
  Quotas/support.

## Operating procedure
1. **Provision** — create input S3 bucket(s), the IAM access (`textract` + `s3` + async **SNS** role),
   KMS keys, and any **A2I** human-review workflow; via Terraform (S3/IAM/SNS — there is no Textract
   job resource), or `aws textract` CLI/SDK calls.
2. **Configure** — choose sync vs async, select feature types (FORMS/TABLES/QUERIES/LAYOUT/SIGNATURES)
   or a specialized API (AnalyzeExpense/AnalyzeID), define queries, and wire SNS/SQS completion.
3. **Secure** — least-privilege IAM, KMS on documents/output, VPC endpoints, locked buckets, and
   PII/PHI/financial-data handling controls.
4. **Verify** — apply [[verify-by-running]]: run a representative extraction
   (`aws textract analyze-document --feature-types FORMS TABLES` on a sample image, or for multi-page
   `start-document-analysis` → poll `get-document-analysis` until `SUCCEEDED`) and inspect the Blocks for
   sensible text/key-values/tables with acceptable confidence — capture the actual output.

## Inputs
Mode (sync single-page vs async multi-page S3), document type/format (image/PDF/TIFF), needed feature
types (OCR/FORMS/TABLES/QUERIES/LAYOUT/SIGNATURES) or specialized API (expense/ID), queries, SNS/SQS +
A2I wiring, security/compliance (PII/PHI/financial, KMS/VPC), throughput (TPS/concurrency) targets.

## Output
A Textract setup — the chosen mode (sync or async S3 job) with the right feature types or specialized
API, queries, completion notifications, optional human review, and least-privilege IAM/KMS — plus
verification that extraction returns sensible blocks/values.

## Notes
- Gotchas: sync APIs are single-page only — multi-page PDFs require async over S3; each feature type adds
  per-page cost (combining FORMS+TABLES+QUERIES is expensive); async needs an SNS topic + publish role or
  you never learn the job finished; QUERIES accuracy depends on phrasing; handwriting and low-resolution
  scans lower confidence; documents frequently contain PII — handle output carefully.
- IaC/CLI: there is no dedicated Terraform/CloudFormation resource for Textract jobs — provision the
  surrounding S3/IAM/SNS/KMS with IaC and run extraction via CLI/SDK. CLI `aws textract
  detect-document-text`, `analyze-document`, `start-document-text-detection`,
  `start-document-analysis` / `get-document-analysis`, `analyze-expense`, `analyze-id`.
