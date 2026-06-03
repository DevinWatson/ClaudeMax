---
name: aws-medialive
description: Use when encoding live video in real time with AWS Elemental MediaLive — channels and their input attachments, inputs (RTP/RTMP push, RTMP/HLS pull, MediaConnect, Elemental Link/SDI), input security groups, encoder settings (codecs, ABR rendition ladders, audio/captions), output groups feeding a downstream origin (typically MediaPackage, or HLS/RTMP/UDP/MediaConnect), pipeline redundancy (two-pipeline channels and input failover), channel classes (STANDARD vs SINGLE_PIPELINE), and schedule actions/SCTE-35 ad markers (AWS Elemental MediaLive). Loads the MediaLive knowledge: how to build inputs and a redundant live channel, encode ABR renditions to an origin, and verify the channel runs. Consumed by the MediaLive specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) building live pipelines.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, medialive, live-encode, channels, abr, scte-35]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Elemental MediaLive

A managed **live video encoder**: it ingests a live contribution feed, encodes it in real time into
adaptive-bitrate renditions, and pushes the output to a downstream origin/packager. It is the
**encode** stage of the live pipeline — pair it with MediaPackage (origin/packaging/DRM) downstream;
for stored-file transcoding use MediaConvert; for a turnkey low-latency interactive product use IVS.

## Core concepts and components
- **Channels** — the live encoding workload; a channel has **input attachments** and produces one or
  more **output groups**. A running channel incurs cost continuously.
- **Inputs** — the live source: **push** (RTP, RTMP) or **pull** (RTMP, HLS), **MediaConnect** flows,
  or hardware **Elemental Link**/SDI. **Input security groups** restrict push-input source IPs.
- **Encoder settings** — video codecs (H.264/H.265), an **ABR ladder** of renditions, audio
  selectors/descriptions, and captions; GOP/segment settings tuned to the downstream packager.
- **Output groups** — destinations: **MediaPackage** (most common), HLS, RTMP, UDP/TS, MediaConnect,
  or archive to S3.
- **Redundancy** — **STANDARD** channel class runs **two pipelines** (pipeline 0/1) for resilience;
  **input failover** pairs primary/secondary inputs; **SINGLE_PIPELINE** is cheaper but not resilient.
- **Schedule actions** — time/immediate actions including **SCTE-35** ad-marker insertion, input
  switching, and static image overlays.

## Configuration and sizing
- Match encoder GOP/segment length to the downstream packager and target latency; build the ABR
  ladder for your audience devices/bandwidth.
- Use a **STANDARD** two-pipeline channel with input failover for production resilience; size the
  channel input/codec specs to the source resolution/framerate (they affect price).

## Security and IAM
- Restrict push inputs with **input security groups** (allowlisted CIDRs); MediaLive uses an IAM
  role to write to MediaPackage/S3 — scope it. Prefer MediaConnect or Link for secure contribution.
- Restrict channel start/stop and config edits with IAM; protect RTMP/RTP keys/endpoints.

## Cost levers
- Billed by channel **running time** (input + output specs determine rate) plus inputs/reserved
  pricing. **Stop channels when idle**, use SINGLE_PIPELINE for non-critical/dev, right-size codec
  and ABR rendition count, and consider reserved outputs for steady 24/7 channels.

## Scaling and limits
- Quotas on channels, inputs, and pipelines per account apply. Live encoding is per-channel; scale
  by adding channels. Raise quotas for large event/24-7 fleets.

## Operating procedure
1. **Provision** — create an input + input security group and a channel via Terraform
   `aws_medialive_input` / `aws_medialive_input_security_group` / `aws_medialive_channel` or
   `aws medialive create-input` / `create-input-security-group` / `create-channel`.
2. **Configure** — attach the input, set encoder settings + the ABR ladder, point an output group at
   the downstream origin (e.g., MediaPackage), set channel class (STANDARD + failover) and SCTE-35
   schedule actions.
3. **Secure** — lock push inputs with an input security group, scope the channel IAM role, and
   restrict start/stop/config IAM.
4. **Verify** — apply [[verify-by-running]]: `aws medialive start-channel` then poll
   `aws medialive describe-channel` until `RUNNING`, confirm both pipelines are healthy and the
   output group is delivering to the origin (then confirm a playable manifest downstream), and stop
   the channel after the test.

## Inputs
Contribution source/protocol and ingest location, target latency, the ABR ladder, downstream origin
(MediaPackage/other), resilience requirements (single vs two-pipeline), ad-marker/SCTE-35 needs.

## Output
Inputs + input security groups, a (typically STANDARD, redundant) channel encoding an ABR ladder to a
downstream origin, SCTE-35/schedule actions configured, and verification that the channel runs and
delivers to its origin.

## Notes
- Gotchas: a running channel bills continuously — **stop it when idle**; STANDARD = two pipelines for
  resilience while SINGLE_PIPELINE has no failover; input security groups gate push inputs; segment/
  GOP settings must match the downstream packager; MediaLive only encodes — packaging/DRM is
  MediaPackage; this is live (not file/VOD = MediaConvert).
- IaC/CLI: Terraform `aws_medialive_input`, `aws_medialive_input_security_group`,
  `aws_medialive_channel`, `aws_medialive_multiplex`. CLI `aws medialive create-input` /
  `create-channel` / `start-channel` / `stop-channel` / `describe-channel` /
  `batch-update-schedule`. CloudFormation `AWS::MediaLive::Input`, `::InputSecurityGroup`,
  `::Channel`.
