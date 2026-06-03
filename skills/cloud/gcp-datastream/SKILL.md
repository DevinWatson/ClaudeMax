---
name: gcp-datastream
description: Use when designing, provisioning, securing, or operating Datastream — Google Cloud's serverless change data capture (CDC) and replication service that streams inserts/updates/deletes from operational databases (MySQL, PostgreSQL, Oracle, SQL Server) into BigQuery or Cloud Storage in near-real-time (connection profiles for source and destination, streams, backfill, stream objects, the CDC log/change events), plus connectivity (IP allowlist, forward-SSH tunnel, Private Connectivity/VPC peering), IAM, encryption, and cost. Loads the Datastream knowledge: configure source and destination connection profiles, create a stream with backfill, choose connectivity, and verify replicated rows land downstream. Consumed by the Datastream specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle CDC/replication (Datastream).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, datastream, data-analytics, cdc, replication, change-data-capture]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Datastream

Google Cloud's serverless **change data capture (CDC)** and replication service. It continuously reads
the source database's transaction log and streams row-level **inserts, updates, and deletes** into a
destination (BigQuery or Cloud Storage) in near-real-time, with an initial historical **backfill**.

## Core concepts and components
- **Connection profiles** — reusable definitions of a **source** (MySQL, PostgreSQL/AlloyDB, Oracle,
  SQL Server) and a **destination** (BigQuery dataset or a Cloud Storage bucket) including credentials
  and connectivity.
- **Stream** — links one source profile to one destination profile, selects which schemas/tables
  (**stream objects**) to replicate, and runs continuously.
- **CDC vs backfill** — **backfill** seeds the destination with existing data; ongoing **CDC** reads
  the binlog/WAL/redo logs and applies changes. Each change carries metadata (operation type, source
  timestamp, log position).
- **Destinations** — **BigQuery** (managed, with a configurable staleness/freshness; tables
  upserted/merged) or **Cloud Storage** (Avro/JSON change-event files for downstream ELT, e.g. into
  BigQuery via Dataflow).
- **Connectivity** — **IP allowlisting**, **forward-SSH tunnel**, or **Private Connectivity** (a
  Datastream-managed VPC peering / Private Service Connect) for private/no-public-IP sources.

## Configuration and sizing
- Serverless — no instances to size. Configure the source log retention (must outlast stream gaps),
  the included objects, the destination dataset/bucket, BigQuery **data freshness/staleness**, and
  connectivity method. Right-size backfill scope to avoid loading unneeded history.

## Security and IAM
- Use a least-privilege **source DB user** with replication/log-read grants only. Store source
  credentials securely; grant the Datastream service account scoped destination roles
  (`roles/bigquery.dataEditor` or `roles/storage.objectAdmin` on the target). Prefer **Private
  Connectivity** over IP allowlisting; enable **CMEK** for the stream; restrict operators with
  `roles/datastream.admin`/`viewer`; audit via Cloud Audit Logs.

## Cost levers
- Billed per **GB processed** (backfill + ongoing changes). Levers: limit the **stream objects** to
  the tables you actually need, scope/avoid repeated **backfills**, and tune BigQuery destination
  freshness (more frequent merges cost more BigQuery compute). The destination's own storage/compute
  (BigQuery, GCS) is billed separately.

## Scaling and limits
- Serverless scaling to the source change rate; throughput is ultimately bounded by the source DB and
  its log generation. Limits: max streams/objects per project, supported source versions/engines, and
  source log retention windows (if logs rotate before a stalled stream resumes, you must re-backfill).
  Raise quotas as needed.

## Operating procedure
1. **Provision** — enable the Datastream API, prepare the **source** (enable binlog/WAL/supplemental
   logging, create the replication user with least-privilege grants), and create **source** and
   **destination** connection profiles (Terraform `google_datastream_connection_profile`); set up
   **Private Connectivity** (`google_datastream_private_connection`) if used.
2. **Configure** — create the **stream** (`google_datastream_stream`) selecting schemas/tables,
   backfill mode (all/none), and destination settings (BigQuery dataset + freshness, or GCS path +
   file format); start the stream.
3. **Secure** — scope the source user and destination IAM least-privilege, use Private Connectivity,
   apply CMEK, and restrict stream admin roles.
4. **Verify** — apply [[verify-by-running]]: confirm the stream reaches `RUNNING`
   (`gcloud datastream streams describe`), backfill completes, then make a test change in the source
   and confirm it appears downstream (query the BigQuery table or read the GCS change file) within the
   freshness window — capture the stream state and the replicated row.

## Inputs
Source engine + version + connectivity, tables/schemas to replicate, destination (BigQuery dataset or
GCS bucket + format), backfill scope, freshness/latency target, network reachability (private vs
allowlist), IAM/credential scope, CMEK requirement, and cost constraints.

## Output
A Datastream setup (source + destination connection profiles, optional private connection, a stream
with selected objects + backfill mode, destination freshness) with least-privilege source and IAM, plus
verification that the stream runs and a source change replicates downstream.

## Notes
- Gotchas: the source MUST have logical/binary logging (binlog row format, WAL `logical`, Oracle
  supplemental logging, SQL Server CDC) enabled before streaming; insufficient **log retention** during
  an outage forces a re-backfill; the replication user needs specific minimal grants; BigQuery
  destination is upsert/merge (needs primary keys) — without keys it appends; freshness is a
  cost/latency tradeoff; Private Connectivity needs a reserved IP range. Datastream owns the MANAGED
  CDC pipeline (the GCP analog of **AWS DMS**); cloud-agnostic replication/pipeline DESIGN is
  data/etl-architect's.
- IaC/CLI: Terraform `google_datastream_connection_profile`, `google_datastream_stream`,
  `google_datastream_private_connection`, plus `google_project_service`. CLI
  `gcloud datastream connection-profiles`, `gcloud datastream streams`,
  `gcloud datastream private-connections`; the Datastream REST API for fine control.
