---
name: aws-kinesis-data-firehose
description: Use when designing, provisioning, securing, or operating Amazon Data Firehose (formerly Kinesis Data Firehose) — the fully managed service that captures, transforms, and delivers streaming data into destinations with no servers to manage (Amazon Data Firehose). Loads the Firehose knowledge: delivery streams and their sources (Direct PUT, a Kinesis Data Stream, MSK), the buffering model (size in MB + time in seconds), record transformation and format conversion (Lambda transforms, JSON-to-Parquet/ORC conversion via Glue schema), dynamic partitioning, compression and encryption, and the destination sinks — S3, Amazon Redshift, OpenSearch Service, Splunk, and HTTP/third-party endpoints — plus error handling with S3 backup and retries. Covers buffering/sizing tradeoffs, IAM delivery roles, cost levers, throughput limits, and verification of end-to-end delivery. Consumed by the Firehose specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, kinesis-data-firehose, firehose, analytics, streaming, delivery-stream]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Data Firehose

A **fully managed delivery service** (formerly Kinesis Data Firehose) that ingests streaming records,
optionally **transforms and reformats** them, buffers, and **delivers** them to a destination — with
no infrastructure to provision or scale. You configure a **delivery stream**, point it at a source and
a sink, and Firehose handles batching, retries, and backup.

## Core concepts and components
- **Delivery stream** — the unit of configuration: one source, optional transformation, one primary
  destination, and an error/backup path.
- **Sources** — **Direct PUT** (`PutRecord`/`PutRecordBatch` from apps, CloudWatch Logs/Events,
  IoT, WAF), a **Kinesis Data Stream** (Firehose reads the stream), or **Amazon MSK** topics.
- **Buffering** — records accumulate until a **buffer size** (MB) or **buffer interval** (seconds)
  threshold is hit, then a batch is delivered. Larger buffers = fewer/bigger objects, more latency.
- **Transformation** — a **Lambda** function can mutate/filter/enrich each batch; **format
  conversion** turns JSON into **Parquet/ORC** using a **Glue table schema** for cheap downstream
  analytics. **Dynamic partitioning** routes records to S3 prefixes from record content (keys/jq).
- **Sinks** — **S3** (the common landing zone, with prefixes/compression/encryption), **Amazon
  Redshift** (via an intermediate S3 + `COPY`), **OpenSearch Service**, **Splunk**, and generic
  **HTTP endpoints** (Datadog, New Relic, MongoDB, etc.).
- **Error handling** — failed records go to an **S3 backup/error prefix**; configurable retry
  duration; optional source-record backup of all records.

## Configuration and sizing
- Tune **buffer size/interval** for the latency-vs-object-size tradeoff (e.g. 64–128 MB / 300 s for
  cheap Parquet objects; small/short for near-real-time search). Enable **GZIP/Snappy/ZSTD**
  compression and **format conversion** to Parquet for S3 analytics. Use **dynamic partitioning** to
  produce query-friendly `dt=`/`region=` prefixes. Right-size the **Lambda transform** memory/timeout
  to the batch.

## Security and IAM
- Firehose assumes a **delivery IAM role** granting only what the sink needs: `s3:PutObject` on the
  bucket/prefix, `glue:GetTable*` for format conversion, `lambda:InvokeFunction` for transforms,
  Redshift/OpenSearch/Splunk permissions, and `kms:GenerateDataKey`/`Decrypt` for SSE-KMS. Encrypt at
  rest (SSE-KMS on S3, server-side encryption on the stream) and in transit (TLS to HTTP endpoints).
  Scope the role tightly; never grant `s3:*` or wildcard buckets.

## Cost levers
- Billed per **GB ingested** (with tiers), plus **format-conversion** and **dynamic-partitioning**
  surcharges, VPC delivery, and the cost of the Lambda transform + destination. Levers: compress and
  convert to Parquet to cut downstream scan cost; right-size buffers to avoid tiny objects; only enable
  format conversion / dynamic partitioning where they pay off; avoid an over-provisioned transform.

## Scaling and limits
- Throughput scales automatically but has **per-stream quota** defaults (e.g. records/sec and MB/sec
  on Direct PUT, raisable via support); Lambda transform invocation and the destination can become the
  bottleneck. There is no replay (it is delivery, not a durable log) — use a Kinesis Data Stream as the
  source when you need replay/multiple consumers.

## Operating procedure
1. **Provision** — create the delivery stream with source, destination, and error prefix via Terraform
   `aws_kinesis_firehose_delivery_stream`, or `aws firehose create-delivery-stream`.
2. **Configure** — set buffering size/interval, compression, optional Lambda transform, format
   conversion (Glue schema), dynamic partitioning, and the sink-specific settings (S3 prefix, Redshift
   COPY, OpenSearch index, HTTP endpoint).
3. **Secure** — attach a least-privilege delivery role, enable SSE-KMS, restrict the destination
   bucket/index, and configure the error/backup prefix.
4. **Verify** — apply [[verify-by-running]]: push a representative record with
   `aws firehose put-record`, wait one buffer interval, and confirm the object/row/document landed in
   the sink (e.g. `aws s3 ls`/`aws s3 cp` the prefix, query the Redshift/OpenSearch target) with the
   expected transform/format applied; force a failure (bad record/permission) and confirm it lands in
   the error prefix — capture the actual output.

## Inputs
Source type (Direct PUT/Kinesis stream/MSK), record schema/format, destination sink + its config,
latency/object-size targets (buffering), transform/format-conversion/partitioning needs, security model
(delivery role, KMS), throughput expectations.

## Output
A Firehose delivery stream (source → optional transform/format conversion/dynamic partitioning → sink,
with buffering, compression, encryption, least-privilege delivery role, and an error/backup path), plus
verification that records are delivered correctly and failures are captured.

## Notes
- Gotchas: Firehose is delivery-only — no replay/multiple consumers (use a Kinesis Data Stream source
  for that); buffer interval dominates end-to-end latency; tiny objects from short buffers wreck S3
  query performance; format conversion needs a valid Glue schema or records silently route to error;
  dynamic-partitioning keys that are missing/null hit the error prefix; Redshift delivery stages
  through S3 and needs `COPY` permissions; the delivery role is a frequent misconfiguration.
- IaC/CLI: Terraform `aws_kinesis_firehose_delivery_stream` (with `s3_configuration`,
  `extended_s3_configuration`, `redshift_configuration`, `opensearch_configuration`,
  `http_endpoint_configuration`, `data_format_conversion_configuration`). CLI
  `aws firehose create-delivery-stream`, `put-record`, `put-record-batch`, `describe-delivery-stream`.
  CloudFormation `AWS::KinesisFirehose::DeliveryStream`.
