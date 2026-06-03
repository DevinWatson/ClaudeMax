---
name: aws-data-exchange
description: Use when designing, provisioning, securing, or operating AWS Data Exchange — the service for finding, subscribing to, and using third-party data, and for publishing your own data products in the AWS Marketplace (AWS Data Exchange). Loads the Data Exchange knowledge: as a subscriber — browsing the catalog, creating subscriptions to data products, and consuming entitled data sets via revisions and assets exported to S3, or via Data Exchange for APIs / Amazon Redshift / Amazon S3 access; as a provider — creating data products, data sets, revisions, and assets, defining offers and pricing, and publishing/updating with auto-export jobs and revision events. Covers entitlement, jobs (import/export), security/IAM, cost and pricing models, quotas, and verification that subscribed or published data is accessible. Consumed by the Data Exchange specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, data-exchange, analytics, data-marketplace, subscriptions]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Data Exchange

A managed service for **finding, subscribing to, and using third-party data** — and for **publishing
your own data products** — through the AWS Marketplace. It standardizes how data moves between a
**provider** and a **subscriber** as versioned, entitled artifacts, with billing handled through the
Marketplace.

## Core concepts and components
- **Data product** — the published, purchasable unit listed in the catalog; it bundles one or more
  **data sets** with **offers** (pricing, duration, terms).
- **Data set** — a container that holds **revisions**; the unit of entitlement a subscription grants.
- **Revision** — an immutable, versioned snapshot of a data set's contents at a point in time.
- **Asset** — the actual piece of data inside a revision (an S3 object, a Redshift data share, an API
  schema, etc.).
- **Subscription / entitlement** — a subscriber's right to a data set's revisions for a term; drives
  what assets they can export/consume.
- **Jobs** — async operations that **import** assets into a revision (provider) or **export** entitled
  assets to S3 (subscriber); revisions can **auto-export** to subscribers on publish.
- **Delivery types** — files exported to **S3**, **Data Exchange for APIs** (signed API access),
  **Data Exchange for Amazon Redshift** (data shares), and **Data Exchange for Amazon S3** (direct
  access to a provider's S3 data).

## Configuration and sizing
- As a **subscriber**: pick the delivery type, target an export S3 bucket/prefix, and automate
  export-on-publish jobs so new revisions flow in. As a **provider**: structure data sets by logical
  feed, keep revisions immutable, use **revision events**/auto-export to push updates, and define
  offers (one-time, recurring, private). There is no compute to size — throughput is governed by job
  concurrency and asset size.

## Security and IAM
- Gate provider/subscriber actions with IAM (`dataexchange:*` scoped to data sets/revisions), and grant
  the export target bucket `s3:PutObject` (subscriber) or import source `s3:GetObject` (provider). Use
  **AWS Marketplace** subscription controls and (optionally) **AWS License Manager**/SCPs to govern who
  may subscribe. Encrypt exported assets (SSE-KMS) and lock down the export bucket. Providers must not
  publish sensitive/PII data without the right product terms.

## Cost levers
- Subscribers pay the **provider's product price** (one-time or recurring) plus standard S3/Redshift
  costs for storing/using exported data; providers earn revenue minus Marketplace fees. Levers: avoid
  duplicate subscriptions, export only needed revisions, lifecycle-expire exported S3 data, and prefer
  in-place access (Data Exchange for S3/Redshift) over re-exporting large data sets repeatedly.

## Scaling and limits
- Per-account quotas apply to data sets, revisions per data set, assets per revision, and concurrent
  jobs (raisable via support). Very large assets and high revision frequency stress export jobs —
  batch and schedule accordingly. Auto-export propagation to many subscribers is async.

## Operating procedure
1. **Provision** — (subscriber) create/accept a subscription to a data product; (provider) create a
   data set and product via Terraform `aws_dataexchange_data_set` / `aws_dataexchange_revision`, or
   `aws dataexchange create-data-set`.
2. **Configure** — (provider) import assets into a revision and publish; set offers and revision
   events. (Subscriber) configure auto-export jobs to an S3 bucket/prefix or set up API/Redshift/S3
   access.
3. **Secure** — scope `dataexchange` IAM, lock down export/import buckets with SSE-KMS, govern who may
   subscribe, and validate product terms before publishing.
4. **Verify** — apply [[verify-by-running]]: as a subscriber, run an export job
   (`aws dataexchange create-job` type EXPORT_ASSETS_TO_S3 + `start-job`) and confirm the asset lands
   in the target bucket (`aws s3 ls`); as a provider, list the revision and assets
   (`aws dataexchange list-data-set-revisions` / `get-revision`) and confirm entitlement reaches a test
   subscriber — capture the actual output.

## Inputs
Role (provider vs subscriber), the data product/data set(s) involved, delivery type (S3/API/Redshift/
S3-access), export/import bucket + KMS, offer/pricing terms (provider), subscription governance, update
cadence (revision events/auto-export).

## Output
A working Data Exchange flow — a subscription with automated export to a secured S3 bucket, or a
published data product with data sets/revisions/assets and offers — plus verification that entitled
data is accessible end-to-end.

## Notes
- Gotchas: revisions are immutable (fix data by publishing a new revision, not editing); auto-export
  only fires for subscribers configured for it and is async; export jobs must target a bucket the
  Data Exchange role can write; product/offer terms and Marketplace approval gate provider publishing;
  Data Exchange for S3/Redshift gives in-place access (no re-export) but requires resource sharing
  setup; subscriptions can auto-renew — manage the term explicitly.
- IaC/CLI: Terraform `aws_dataexchange_data_set`, `aws_dataexchange_revision`. CLI
  `aws dataexchange create-data-set`, `create-revision`, `create-job` (+ `start-job` / `get-job`),
  `list-data-sets`, `list-data-set-revisions`, `get-revision`. CloudFormation
  `AWS::DataExchange::DataSet`, `AWS::DataExchange::Revision`. Provider publishing/offers are managed
  through the AWS Marketplace Catalog API.
