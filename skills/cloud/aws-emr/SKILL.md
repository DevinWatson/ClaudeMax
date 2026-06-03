---
name: aws-emr
description: Use when designing, provisioning, securing, or operating Amazon EMR — the managed big-data platform that runs Apache Spark, Hadoop, Hive, Presto/Trino, HBase, and Flink on managed clusters (Amazon EMR). Loads the EMR knowledge: cluster topology (primary/core/task nodes), instance groups vs instance fleets, On-Demand + Spot mix and allocation strategies, managed scaling and auto-scaling, EMR on EC2 vs EMR Serverless vs EMR on EKS, EMR Studio notebooks, bootstrap actions and custom AMIs, steps and step concurrency, the Glue Data Catalog as the Hive metastore, S3 (EMRFS) vs HDFS storage, spot-driven cost optimization, and the security model (IAM roles, EMRFS authorization, Lake Formation, Kerberos, encryption at rest/in transit). Covers how to size and shape clusters, run Spark/Hive workloads, isolate transient vs long-running clusters, and verify jobs and scaling. Consumed by the EMR specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, emr, analytics, big-data, spark, hadoop]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon EMR

A **managed big-data platform** that runs open-source frameworks — **Apache Spark, Hadoop (MapReduce/
YARN), Hive, Presto/Trino, HBase, Flink** — on managed clusters of EC2 instances, on EKS, or fully
serverless. EMR provisions, configures, and tunes the cluster so you focus on the data jobs.

## Core concepts and components
- **Cluster topology** — a **primary** node (resource manager/coordination), **core** nodes (run tasks
  *and* host HDFS data), and optional **task** nodes (compute-only, no HDFS — ideal for Spot).
- **Instance groups vs instance fleets** — groups: fixed instance type per role; **fleets**: a mix of
  types/sizes with **On-Demand + Spot** target capacities and **allocation strategies**
  (capacity-optimized) for resilient Spot usage across many types/AZs.
- **Deployment models** — **EMR on EC2** (full control of the cluster); **EMR Serverless** (no cluster
  to manage — submit Spark/Hive applications, pay per vCPU/memory-second); **EMR on EKS** (run Spark on
  an existing Kubernetes cluster).
- **Scaling** — **EMR managed scaling** (EMR resizes core/task within min/max limits) or custom
  **auto-scaling** rules on YARN/CloudWatch metrics.
- **Steps and applications** — submit work as **steps** (a Spark/Hive job) with configurable **step
  concurrency**; **bootstrap actions** and **custom AMIs** install dependencies at launch.
- **Storage** — **EMRFS** (S3-backed, durable, decoupled compute/storage — preferred) vs **HDFS** on
  core-node volumes (ephemeral, fast scratch). **EMR Studio** + notebooks for interactive work.
- **Metastore** — the **AWS Glue Data Catalog** as the shared Hive metastore across clusters.

## Configuration and sizing
- Size by workload: enough **core** nodes for HDFS/shuffle and **task** nodes (Spot) for burst compute;
  pick memory- vs compute-optimized families to match Spark executor sizing. Use **instance fleets +
  capacity-optimized Spot** and **managed scaling** (min/max) so transient clusters right-size
  automatically. Tune Spark via `spark-defaults`/`yarn-site` classifications. Prefer **transient
  clusters** (auto-terminate after steps) for batch, long-running clusters for interactive/HBase.

## Security and IAM
- EMR uses a **service role**, an **EC2 instance profile**, and (for managed scaling) an **auto-scaling
  role**. Gate S3 via the instance profile or **EMRFS role mappings**; use **Lake Formation** / IAM for
  fine-grained data access. Enable **encryption at rest** (S3 SSE-KMS, EBS, local-disk LUKS) and **in
  transit** (TLS), launch in **private subnets**, and use **Kerberos** + **runtime roles** for
  multi-tenant clusters. Block-public-access and security configurations centralize these settings.

## Cost levers
- Biggest lever: **Spot for task nodes** with fleets + capacity-optimized allocation (large savings),
  plus **transient auto-terminating clusters**, **managed scaling** to release idle capacity, EMRFS/S3
  (no idle HDFS), and **EMR Serverless** for spiky workloads (pay only while jobs run). Right-size
  instance families and avoid oversized always-on clusters.

## Scaling and limits
- Managed scaling resizes within configured min/max units; primary node is a single point — size it
  adequately and consider primary-node HA (multi-primary) for long-running clusters. Spot interruptions
  affect task nodes only when topology is correct (no HDFS on task nodes). Account/region EC2 and EBS
  quotas and EMR API rate limits apply.

## Operating procedure
1. **Provision** — create the cluster (or Serverless application) via Terraform `aws_emr_cluster` /
   `aws_emr_instance_fleet` / `aws_emrserverless_application`, or `aws emr create-cluster` /
   `aws emr-serverless create-application`; set release label, applications (Spark/Hive), topology, and
   Glue Catalog as metastore.
2. **Configure** — instance fleets with On-Demand+Spot and capacity-optimized allocation, managed
   scaling min/max, bootstrap actions/custom AMI, Spark/YARN classifications, EMRFS over S3.
3. **Secure** — service/instance/auto-scaling roles, security configuration (encryption at rest/in
   transit, Kerberos/runtime roles), private subnets, Lake Formation/IAM data access.
4. **Verify** — apply [[verify-by-running]]: submit a representative Spark/Hive **step** (or Serverless
   job) via `aws emr add-steps` / `aws emr-serverless start-job-run`, confirm it reaches `COMPLETED`,
   check output in S3, and confirm **managed scaling** adds/removes task nodes under load — capture the
   actual step state and node counts.

## Inputs
Frameworks/workload (Spark/Hive/Presto/HBase), batch vs interactive, data volume + S3 layout,
deployment model (EC2/Serverless/EKS), Spot tolerance, metastore source, security model (IAM/Lake
Formation/Kerberos/encryption), scaling bounds.

## Output
An EMR setup (cluster or Serverless application with topology/fleets, On-Demand+Spot mix, managed
scaling, bootstrap/AMI, Glue metastore, security configuration, EMRFS) plus verification of a completed
job and observed scaling.

## Notes
- Gotchas: never run HDFS on **task** nodes — losing Spot task nodes must not lose data; the **primary**
  node is a SPOF unless multi-primary; transient clusters that don't auto-terminate burn money;
  per-step concurrency and YARN memory misconfig causes pending/failed executors; EMRFS consistency and
  S3 throttling on many small files; release-label upgrades change framework versions/classifications;
  Glue Catalog as metastore shares schemas across clusters (coordinate DDL).
- IaC/CLI: Terraform `aws_emr_cluster`, `aws_emr_instance_fleet`, `aws_emr_instance_group`,
  `aws_emr_managed_scaling_policy`, `aws_emr_security_configuration`, `aws_emrserverless_application`,
  `aws_emrcontainers_virtual_cluster`. CLI `aws emr create-cluster`, `add-steps`, `list-steps`,
  `modify-instance-fleet`, `aws emr-serverless start-job-run`/`get-job-run`. CloudFormation
  `AWS::EMR::Cluster`, `AWS::EMR::InstanceFleetConfig`, `AWS::EMR::SecurityConfiguration`,
  `AWS::EMRServerless::Application`.
