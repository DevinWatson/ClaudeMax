---
name: aws-qldb
description: Use when designing, provisioning, securing, or operating Amazon QLDB — the fully managed ledger database with a cryptographically verifiable, immutable, append-only journal. Loads the QLDB knowledge: the journal as source of truth, materialized tables and indexes, document revisions and history(), the PartiQL query language, cryptographic verification (digests, proofs, block/document hashes), on-demand export and Kinesis streaming, KMS encryption, and least-privilege IAM. IMPORTANT: AWS has announced end-of-support for Amazon QLDB — treat it as deprecated, do NOT recommend it for new builds, and surface migration to Amazon Aurora PostgreSQL (with verifiable/audit patterns) for net-new work. Consumed by the QLDB specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when maintaining or migrating existing ledgers.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, qldb, ledger, immutable, partiql, deprecated, audit]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon QLDB

Fully managed **ledger** database with a cryptographically verifiable, immutable, append-only
**journal** as the single source of truth — for systems of record needing a tamper-evident audit
trail (financial, supply-chain, registry).

> DEPRECATION: AWS has announced **end-of-support for Amazon QLDB**. Do NOT recommend it for new
> builds. For net-new verifiable/audit workloads, recommend **Amazon Aurora PostgreSQL** with an
> audit/history pattern (or DynamoDB + verifiable hashing). This skill exists to maintain, verify,
> export, and **migrate off** existing QLDB ledgers.

## Core concepts and components
- **Ledger** — the top-level resource; contains one journal and the materialized tables.
- **Journal** — the immutable, append-only sequence of committed transactions; the authoritative
  source of truth. Tables and indexes are materialized **views** derived from it.
- **Documents and revisions** — each document has a `metadata.id` and a versioned revision history;
  `history(table)` returns every revision (who/when/what), enabling full audit.
- **PartiQL** — SQL-compatible query language over the document model.
- **Cryptographic verification** — block hashes chain into a **digest**; you request a **proof** to
  verify a specific document revision against a trusted digest (Merkle-tree style).
- **Export / streaming** — on-demand journal export to S3 and continuous streaming to Kinesis
  Data Streams (the standard path for migrating data out).

## Configuration and sizing
- Serverless: no instances to size; capacity auto-scales with request rate. Create indexes on the
  fields you query (indexes can only be created at table creation or via `CREATE INDEX` — no
  retroactive backfill cost model like RDS). Set the **permissions mode** to `STANDARD` (fine-grained
  IAM) rather than `ALLOW_ALL`.

## Security and IAM
- Encrypt at rest with a customer-managed **KMS** key. Use `STANDARD` permissions mode and gate
  `qldb:SendCommand` / PartiQL table-level actions with least-privilege IAM. Enable deletion
  protection. Connect via the QLDB session driver; CloudTrail records control-plane calls.

## Cost levers
- Priced on I/O requests, storage (journal + indexed/history storage), and data transfer. The
  immutable journal only grows — history is never deleted, so storage rises monotonically; export
  and drop unused ledgers. Verification (proofs) and exports add I/O cost.

## Scaling and limits
- Auto-scales request throughput; no read replicas. The journal is single-writer-ordered. Watch
  document size limits, transaction time limits, and the fact that history grows unbounded.

## Operating procedure
1. **Provision** (existing/maintenance only) — create the ledger with `STANDARD` permissions and
   deletion protection via Terraform `aws_qldb_ledger` or `aws qldb create-ledger`.
2. **Configure** — create tables and indexes, define the document model, and set up journal export
   to S3 or a Kinesis stream for downstream/migration consumers.
3. **Secure** — customer-managed KMS key, `STANDARD` permissions mode, least-privilege IAM,
   deletion protection, CloudTrail.
4. **Verify** — apply [[verify-by-running]]: `describe-ledger` shows `STANDARD`, `ACTIVE`, KMS key,
   and deletion protection; insert a document and confirm `history()` returns its revision; request a
   digest + proof and verify a revision; confirm an unauthorized principal is denied; for migrations,
   confirm an export/stream lands the journal in S3/Kinesis.

## Inputs
Existing ledger inventory, query/index needs, audit/verification requirements, KMS key, export or
migration target (S3/Kinesis → Aurora), retention/compliance horizon.

## Output
A maintained ledger definition (STANDARD mode, KMS, deletion protection), tables/indexes, a
journal export/stream for migration, and verification of immutability, a cryptographic proof, and
denied unauthorized access — plus a migration recommendation given the deprecation.

## Notes
- Gotchas: QLDB is **deprecated/end-of-support** — flag this on every engagement and steer new work
  to Aurora PostgreSQL; the journal/history is immutable and grows forever (cost); no read replicas
  or point-in-time restore like RDS — back up via export; `ALLOW_ALL` permissions mode is insecure;
  documents and transactions have size/time limits.
- IaC/CLI: Terraform `aws_qldb_ledger`, `aws_qldb_stream`. CLI `aws qldb create-ledger`,
  `describe-ledger`, `export-journal-to-s3`, `stream-journal-to-kinesis`; PartiQL via the QLDB
  shell/driver. CloudFormation `AWS::QLDB::Ledger`, `AWS::QLDB::Stream`.
