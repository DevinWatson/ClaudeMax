---
name: aws-dax
description: Use when designing, provisioning, securing, or operating Amazon DynamoDB Accelerator (DAX) — the fully managed, in-memory write-through cache that sits in front of DynamoDB to deliver microsecond read latency. Loads the DAX knowledge: the cluster of nodes (primary + read replicas across AZs), node type sizing, the item cache and query cache with separate TTLs, write-through semantics and eventual-consistency caveats, the DAX SDK/client (drop-in for DynamoDB), subnet groups + security groups (VPC-only), parameter groups, cluster IAM role to reach DynamoDB, encryption at rest/in transit, and least-privilege IAM. Covers how to size nodes, place the cluster privately, set cache TTLs, and verify cache hits and failover. Consumed by the DAX specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect). DAX accelerates DynamoDB — pair it with the DynamoDB knowledge; it is not a standalone database.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, dax, dynamodb, in-memory-cache, write-through, low-latency]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon DynamoDB Accelerator (DAX)

Fully managed, highly available, **in-memory write-through cache for DynamoDB** that cuts read
latency from single-digit milliseconds to **microseconds** for read-heavy and bursty workloads —
without changing application logic (the DAX client is API-compatible with the DynamoDB SDK). DAX
is an accelerator for DynamoDB, not a standalone store; the table behind it is still authoritative.

## Core concepts and components
- **Cluster** — a set of nodes: one **primary** (handles writes) plus **read replica** nodes spread
  across AZs for HA and read throughput. Place at least 3 nodes across AZs for production.
- **Node type** — sizes the per-node memory/CPU (dax.t/r families); the cache lives in node memory,
  so the node type determines cache capacity and throughput.
- **Item cache** — caches `GetItem`/`BatchGetItem` results. **Query cache** — caches
  `Query`/`Scan` result sets. Each has its own **TTL** set via a parameter group.
- **Write-through** — writes go through DAX to DynamoDB and update the item cache, keeping it
  consistent on writes; reads served from cache are **eventually consistent** (strongly-consistent
  reads bypass the cache and hit DynamoDB directly).
- **Subnet group + security group** — DAX is **VPC-only**; a subnet group pins it to private
  subnets and the SG controls client access on the DAX port (8111/9111 TLS).
- **Cluster IAM role** — DAX assumes a role to call DynamoDB on the app's behalf.

## Configuration and sizing
- Pick a node type for working-set cache size and request rate; scale out replicas for read QPS and
  AZ resilience. Tune item-cache and query-cache TTLs to your staleness tolerance via a parameter
  group. Only front read-heavy tables with repeated key access — write-heavy or strongly-consistent
  workloads see little benefit.

## Security and IAM
- Deploy in **private** subnets; restrict the SG to app SGs on the DAX port. Enable **encryption at
  rest** (set at create, immutable) and **TLS in transit** (cluster endpoint). The cluster IAM role
  needs least-privilege DynamoDB access to the target tables; clients need `dax:*` data-plane
  permissions. Enable CloudTrail.

## Cost levers
- Priced per node-hour by node type × node count. Right-size the node type, use the fewest replicas
  that meet QPS/HA, and reserve nodes for steady state. DAX reduces DynamoDB read-capacity/RCU spend
  on repeated reads — factor that saving against node cost.

## Scaling and limits
- Scale reads by adding replica nodes (up to the cluster limit); scale cache capacity by changing
  the node type (rolling replacement). The single primary bounds write throughput. Cache misses fall
  through to DynamoDB, so DynamoDB capacity must still handle the miss + write load.

## Operating procedure
1. **Provision** — create a subnet group and the cluster (node type, node count across AZs, cluster
   IAM role) via Terraform `aws_dax_cluster` (+ `aws_dax_subnet_group`,
   `aws_dax_parameter_group`) or `aws dax create-cluster`.
2. **Configure** — attach a parameter group with item/query-cache TTLs, set replica count, point the
   app's DAX client at the cluster endpoint.
3. **Secure** — private subnets, tight SG, encryption at rest + TLS, least-privilege cluster role
   and client IAM, CloudTrail.
4. **Verify** — apply [[verify-by-running]]: `describe-clusters` shows the node count across AZs,
   `available`, and `SSEDescription`/TLS; a `GetItem` through the DAX client returns the item and a
   repeat read shows a cache hit (CloudWatch `ItemCacheHits` rising); a write is visible on a
   subsequent DAX read; failover by removing the primary still serves reads.

## Inputs
Target DynamoDB table(s), read pattern + repeat-key ratio, QPS, staleness tolerance (TTLs),
HA/AZ requirement, VPC/subnet placement, KMS encryption, client SDK language.

## Output
A DAX cluster definition (node type, multi-AZ node count, cluster IAM role), parameter group with
cache TTLs, private placement + encryption, client wiring, and verification of cache hits,
write-through visibility, and replica failover.

## Notes
- Gotchas: DAX only helps read-heavy repeated-key workloads — strongly-consistent reads and
  write-heavy traffic bypass/undermine the cache; cached reads are eventually consistent; encryption
  at rest is set at create and is immutable; VPC-only (no public endpoint); cache misses still
  consume DynamoDB capacity; transactions (`TransactWrite`) bypass the cache.
- IaC/CLI: Terraform `aws_dax_cluster`, `aws_dax_subnet_group`, `aws_dax_parameter_group`. CLI
  `aws dax create-cluster`, `describe-clusters`, `create-subnet-group`, `update-cluster`.
  CloudFormation `AWS::DAX::Cluster`, `AWS::DAX::SubnetGroup`, `AWS::DAX::ParameterGroup`.
