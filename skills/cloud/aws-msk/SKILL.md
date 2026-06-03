---
name: aws-msk
description: Use when designing, provisioning, securing, or operating Amazon MSK (Managed Streaming for Apache Kafka) — the managed service that runs and scales the Kafka broker infrastructure (Amazon MSK). Loads the MSK knowledge: provisioned clusters (broker count/instance type, EBS storage with provisioned throughput + auto-scaling, AZ distribution, Kafka version, custom configurations, ZooKeeper vs KRaft), MSK Serverless, MSK Connect (managed Kafka Connect), MSK Replicator, the security model (IAM / SASL-SCRAM / mTLS, KMS at rest + TLS in transit, VPC + security groups, multi-VPC connectivity), monitoring, and scaling/cost levers. Covers cluster sizing, broker/storage scaling, the managed-Kafka security model, and verification. This is the AWS managed-infrastructure layer for Kafka — topic/partition/Streams design belongs to the Kafka data team. Consumed by the MSK specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, msk, analytics, kafka, streaming, managed-kafka]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon MSK (Managed Streaming for Apache Kafka)

A **managed Apache Kafka** service: AWS provisions, configures, patches, and scales the **Kafka broker
infrastructure** while you run standard Kafka clients. MSK owns the **managed-infrastructure layer**
(brokers, storage, networking, security); **topic/partition and stream-processing design is Kafka work**
(the Kafka data team).

## Core concepts and components
- **Provisioned cluster** — choose **broker count** (multiple of AZ count), **instance type**
  (kafka.m7g/.m5 sizes), **per-broker EBS storage** with optional **provisioned throughput** and
  **storage auto-scaling**, **Kafka version**, and **broker AZ distribution**. **Custom
  configurations** override broker properties (e.g. `auto.create.topics.enable`,
  `default.replication.factor`). Newer clusters use **KRaft** (no ZooKeeper).
- **MSK Serverless** — no broker sizing or storage management; pay per **throughput + storage**;
  auto-scales partitions/throughput within per-cluster limits. Best for variable/unknown load.
- **MSK Connect** — managed **Kafka Connect** (workers, **connectors**, **plugins**, autoscaling) for
  source/sink integration without running your own Connect cluster.
- **MSK Replicator** — managed cross-cluster / cross-region replication for DR and aggregation.
- **Bootstrap brokers & ZooKeeper/KRaft** endpoints expose the cluster to clients within the VPC.

## Configuration and sizing
- Size **provisioned** by ingress/egress throughput, partition count, replication factor, and retention:
  pick instance type for throughput, **broker count** as a multiple of AZs (3 AZs for HA), and **EBS**
  for retention × replication, enabling **storage auto-scaling** and **provisioned throughput** for
  hot clusters. Set a **custom configuration** for replication/retention defaults. Choose **Serverless**
  when load is spiky or sizing is uncertain. Topic/partition counts and replication factor are
  **Kafka-level** decisions (Kafka team) that drive MSK sizing.

## Security and IAM
- Cluster lives in a **VPC**; clients connect from peered/attached VPCs (**multi-VPC private
  connectivity**). Auth options: **IAM access control** (recommended on AWS), **SASL/SCRAM** (Secrets
  Manager), or **mutual TLS**. Enable **encryption in transit** (TLS, in-cluster + client) and **at
  rest** (KMS). Security groups gate broker ports; restrict who can change cluster config or delete it.
- MSK **IAM** controls cluster/topic/group actions at the AWS layer; fine-grained Kafka ACLs (for
  SASL/mTLS) are a Kafka-level concern coordinated with the Kafka security team.

## Cost levers
- **Provisioned**: broker **instance type × count × hours** + **EBS GB** (+ provisioned throughput) —
  right-size brokers and storage, use storage auto-scaling rather than over-provisioning, tune retention.
  **Serverless** billed per throughput + storage — cheaper for intermittent load, pricier at steady high
  volume. MSK Connect billed per worker capacity; Replicator per replicated throughput.

## Scaling and limits
- Scale provisioned by **adding brokers** (then reassign partitions), changing **instance type**
  (rolling), or growing **EBS** (storage auto-scaling). Cannot reduce broker count easily. Serverless
  has per-cluster partition/throughput ceilings. Broker count must align with AZs; partition placement
  and rebalancing are Kafka operations. Rolling updates take time and need replication headroom.

## Operating procedure
1. **Provision** — create the cluster via Terraform `aws_msk_cluster` /
   `aws_msk_serverless_cluster`, or `aws kafka create-cluster` / `create-cluster-v2`; set broker count/
   type/storage (or serverless), Kafka version, and VPC/subnets.
2. **Configure** — apply a **custom configuration** (replication/retention/auto-create), enable
   **storage auto-scaling** + provisioned throughput, set up **MSK Connect** connectors and/or
   **Replicator** as needed.
3. **Secure** — VPC + security groups, **IAM** (or SASL-SCRAM/mTLS) auth, TLS in transit, KMS at rest,
   restrict admin/delete actions, multi-VPC connectivity if cross-account.
4. **Verify** — apply [[verify-by-running]]: fetch bootstrap brokers (`aws kafka get-bootstrap-brokers`)
   and, with the configured auth, produce and consume a test record on a topic (kafka CLI / a client) to
   confirm connectivity and auth; confirm **storage auto-scaling** or adding a broker takes effect via
   `describe-cluster` — capture the actual broker/consumer output and cluster state.

## Inputs
Throughput (ingress/egress), partition count + replication factor + retention (from the Kafka team),
provisioned vs serverless, AZ/HA needs, auth mechanism (IAM/SASL/mTLS), VPC/cross-account connectivity,
Connect/Replicator needs.

## Output
An MSK setup (provisioned cluster with broker count/type/storage + auto-scaling + custom configuration,
or serverless cluster; optional MSK Connect / Replicator; VPC + IAM/SASL/mTLS auth + TLS + KMS) plus
verification of produce/consume connectivity and scaling.

## Notes
- Gotchas: broker count must be a **multiple of AZ count** — get this right at create time (hard to
  change down); reducing brokers / shrinking storage is constrained — over-shrinking is not supported;
  adding brokers requires **partition reassignment** (a Kafka operation) to actually use them;
  `auto.create.topics.enable` and replication-factor defaults come from the **custom configuration**;
  IAM auth needs the client to use the MSK IAM SASL handshake; serverless has feature/limit differences
  vs provisioned; KRaft vs ZooKeeper depends on version. **Topic/partition/Streams design and Kafka ACLs
  are the Kafka data team's job — MSK provisions and scales the brokers under them.**
- IaC/CLI: Terraform `aws_msk_cluster`, `aws_msk_serverless_cluster`, `aws_msk_configuration`,
  `aws_msk_scram_secret_association`, `aws_mskconnect_connector`, `aws_mskconnect_custom_plugin`,
  `aws_mskconnect_worker_configuration`, `aws_msk_replicator`. CLI `aws kafka create-cluster`/
  `create-cluster-v2`/`describe-cluster`/`get-bootstrap-brokers`/`update-broker-count`/
  `update-broker-storage`, `aws kafkaconnect`. CloudFormation `AWS::MSK::Cluster`,
  `AWS::MSK::ServerlessCluster`, `AWS::MSK::Configuration`, `AWS::KafkaConnect::Connector`,
  `AWS::MSK::Replicator`.
