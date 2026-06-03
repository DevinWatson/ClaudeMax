---
name: gcp-document-ai
description: Use when designing, provisioning, securing, or operating Document AI — Google Cloud's document parsing platform: processors (OCR/Document OCR, Form Parser, specialized parsers like Invoice/Receipt/ID, and custom extractors trained in the Workbench), online and batch document processing, form + entity extraction with confidence scores, human-in-the-loop review, and the Document AI Warehouse for storing/searching processed documents (Document AI). Loads the Document AI knowledge: create a processor, process documents online/batch, extract entities, and verify the output schema. Consumed by the Document AI specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle document-processing workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, document-ai, ai-ml, ocr, document-parsing, entity-extraction]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Document AI

A managed platform for turning documents (PDFs, scans, images) into structured data. You route a
document through a **processor** that performs OCR and extracts text, layout, form fields, and
domain entities, returning a structured **Document** object with confidence scores. It spans
general OCR, pre-trained specialized parsers, and custom-trained extractors.

## Core concepts and components
- **Processors** — the unit of processing, each an endpoint of a specific type:
  - **Document OCR** — text + layout extraction.
  - **Form Parser** — key/value pairs, tables, checkboxes.
  - **Specialized parsers** — pre-trained for Invoice, Receipt, ID documents, US bank statements, etc.
  - **Custom processors** — Custom Extractor / Custom Classifier trained in the **Workbench** on your
    labeled documents.
- **Processing modes** — **online** (synchronous, single small document, low latency) and **batch**
  (asynchronous, many/large documents from Cloud Storage to Cloud Storage).
- **Document object** — the structured result: text, pages, blocks/tokens, form fields, and typed
  **entities** with bounding boxes and **confidence scores**.
- **Human-in-the-loop (HITL)** — route low-confidence extractions to human review.
- **Document AI Warehouse** — managed store + search/indexing for processed documents and metadata.

## Configuration and sizing
- Choose the processor type by document: general OCR vs Form Parser vs a specialized/custom parser.
  Use **online** for interactive single-doc flows, **batch** for high volume from Cloud Storage. Pin
  the processor **version** for reproducible output. Set confidence thresholds and HITL routing where
  accuracy matters. Region/location (e.g. `us`, `eu`) affects data residency and availability.

## Security and IAM
- Process with a dedicated **service account** scoped to the processor, the source/output Cloud
  Storage buckets, and the Warehouse — avoid broad roles. Documents often contain **PII/PHI**:
  encrypt buckets (CMEK), restrict read access, enable VPC-SC for exfiltration control, and audit via
  Cloud Audit Logs. Choose the `eu`/regional endpoint for data-residency requirements.

## Cost levers
- Cost is per page processed (varying by processor type — specialized/custom parsers cost more than
  plain OCR) plus Warehouse storage. Levers: use the cheapest processor that meets accuracy needs,
  batch instead of many online calls, avoid re-processing (cache the Document output), and set
  Warehouse retention.

## Scaling and limits
- Batch processing scales across many documents asynchronously; online has per-request page/size
  limits and per-project QPS quotas. Custom-processor training has dataset-size requirements. Raise
  quotas via the quotas page; large jobs should always use batch.

## Operating procedure
1. **Provision** — enable the Document AI API, create the runtime **service account** + source/output
   **Cloud Storage** buckets, and create the **processor** (Terraform
   `google_document_ai_processor` / `gcloud documentai processors create`) of the chosen type and
   location.
2. **Configure** — pin the processor version, set up **online** or **batch** processing, define
   confidence thresholds + HITL review, and (if needed) train a **custom** extractor in the Workbench
   or wire the **Document AI Warehouse**.
3. **Secure** — scope the service account least-privilege, CMEK-encrypt buckets, choose the regional
   endpoint for residency, enable VPC-SC, and restrict Warehouse access (PII/PHI).
4. **Verify** — apply [[verify-by-running]]: confirm the processor exists
   (`gcloud documentai processors list`), then process a representative sample document (online or a
   small batch) and confirm the returned **Document** has the expected text/entities with sensible
   **confidence scores** — capture the actual extracted fields.

## Inputs
Document type + sample(s), processor choice (OCR / Form Parser / specialized / custom), online-vs-batch
+ volume, source/output Cloud Storage locations, region/residency, accuracy/HITL needs, PII/PHI +
encryption requirements, and IAM scope.

## Output
A Document AI setup (a processor of the chosen type/version, online or batch processing config,
optional custom training + HITL + Warehouse) with a least-privilege service account and CMEK, plus
verification of a processed sample document yielding the expected structured entities with confidence
scores.

## Notes
- Gotchas: documents frequently contain PII/PHI (tight IAM, CMEK, VPC-SC, regional endpoint for
  residency); pin the processor version or output schema can shift; online has page/size limits — use
  batch for large/many docs; specialized/custom parsers cost more per page than plain OCR; custom
  extractors need enough labeled training data. For single-IMAGE labeling/OCR (not document
  structure), use Vision API; the AWS equivalent is Amazon Textract.
- IaC/CLI: Terraform `google_document_ai_processor`, `google_document_ai_processor_default_version`
  (plus `google_project_service`, `google_service_account`, `google_storage_bucket`). CLI
  `gcloud documentai processors create / list`; processing itself is done via the Document AI
  REST/SDK (`process` for online, `batchProcess` for batch).
