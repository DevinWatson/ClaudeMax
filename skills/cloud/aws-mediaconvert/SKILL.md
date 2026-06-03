---
name: aws-mediaconvert
description: Use when transcoding file-based (VOD) video with AWS Elemental MediaConvert — submitting transcode jobs, reusable job templates and output presets, input clipping/stitching/captions/audio selectors, output groups (file/Apple HLS/DASH ISO/CMAF/Microsoft Smooth) for adaptive bitrate (ABR) renditions, codecs (H.264/H.265/AV1) and rate control, DRM/SPEKE encryption, accelerated transcoding, on-demand vs reserved pricing queues, and event-driven pipelines via EventBridge/S3 (AWS Elemental MediaConvert). Loads the MediaConvert knowledge: how to build job templates and output groups, produce ABR ladders, wire S3-triggered jobs, and verify outputs render. Consumed by the MediaConvert specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) building VOD pipelines.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, mediaconvert, transcode, vod, abr, hls]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Elemental MediaConvert

A managed **file-based (VOD) video transcoding** service: it takes a source file from S3, transcodes
it into one or more output formats/renditions, and writes the results back to S3. It is for stored
files, not live streams — for live encoding use MediaLive, and for origin packaging/DRM of live
output use MediaPackage.

## Core concepts and components
- **Jobs** — a single transcode request: input(s) → settings → output group(s). Jobs run in queues.
- **Job templates & output presets** — reusable templates capture full job settings; **output
  presets** capture a single rendition's encoding settings for reuse across templates.
- **Inputs** — source files with **input clipping** (in/out points), **stitching** (multiple inputs),
  **audio selectors**, and **caption selectors** (embedded/sidecar, e.g., SRT/SCC/WebVTT).
- **Output groups** — choose the packaging: **File** (MP4/MOV), **Apple HLS**, **DASH ISO**, **CMAF**,
  **Microsoft Smooth**; multiple outputs per group form an **adaptive bitrate (ABR)** ladder.
- **Codecs & rate control** — H.264/AVC, H.265/HEVC, AV1, ProRes; CBR/VBR/QVBR rate control and
  resolution/bitrate per rendition; QVBR is the usual quality-targeted choice.
- **DRM** — content encryption via **SPEKE** key-provider integration (e.g., with a DRM platform).
- **Queues** — **on-demand** queues (per-minute) or **reserved** queues (committed RTS capacity);
  **accelerated transcoding** for long/complex sources.

## Configuration and sizing
- Build a job template encoding the ABR ladder (resolutions/bitrates) and CMAF/HLS+DASH outputs once,
  then submit jobs referencing it; use QVBR for consistent quality per bitrate.
- Use reserved queues for steady high volume, on-demand for bursty; enable accelerated transcoding
  only for long-form/complex content where it pays off.

## Security and IAM
- MediaConvert assumes an IAM **service role** to read input and write output S3 buckets — scope it
  to those buckets. KMS-encrypt outputs; use SPEKE for DRM with a scoped key provider.
- Restrict who can submit jobs / edit templates with IAM; keep input and output buckets private.

## Cost levers
- Billed per output **minute** scaled by resolution/codec/features (HEVC/AV1 and accelerated cost
  more). Reserved queues lower cost at steady volume; trim the ABR ladder, avoid needless 4K/AV1
  renditions, and reuse templates to avoid misconfigured expensive outputs.

## Scaling and limits
- Concurrent-job and queue quotas apply; on-demand scales automatically while reserved is capped to
  purchased RTS. Drive volume event-driven (S3 → EventBridge → job) and raise quotas as needed.

## Operating procedure
1. **Provision** — create the service role and a queue, then a job template + output presets via
   Terraform `aws_media_convert_queue` (+ JSON job settings) or `aws mediaconvert create-queue` /
   `create-job-template`.
2. **Configure** — define inputs (clipping/audio/captions) and output groups (HLS/DASH/CMAF) with the
   ABR ladder and codec/rate-control settings; wire an S3-upload → EventBridge → submit-job pipeline.
3. **Secure** — scope the service role to input/output buckets, KMS-encrypt outputs, configure SPEKE
   DRM if needed, and restrict job/template IAM.
4. **Verify** — apply [[verify-by-running]]: `aws mediaconvert get-account-endpoint` then submit a
   test job (`create-job`), poll `get-job` until `COMPLETE`, and confirm the expected output objects
   (manifest + segments/renditions) landed in the output S3 bucket.

## Inputs
Source formats and locations, target devices/players, the ABR ladder (resolutions/bitrates/codecs),
captions/audio tracks, DRM requirements, expected volume/SLA, and the trigger mechanism.

## Output
A reusable job template + output presets, output groups producing an ABR ladder, an event-driven
submission pipeline, DRM/encryption configured, and verification that a job completes and outputs
land in S3.

## Notes
- Gotchas: MediaConvert uses a per-account/region **endpoint** you must fetch first; it is file/VOD
  only (use MediaLive for live); the service role must reach both input and output buckets; QVBR is
  the usual quality target; HEVC/AV1/4K/accelerated raise cost per minute; templates avoid
  hand-misconfiguring outputs.
- IaC/CLI: Terraform `aws_media_convert_queue` (job definitions are JSON submitted to the API). CLI
  `aws mediaconvert get-account-endpoint` / `create-queue` / `create-job-template` /
  `create-preset` / `create-job` / `get-job`. CloudFormation `AWS::MediaConvert::Queue`,
  `::JobTemplate`, `::Preset`.
