---
name: aws-kinesis
description: Use when designing, provisioning, securing, or operating Amazon Kinesis — the managed real-time streaming family (Amazon Kinesis). Loads the Kinesis knowledge: Kinesis Data Streams (shards, partition keys, provisioned vs on-demand capacity mode, retention, KPL producer and KCL/enhanced fan-out consumers, resharding), Kinesis Data Firehose (delivery to S3/Redshift/OpenSearch/Splunk, buffering, Parquet/ORC conversion, dynamic partitioning, Lambda transforms), and Managed Service for Apache Flink (formerly Kinesis Data Analytics). Covers throughput sizing by shard, ordering and partition-key design, at-least-once delivery and idempotency, the security model (IAM, KMS, VPC endpoints), and cost levers, plus how to choose Streams vs Firehose, process with Flink, and verify ingestion and delivery. Consumed by the Kinesis specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, kinesis, analytics, streaming, firehose, flink]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Kinesis

A **managed real-time streaming family** for collecting, processing, and delivering streaming data at
scale — **Data Streams** (durable ordered streams), **Data Firehose** (zero-admin delivery to stores),
and **Managed Service for Apache Flink** (stream processing). AWS-native alternative to self-managed
Kafka.

## Core concepts and components
- **Kinesis Data Streams** — a stream is a set of **shards**; each shard handles ~1 MB/s or 1000
  records/s in and ~2 MB/s out. **Partition key** maps records to shards and determines **ordering**
  (per-shard). **Capacity mode**: **provisioned** (you manage shard count) or **on-demand** (auto-scales
  to traffic). **Retention** 24h–365d. Producers via **KPL** or PutRecord(s); consumers via **KCL**,
  Lambda, or **enhanced fan-out** (dedicated 2 MB/s per consumer). **Resharding** = split/merge shards.
- **Kinesis Data Firehose** — fully managed **delivery streams** to **S3, Redshift, OpenSearch,
  Splunk**, and HTTP endpoints with **buffering** (size/time), **Lambda transforms**, **format
  conversion** to Parquet/ORC, **dynamic partitioning**, and compression. No shards to manage.
- **Managed Service for Apache Flink** (ex Kinesis Data Analytics) — run **Apache Flink** apps (Java/
  Python/SQL) for windowed aggregations, joins, and enrichment over streams, with checkpointing and
  autoscaling.

## Configuration and sizing
- **Streams**: size shards to peak ingest (MB/s and records/s) **and** consumer fan-out; choose a
  **high-cardinality partition key** to avoid hot shards; use **on-demand** for unpredictable traffic,
  **provisioned** + resharding for steady high volume. **Firehose**: tune **buffer size/interval** to
  trade latency vs object size, enable **format conversion + dynamic partitioning** for query-ready S3.
  **Flink**: size parallelism/KPUs to workload and enable autoscaling.

## Security and IAM
- Gate producers/consumers with IAM (`kinesis:PutRecord*`, `GetRecords`, `SubscribeToShard`); Firehose
  uses a **delivery role** for its destination and source. Enable **server-side encryption (KMS)** on
  streams and Firehose, use **VPC interface endpoints** for private access, and enable CloudTrail.
  Restrict who can reshard or change retention.

## Cost levers
- **Streams**: provisioned billed per **shard-hour** + PUT payload units; **on-demand** billed per
  throughput — cheaper to right-size shards or use on-demand for spiky load. **Enhanced fan-out** adds
  per-consumer-shard cost (use only when multiple consumers need full throughput). **Firehose** billed
  per GB ingested (+ conversion/dynamic-partitioning); larger buffers = fewer S3 PUTs. Long retention
  adds cost.

## Scaling and limits
- Each shard caps throughput; scale by resharding (provisioned) or use on-demand (auto, with its own
  per-stream ceilings and ramp limits). Standard consumers share the 2 MB/s egress per shard across
  consumers — use **enhanced fan-out** for many independent consumers. Firehose has per-delivery-stream
  throughput quotas (raisable). Resharding is not instantaneous.

## Operating procedure
1. **Provision** — create the stream/delivery stream/Flink app via Terraform `aws_kinesis_stream` /
   `aws_kinesis_firehose_delivery_stream` / `aws_kinesisanalyticsv2_application`, or
   `aws kinesis create-stream` / `aws firehose create-delivery-stream`; choose capacity mode and
   retention.
2. **Configure** — shard count or on-demand, partition-key strategy, consumers (KCL/Lambda/enhanced
   fan-out); Firehose buffering + format conversion + dynamic partitioning + transform Lambda; Flink
   parallelism/checkpointing.
3. **Secure** — IAM producer/consumer policies, Firehose delivery role, KMS encryption, VPC endpoints,
   CloudTrail.
4. **Verify** — apply [[verify-by-running]]: `aws kinesis put-record` then
   `get-shard-iterator`/`get-records` to confirm round-trip and ordering; for Firehose, put a test
   record and confirm the transformed/partitioned object lands in the destination (S3/OpenSearch);
   confirm on-demand or resharding adjusts capacity under load — capture the actual output.

## Inputs
Throughput (MB/s, records/s) and burstiness, ordering needs + partition-key cardinality, consumer count/
fan-out, retention, Streams vs Firehose vs Flink, destinations + format, security model (IAM/KMS/VPC).

## Output
A Kinesis setup (Data Streams with capacity mode + shards/partition strategy + consumers, and/or
Firehose delivery stream with buffering/conversion/partitioning, and/or Flink app), plus verification of
end-to-end ingestion, delivery, and scaling.

## Notes
- Gotchas: a low-cardinality partition key creates **hot shards** that throttle; standard consumers
  share 2 MB/s egress — many consumers need enhanced fan-out; Kinesis is **at-least-once** so consumers
  must be idempotent; resharding is gradual and double-bills during reshard; Firehose buffering trades
  latency for object size (tiny buffers = many small S3 files); retention beyond 24h costs more; Flink
  checkpoints/state must be sized. Kinesis ordering is per-shard, not global.
- IaC/CLI: Terraform `aws_kinesis_stream`, `aws_kinesis_stream_consumer`,
  `aws_kinesis_firehose_delivery_stream`, `aws_kinesisanalyticsv2_application`. CLI
  `aws kinesis create-stream`/`put-record`/`get-records`/`update-shard-count`/`register-stream-consumer`,
  `aws firehose create-delivery-stream`/`put-record`. CloudFormation `AWS::Kinesis::Stream`,
  `AWS::Kinesis::StreamConsumer`, `AWS::KinesisFirehose::DeliveryStream`,
  `AWS::KinesisAnalyticsV2::Application`.
