---
name: gcp-bigtable
description: Use when designing, provisioning, securing, or operating Cloud Bigtable — Google Cloud's fully managed, petabyte-scale wide-column NoSQL database for high-throughput, low-latency workloads (time series, IoT, AdTech, analytics), with instances, clusters and nodes, single-cluster vs replicated multi-cluster routing, app profiles, column families, and row-key design, plus IAM, CMEK, autoscaling, and cost/scaling levers. Loads the Bigtable knowledge: design row keys and column families, size clusters and nodes, configure replication and app profiles, secure with IAM, and verify throughput and latency. Consumed by the Bigtable specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle wide-column NoSQL workloads (Bigtable).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, bigtable, databases, nosql, wide-column, row-key, app-profile]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Bigtable

Google Cloud's fully managed, sparsely populated, petabyte-scale wide-column NoSQL database engineered
for sustained high write/read throughput at single-digit-millisecond latency. Data is a sorted map keyed
by a single row key; horizontal scale comes from adding nodes.

## Core concepts and components
- **Instance / clusters / nodes** — an **instance** is the logical container; it has one or more
  **clusters** (each in a single zone) made of **nodes** that provide compute. Storage (SSD or HDD) is
  separate and shared.
- **Tables / column families / cells** — tables hold rows addressed by a single **row key**; columns are
  grouped into **column families**; each cell can keep multiple **versions** with **garbage-collection
  (GC) rules** by age or count.
- **Row-key design** — the dominant performance factor. Keys are sorted lexicographically; design to
  spread writes and avoid **hotspotting** (no monotonic/timestamp prefixes); use field promotion,
  reversed timestamps, or salting.
- **Replication / app profiles** — multi-cluster instances replicate eventually across zones/regions;
  **app profiles** set routing policy (**single-cluster** for strong consistency vs **multi-cluster**
  for HA/failover) and optional priority.
- **Autoscaling** — per-cluster node autoscaling on CPU and storage utilization targets.

## Configuration and sizing
- Size **nodes per cluster** to throughput: each node sustains a bounded QPS and storage; start from the
  workload's target QPS and p99 latency. Choose **SSD** (low latency) vs **HDD** (cheap, throughput).
  Add clusters + an app profile for HA. Set GC rules per column family. Enable autoscaling with min/max
  nodes and CPU/storage targets.

## Security and IAM
- Grant least-privilege roles (`roles/bigtable.reader`, `roles/bigtable.user`, `roles/bigtable.admin`)
  scoped to instance/table where possible. Encrypt with **CMEK**; restrict network access with
  VPC-SC / Private Google Access; audit via Cloud Audit Logs.

## Cost levers
- The dominant levers are **node count per cluster** (compute), **number of clusters** (replication
  multiplies nodes), **storage type + volume** (SSD vs HDD), and network egress for cross-region
  replication. Right-size nodes via autoscaling, choose HDD for cold/throughput data, and avoid
  over-replication. Storage and nodes are billed independently.

## Scaling and limits
- Scales horizontally by adding nodes (throughput) and automatically across storage; no downtime to
  resize. Limits: per-node QPS/storage ceilings, max nodes per cluster (quota), row size and cell
  version limits, and per-row atomicity only (no cross-row transactions). Hotspots cap effective
  throughput regardless of node count.

## Operating procedure
1. **Provision** — enable the Bigtable Admin API, create the **instance** with cluster(s)
   (Terraform `google_bigtable_instance`) in the chosen zone(s), SSD/HDD, and node counts/autoscaling.
2. **Configure** — create **tables** and **column families** with GC rules
   (`google_bigtable_table`, `google_bigtable_gc_policy`), design row keys, and define **app profiles**
   (single- vs multi-cluster routing).
3. **Secure** — scope IAM least-privilege, apply CMEK, restrict with VPC-SC/Private Google Access, and
   enable audit logging.
4. **Verify** — apply [[verify-by-running]]: write and read rows with `cbt` (`cbt createtable`,
   `cbt set`, `cbt read`) against the target app profile, confirm replication by reading from a second
   cluster, and inspect node CPU/latency in monitoring; for hotspot risk run **Key Visualizer** or check
   the row-key distribution — capture the read/write output and observed latency.

## Inputs
Throughput targets (QPS read/write), latency p99, data volume + growth, access patterns and row-key
candidates, consistency/HA needs (single vs multi-cluster), region/zone topology, SSD-vs-HDD choice,
IAM/CMEK requirements, and cost ceiling.

## Output
A Bigtable setup (instance, cluster(s) with sized/autoscaled nodes, tables + column families with GC
rules, app profiles, replication) with a sound row-key design, least-privilege IAM and CMEK, plus
verification of read/write throughput, replication, and hotspot checks.

## Notes
- Gotchas: row-key design is everything — monotonic keys hotspot a single node and cap throughput;
  Bigtable has no secondary indexes, no joins, and only single-row atomic operations; multi-cluster
  replication is eventually consistent (use single-cluster routing for read-your-writes); minimum
  practical cluster is small but production needs headroom; switching SSD/HDD requires a new instance.
- IaC/CLI: Terraform `google_bigtable_instance`, `google_bigtable_table`, `google_bigtable_gc_policy`,
  `google_bigtable_app_profile`, plus `google_project_service`. CLI `cbt` and `gcloud bigtable`
  (instances/clusters), Key Visualizer for hotspot analysis, and client libraries for the data path.
