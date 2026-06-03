---
name: gcp-firestore
description: Use when designing, provisioning, securing, or operating Firestore — Google Cloud's serverless, fully managed document NoSQL database with Native mode vs Datastore mode, collections and documents, automatic single-field and composite indexes, real-time listeners and offline sync, multi-region/regional locations, security rules (mobile/web) vs IAM (server), and backups/PITR, plus cost and scaling levers. Loads the Firestore knowledge: model collections/documents, design indexes and queries, choose Native vs Datastore mode and location, secure with security rules or IAM, and verify reads/writes and index coverage. Consumed by the Firestore specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle serverless document NoSQL workloads (Firestore).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, firestore, databases, nosql, document-database, security-rules, serverless]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Firestore

Google Cloud's serverless, fully managed, horizontally scalable document NoSQL database with strong
consistency, automatic indexing, real-time listeners, and offline support. Capacity scales automatically
with no servers to manage.

## Core concepts and components
- **Native mode vs Datastore mode** — **Native mode** adds real-time listeners, offline sync, and rich
  client SDKs (mobile/web); **Datastore mode** is the server-centric successor to Cloud Datastore with
  strong consistency and high write throughput, no realtime/offline. Mode is chosen **once per database**
  and is permanent.
- **Collections / documents / subcollections** — data is a tree of **collections** containing
  **documents** (key/value fields), which can hold **subcollections**. Documents are limited in size
  (~1 MiB).
- **Indexes** — **single-field** indexes are automatic; **composite** indexes (and field overrides /
  exemptions) must be declared for multi-field/ordered queries. Every query is index-backed.
- **Real-time + offline** — Native-mode SDKs stream live updates via **listeners** and cache for
  **offline** use.
- **Location** — a **multi-region** (high availability/durability) or **regional** location chosen once
  and permanent; multiple named databases per project are supported.
- **Backups / PITR** — scheduled backups and **point-in-time recovery**; managed import/export to Cloud
  Storage.

## Configuration and sizing
- Choose **mode** (Native for client apps + realtime; Datastore for server/throughput) and **location**
  (multi-region vs regional) — both permanent. Model documents to keep them small and avoid hot single
  documents; declare **composite indexes** for your query shapes; set **PITR** and backup schedules.

## Security and IAM
- Server access uses **IAM** (`roles/datastore.user`, `roles/datastore.viewer`, `roles/datastore.owner`).
  Client (mobile/web) access is governed by **Firestore Security Rules** (request/resource-based
  allow/deny with auth context) — never expose a database to clients without rules. Encrypt with default
  or **CMEK**; restrict with VPC-SC; audit via Cloud Audit Logs.

## Cost levers
- Firestore bills primarily on **document reads, writes, and deletes**, **stored data**, and **network
  egress** (no provisioned capacity in serverless mode). Reduce read/write counts (avoid chatty
  listeners and over-fetching), denormalize to cut reads where appropriate, prune unused **indexes**
  (each write updates every covering index), and set TTL policies to delete stale data.

## Scaling and limits
- Scales automatically with sustained traffic; ramp gradually to avoid hot-spotting on sequential
  keys/indexes (the **500/50/5** ramp-up guidance). Limits: ~1 MiB document size, ~1 write/sec sustained
  per single document, max index entries per document, and query constraints (no native joins;
  limited inequality filters). Monotonic IDs/index values create hotspots.

## Operating procedure
1. **Provision** — enable the Firestore API and create the **database**
   (Terraform `google_firestore_database`) choosing **mode** and **location** (permanent); optionally
   create additional named databases.
2. **Configure** — declare **composite indexes** and field overrides
   (`google_firestore_index`, `google_firestore_field`), define the data model/collections, set TTL
   policies, and configure backup schedules/PITR.
3. **Secure** — set **IAM** for server access and deploy **Security Rules** for client access, apply
   CMEK, restrict with VPC-SC, and enable audit logging.
4. **Verify** — apply [[verify-by-running]]: write and read a document with `gcloud firestore` /
   the Firebase CLI or a client, run a representative multi-field query and confirm it is **index-backed**
   (no missing-index error), test **Security Rules** with the rules emulator/test suite, and confirm a
   backup/PITR window exists (`gcloud firestore backups list`) — capture the read/write, query, and rules
   test output.

## Inputs
Access pattern (client realtime vs server throughput → mode), query shapes (→ composite indexes), data
model + document sizes, location/HA requirements (permanent), expected read/write volume, security model
(Rules vs IAM), CMEK/VPC-SC needs, retention/PITR, and cost ceiling.

## Output
A Firestore setup (database in the chosen mode + location, composite indexes, data model, TTL/backup/PITR)
secured with IAM and/or Security Rules and CMEK, plus verification of reads/writes, index-backed queries,
and rules behavior.

## Notes
- Gotchas: **mode and location are permanent** (recreate to change — plan up front); every query needs an
  index (missing composite indexes fail at query time); ~1 write/sec per document and monotonic
  keys/index values cause hotspots; Security Rules govern only client SDKs, not server/IAM access (leaving
  rules open exposes data); Datastore mode lacks realtime/offline; large documents and chatty listeners
  drive cost.
- IaC/CLI: Terraform `google_firestore_database`, `google_firestore_index`, `google_firestore_field`,
  `google_firestore_document`, plus `google_project_service`. CLI `gcloud firestore`
  (databases/indexes/backups/import/export), the Firebase CLI for Security Rules, and the local emulator
  for rules/query testing.
