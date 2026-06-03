---
name: aws-neptune
description: Use when designing, provisioning, securing, or operating Amazon Neptune — the managed graph database. Loads the Neptune knowledge: property-graph (Apache TinkerPop Gremlin, openCypher) and RDF/SPARQL graph models and when to pick each, the cluster model (a shared distributed storage volume with one writer and up to 15 read replicas), cluster/reader endpoints and failover, Neptune Serverless capacity (NCUs), Neptune Analytics for in-memory graph algorithms, bulk loader from S3, full-text search via OpenSearch integration, automated backups/snapshots with PITR, encryption at rest with KMS and TLS in transit, IAM database authentication and VPC/subnet-group placement. Covers how to size a cluster, choose a graph model and query language, place it privately, encrypt it, load data, and verify queries and failover. Consumed by the Neptune specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they provision a graph database.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, neptune, graph-database, gremlin, sparql, opencypher, managed-database]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Neptune

Managed **graph** database for highly connected data, built on the same decoupled, distributed,
self-healing storage layer as Aurora. Neptune is the only AWS database purpose-built for graph
traversals — there is no separate engine team; this skill owns both the service and the graph-model
guidance. Choose Neptune for relationship-heavy queries (social, fraud, knowledge graphs,
recommendations); choose DynamoDB/RDS/DocumentDB for KV/relational/document data.

## Core concepts and components
- **Graph models** — **property graph** queried with **Gremlin** (Apache TinkerPop) or
  **openCypher**; and **RDF** queried with **SPARQL**. Pick property graph for path/traversal apps,
  RDF/SPARQL for semantic/linked-data and ontologies. A cluster serves one model family at a time.
- **Cluster** — one **writer** plus up to 15 **read replicas** sharing one distributed storage
  volume; **cluster** and **reader** endpoints; failover promotes a replica in seconds.
- **Neptune Serverless** — autoscales capacity in **NCUs** for variable load. **Neptune Analytics** —
  separate engine for fast in-memory graph algorithms (centrality, similarity, vector search).
- **Bulk loader** — high-throughput load of CSV/RDF from **S3** via an IAM role. **Full-text search**
  via an OpenSearch integration.

## Configuration and sizing
- Pick db.r/db.t instance classes sized for the working graph in memory (traversals are
  memory-bound); add replicas for read scale-out and HA across AZs. Use Serverless (min/max NCU) for
  spiky/unknown load. Storage auto-grows. Use the bulk loader for initial/large loads instead of
  per-edge writes.

## Security and IAM
- Neptune runs **only inside a VPC** — place it in private subnets and restrict the security group to
  app SGs. Encrypt at rest with a customer-managed KMS key (immutable after create) and require TLS
  (HTTPS) for all connections. Enable **IAM database authentication** (SigV4-signed requests) for
  fine-grained, credential-free access; the bulk loader needs an IAM role with S3 read. Enable audit
  logs + CloudTrail.

## Cost levers
- Right-size instances and use Reserved Instances for steady provisioned compute; Serverless
  (capped max NCU) for variable load. Each replica is billable compute though storage is shared.
  Storage and I/O bill per use. Use the bulk loader (cheaper/faster than streaming writes) for big
  imports; scale in idle replicas.

## Scaling and limits
- Read scale = up to 15 replicas; writes are single-writer (no write sharding — partition at the app
  level if needed). Serverless scales compute online; storage scales automatically. A cluster is
  pinned to property-graph OR RDF data; mixing requires separate clusters or Neptune Analytics.

## Operating procedure
1. **Provision** — create a DB subnet group, cluster parameter group, the `aws_neptune_cluster`, and
   `aws_neptune_cluster_instance`s (writer + replicas, or Serverless NCU range) via Terraform or
   `aws neptune create-db-cluster` + `create-db-instance`.
2. **Configure** — endpoints, backup retention + window, IAM-auth parameter, an IAM role + bulk
   loader for initial data, OpenSearch full-text integration if needed.
3. **Secure** — private VPC placement, tight security group, KMS encryption, TLS/HTTPS required, IAM
   database authentication, least-privilege IAM (including the loader role).
4. **Verify** — apply [[verify-by-running]]: `aws neptune describe-db-clusters` shows
   `StorageEncrypted=true` and `available` with expected members; over HTTPS run a Gremlin
   `g.V().limit(1)` (or `MATCH`/`SELECT` for openCypher/SPARQL) against the cluster endpoint and a
   read query against the reader endpoint; confirm an unauthenticated/non-VPC request is refused;
   run a loader job and check status; trigger failover and confirm the writer endpoint recovers.

## Inputs
Graph model (property graph vs RDF) + query language (Gremlin/openCypher/SPARQL), graph size +
traversal patterns, read scale/HA (replica count), load profile (provisioned vs Serverless), data
source for bulk load (S3), backup retention/RPO, VPC placement, encryption/KMS key, auth model.

## Output
A cluster definition (encrypted, private, writer + replicas or Serverless NCU), graph-model + query-
language choice, endpoints, bulk-loader/IAM-role plan, backup config, and verification of encryption,
private placement, a working query (writer + reader), IAM auth, a loader run, and a successful failover.

## Notes
- Gotchas: a cluster serves property-graph OR RDF, not both; encryption is immutable after create
  (restore a snapshot to change key); single-writer (no write sharding); Neptune is VPC-only (no
  public endpoint); openCypher and Gremlin both run on property-graph data but features differ;
  Neptune Analytics is a separate service/engine; bulk loader requires the data already in S3 + an
  IAM role.
- IaC/CLI: Terraform `aws_neptune_cluster`, `aws_neptune_cluster_instance`,
  `aws_neptune_cluster_parameter_group`, `aws_neptune_subnet_group`. CLI `aws neptune
  create-db-cluster`, `create-db-instance`, `failover-db-cluster`; loader via the cluster's
  `/loader` HTTPS endpoint. CloudFormation `AWS::Neptune::DBCluster`, `AWS::Neptune::DBInstance`.
