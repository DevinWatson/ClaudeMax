---
name: aws-kendra
description: Use when designing, provisioning, securing, or operating Amazon Kendra — the managed intelligent enterprise-search service that returns ranked passages/answers from your content (Amazon Kendra). Loads the Kendra knowledge: the index (Developer vs Enterprise edition, capacity units), data sources and connectors (S3, SharePoint, Confluence, Salesforce, databases, web crawler, custom) with sync schedules, document attributes/facets and field mappings, relevance tuning (boosting attributes/freshness/authority), the Query/Retrieve APIs and FAQ/document/answer result types, custom synonyms and query suggestions, user-context filtering / token-based access control for document-level security, incremental learning and feedback, IAM/KMS/VPC security, cost (index capacity-hours + connector scans, edition-based) and quotas, and verification by running a query. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Kendra specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, kendra, ai-ml, enterprise-search, retrieval, semantic-search]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Kendra

A managed **intelligent enterprise-search** service that ingests content from many sources and returns
**ranked passages, document matches, and FAQ answers** to natural-language queries, with built-in
semantic ranking and document-level access control.

## Core concepts and components
- **Index** — the searchable store. **Developer edition** (low cost, dev/test) vs **Enterprise edition**
  (HA, production); capacity is provisioned in **storage** and **query capacity units**.
- **Data sources + connectors** — pull content from **S3**, **SharePoint**, **Confluence**,
  **Salesforce**, **databases (JDBC)**, the **web crawler**, and many SaaS connectors, plus a **custom**
  source (BatchPutDocument); each runs on a **sync schedule** (full/incremental).
- **Document attributes + facets** — index metadata (author, category, dates) mapped via **field
  mappings**; expose as **facets** and use for filtering.
- **Relevance tuning** — boost results by attribute, **freshness**, view-count, or source authority;
  add **custom synonyms** and **query suggestions**.
- **Query types** — **Query**/**Retrieve** APIs return **answer** (extractive), **document**, and
  **FAQ** result types with confidence buckets.
- **Access control** — **user-context filtering** / token-based ACLs enforce **document-level
  security** so users only see what they're entitled to.

## Configuration and sizing
- Pick the **edition** (Enterprise for prod), provision **capacity units** for storage and query
  throughput, configure **connectors + sync schedules**, map document attributes, set up **FAQs** and
  relevance tuning, and enable **user-context** access control. Scale by adding capacity units.

## Security and IAM
- Gate with IAM (`kendra:*` scoped to index/data-source) plus a connector **IAM role** with read access
  to each source and `kendra:BatchPutDocument` for custom ingestion. Enforce **document-level security**
  via ACLs/user context, encrypt the index with **KMS**, and run connectors privately via **VPC** for
  on-prem/private sources. Indexed content is often sensitive — preserve source ACLs end-to-end.

## Cost levers
- Bills primarily on **index capacity-hours** (by edition + provisioned units), plus **connector
  scans/sync** and storage. Levers: use **Developer edition** for non-prod, right-size capacity units,
  schedule **incremental** (not full) syncs, scope connectors to relevant content, and stop/delete idle
  indexes (they bill while running).

## Scaling and limits
- Documents/storage and queries scale with **capacity units**; per-account limits on indexes, data
  sources, and FAQs; connector-specific throttling. Editions cap certain features. Raise quotas via
  Service Quotas/support.

## Operating procedure
1. **Provision** — create the **index** (edition + capacity), the index/connector **IAM roles**, and
   **data sources**; via Terraform `aws_kendra_index` / `aws_kendra_data_source` /
   `aws_kendra_faq` / `aws_kendra_experience`, or `aws kendra create-*`.
2. **Configure** — wire connectors + sync schedules, map document attributes/facets, add FAQs, custom
   synonyms, relevance tuning, and **user-context** access control; run an initial sync.
3. **Secure** — least-privilege IAM, document-level ACLs/user context preserved from the source, KMS on
   the index, VPC for private sources.
4. **Verify** — apply [[verify-by-running]]: after a sync completes, run a representative query
   (`aws kendra query --index-id ... --query-text "..."`) and confirm ranked answer/document/FAQ results
   with sensible confidence, that facets/filters work, and that access control hides unentitled
   documents for a test user — capture the actual results.

## Inputs
Edition + capacity targets, content sources/connectors + sync cadence, document attributes/facets +
field mappings, FAQs/synonyms/relevance-tuning needs, access-control model (ACLs/user context),
security/compliance (KMS/VPC), query throughput.

## Output
A Kendra setup — a right-edition, right-capacity index fed by configured connectors on sync schedules,
with mapped attributes/facets, FAQs and relevance tuning, document-level access control, and
least-privilege IAM/KMS — plus verification that queries return ranked, access-correct results.

## Notes
- Gotchas: indexes bill while running even when idle — stop/delete non-prod; full re-syncs are slow and
  costly (prefer incremental); document-level ACLs must be ingested with the documents or security
  leaks; Developer edition lacks HA and some limits; relevance tuning takes iteration; connector
  throttling can slow large syncs. Kendra is **managed enterprise search/retrieval**, not an app-side
  RAG pipeline — its Retrieve API can serve as the retrieval layer that a RAG application calls.
- IaC/CLI: Terraform `aws_kendra_index`, `aws_kendra_data_source`, `aws_kendra_faq`,
  `aws_kendra_experience`, `aws_kendra_query_suggestions_block_list`; CloudFormation
  `AWS::Kendra::Index`, `AWS::Kendra::DataSource`, `AWS::Kendra::Faq`. CLI `aws kendra create-index`,
  `create-data-source`, `start-data-source-sync-job`, `create-faq`, `query`, `retrieve`,
  `batch-put-document`.
