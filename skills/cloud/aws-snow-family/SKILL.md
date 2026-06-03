---
name: aws-snow-family
description: Use when designing, ordering, securing, or operating the AWS Snow Family — offline/edge physical devices for bulk data transfer and edge compute: Snowcone (small, portable, online via DataSync or offline shipping), Snowball Edge Storage Optimized (large offline transfer to S3) and Compute Optimized (edge EC2/EBS/GPU compute in disconnected environments), job types (import/export to S3, local compute, cluster), ordering through the AWS Snow console/jobs, encryption with KMS, tamper-evident enclosures and the manifest/unlock code, NFS/S3 endpoints on-device, and shipping/return logistics (AWS Snow Family). Loads the Snow knowledge: how to pick a device, create a job, encrypt and load data, run edge workloads, ship back, and verify import into S3. Consumed by the Snow Family specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle offline bulk migration or edge compute.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, snow-family, snowball, edge, offline-transfer, migration, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Snow Family

Physical, ruggedized devices AWS ships to you for **offline bulk data transfer** and **edge compute**
in low-/no-bandwidth or harsh environments. Use Snow when moving petabytes over the network is too
slow/expensive, or when compute must run disconnected at the edge; for online transfer use DataSync,
for hybrid live access use Storage Gateway.

## Device types (choose by size + need)
- **Snowcone** — smallest/portable (~8 TB usable, rugged, battery-capable); transfer **online via
  DataSync** (it ships with a DataSync agent) or **offline** by shipping; can run small edge EC2.
- **Snowball Edge Storage Optimized** — large **offline transfer** (tens of TB usable) to/from S3;
  the workhorse for bulk migration.
- **Snowball Edge Compute Optimized** — edge **EC2/EBS** (optionally **GPU**) for compute in
  disconnected sites (e.g. ML inference, video processing) plus storage; can be **clustered** for
  capacity/HA.

## Job types and ordering
- **Import into S3** (data → AWS), **Export from S3** (AWS → device → you), **Local compute/storage**
  (edge), **Cluster** (multiple devices). Order via the **AWS Snow Family console / jobs API**;
  device is shipped, you load/run, then ship it back and AWS ingests into S3.

## Configuration and on-device use
- On-device endpoints: **S3-compatible** endpoint and/or **NFS** for copying data; use the **AWS OpsHub**
  GUI or the Snowball client. For compute, pre-stage AMIs/EC2 instances in the job. Cluster for larger
  jobs or edge HA.

## Security and IAM
- Data is **encrypted with KMS** (256-bit) before it lands on the device; the device is **tamper-
  evident** and uses a **Trusted Platform Module**. You unlock it with a **manifest file + unlock
  code** retrieved separately (never store them together). After return, AWS performs secure erase
  (NIST). IAM gates who can create/manage Snow jobs and the destination S3 bucket; least-privilege
  the job role.

## Cost levers
- Per-job device fee + per-day usage beyond the included days + return shipping; data import into S3
  is free (you then pay S3 storage). For very large datasets compare total cost/time vs DataSync over
  the available WAN — Snow wins when bandwidth is the bottleneck. Return promptly to avoid extra-day
  charges; cluster vs multiple single devices affects cost.

## Scaling and limits
- Scale capacity by ordering **more devices / a cluster**; each device has a fixed usable capacity.
  Logistics (shipping time) dominate the timeline — plan for transit each way.

## Operating procedure
1. **Provision** — create a Snow **job** (device type, import/export/compute, destination S3 bucket,
   KMS key, shipping address) via the Snow console / `aws snowball create-job`; receive the device.
2. **Configure** — unlock with the manifest + unlock code, then copy data via the S3/NFS endpoint or
   launch edge EC2 instances; for export, AWS pre-loads the data.
3. **Secure** — KMS encryption, keep manifest and unlock code separate, least-privilege job/S3 role,
   verify tamper-evidence on receipt.
4. **Verify** — apply [[verify-by-running]]: locally confirm copied object counts/sizes; ship back
   and use `aws snowball describe-job` to watch state reach `Completed`; then `aws s3 ls`/`head-object`
   on the destination bucket confirms the imported objects (counts/checksums) match the source.

## Inputs
Dataset size + available WAN bandwidth (transfer vs Snow decision), import/export/edge-compute need,
device type, destination S3 bucket + KMS key, edge compute/AMI requirements, site/shipping
constraints, timeline (logistics).

## Output
A Snow job definition (device type, job type, destination, KMS), on-device transfer/compute plan,
security handling (manifest/unlock), and verification that the device returned and objects imported
into S3 with matching counts/checksums.

## Notes
- Gotchas: **shipping/transit time** dominates — not for urgent transfers; manifest + unlock code
  must be stored separately; device has **fixed capacity** (order enough / a cluster); extra-day
  charges accrue if you keep it too long; edge compute runs only the pre-staged AMIs (no internet);
  export jobs put AWS data on a physical device you must protect; verify imported object counts/
  checksums — don't assume. Snow is **offline bulk / edge** — use DataSync for online sync and
  Storage Gateway for ongoing hybrid access.
- IaC/CLI: there is no first-class Terraform resource for Snow jobs — order via the **Snow console**
  or the **`aws snowball`** CLI (`create-job`, `describe-job`, `create-cluster`,
  `get-job-manifest`, `get-job-unlock-code`, `list-jobs`); manage on-device with **AWS OpsHub** or
  the Snowball client. CloudFormation does not provision Snow jobs (use the API). Provision the
  destination S3 bucket/KMS key with Terraform/CloudFormation as usual.
