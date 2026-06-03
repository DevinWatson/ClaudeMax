---
name: aws-macie
description: Use when designing, provisioning, securing, or operating Amazon Macie — automated sensitive data discovery and classification in S3, the S3 bucket inventory and security posture (public access, encryption, sharing), sensitive data discovery jobs (one-time/scheduled), managed data identifiers and custom data identifiers (regex + keywords + proximity), allow lists, sensitive data findings vs policy findings, sample/automated sensitive data discovery, findings export to S3 / EventBridge / Security Hub, and the organization delegated-administrator model (Amazon Macie). Loads the Macie knowledge: enable Macie, run classification jobs, tune identifiers, and verify sensitive data is detected and findings route. Consumed by the Macie specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they add data classification.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, macie, data-classification, sensitive-data, s3, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Macie

AWS's managed **sensitive data discovery and classification** service for **Amazon S3**. It
inventories buckets, evaluates their security posture, and uses ML + pattern matching to find
where PII, financial, credential, and other sensitive data lives — producing findings you can
act on. Its scope is data *classification* in S3, not threat detection.

## Core concepts and components
- **S3 bucket inventory + posture** — Macie continuously catalogs your buckets and flags posture
  issues: **public access**, **unencrypted**, **shared/replicated externally** — surfaced as
  **policy findings**.
- **Sensitive data discovery jobs** — **one-time** or **scheduled** jobs that sample/scan object
  contents and emit **sensitive data findings** (what type, where, how many).
- **Automated sensitive data discovery** — account-wide, continuous, sampling-based discovery that
  builds a sensitivity score per bucket without you defining a job.
- **Managed data identifiers** — AWS-maintained detectors for many sensitive types (credit cards,
  SSNs, AWS keys, names, addresses, health, etc.).
- **Custom data identifiers** — your **regex** plus optional **keywords**, **proximity**, and
  **maximum match distance** for org-specific patterns (employee IDs, account numbers).
- **Allow lists** — text or regex of known-benign values to exclude from findings.
- **Organization model** — a **delegated administrator** enables Macie across the org and
  aggregates findings; findings export to S3 / EventBridge / Security Hub.

## Configuration and sizing
- Start with **automated sensitive data discovery** for a cheap, account-wide sensitivity map,
  then target **scheduled jobs** at high-risk buckets. Use managed identifiers first; add custom
  identifiers + allow lists to cut false positives. Scope jobs by bucket, prefix, tag, and object
  criteria to control how many bytes are inspected.

## Security and IAM
- Macie needs a **service-linked role** to inventory buckets and read objects; for objects
  encrypted with a **customer-managed KMS key**, the key policy must allow Macie to decrypt or it
  cannot classify them. Restrict who can disable Macie or delete findings. Export findings (which
  reference sensitive locations) to a locked-down account; Macie reports *locations/types*, not
  the raw sensitive values.

## Cost levers
- Billed by **S3 bucket evaluation for posture** (per bucket) and **bytes processed by sensitive
  data discovery** (jobs + automated). Biggest levers: scope jobs tightly (buckets/prefixes/tags,
  sampling depth), prefer automated discovery's sampling over full scans, and exclude buckets
  that never hold sensitive data. Avoid repeatedly full-scanning large static buckets.

## Scaling and limits
- Macie is **regional** (enable per region holding data). Automated discovery scales account/org-
  wide; jobs are bounded by object count/size and concurrency. Quotas on custom data identifiers,
  allow lists, and jobs (mostly soft/raisable). KMS-encrypted objects without grant are skipped.

## Operating procedure
1. **Provision** — enable Macie per region via Terraform `aws_macie2_account` (and set the
   delegated administrator / org config) or `aws macie2 enable-macie`.
2. **Configure** — turn on automated sensitive data discovery, define scheduled/one-time
   **classification jobs** scoped by bucket/prefix/tag, and add **custom data identifiers** +
   **allow lists** to tune precision.
3. **Secure** — grant the Macie role KMS decrypt on the relevant keys, restrict disable/delete
   IAM, and export findings to a centralized locked account + EventBridge/Security Hub.
4. **Verify** — apply [[verify-by-running]]: seed a test object with sample sensitive data, run a
   classification job, and confirm `aws macie2 list-findings`/`get-findings` reports the expected
   **sensitive data finding** (and a posture **policy finding** for a public/unencrypted bucket),
   then confirm the EventBridge/Security Hub export fires — capture the actual output.

## Inputs
The S3 buckets/accounts/regions holding data, sensitivity types of concern (managed + custom
patterns), known-benign values (allow lists), job scope and schedule, KMS keys in use, findings
destination, and cost/coverage tolerance.

## Output
The Macie configuration (account/org enablement, automated discovery, classification jobs, custom
data identifiers, allow lists, findings export) as code, plus verification that a seeded sensitive
object is detected, posture findings surface, and findings route downstream.

## Notes
- Gotchas: Macie is **S3-only** and **regional** — it does not classify RDS/DynamoDB/EBS and must
  be enabled in each region with data; objects encrypted with a **customer-managed KMS key Macie
  cannot use are silently skipped** (grant decrypt); jobs sample by default — a "clean" result may
  mean unsampled objects, not absence of sensitive data; **disabling Macie can delete jobs/
  findings**; custom-identifier regex without keyword/proximity tuning is noisy; automated
  discovery and explicit jobs are billed separately for bytes processed.
- IaC/CLI: Terraform `aws_macie2_account`, `aws_macie2_classification_job`,
  `aws_macie2_custom_data_identifier`, `aws_macie2_member`,
  `aws_macie2_organization_admin_account`, `aws_macie2_invitation_accepter`. CLI `aws macie2
  enable-macie`, `create-classification-job`, `create-custom-data-identifier`, `list-findings`,
  `get-findings`, `put-classification-export-configuration`. CloudFormation `AWS::Macie::Session`,
  `AWS::Macie::FindingsFilter`, `AWS::Macie::CustomDataIdentifier`,
  `AWS::Macie::AllowList`.
