---
name: aws-mediapackage
description: Use when packaging and originating live or VOD video with AWS Elemental MediaPackage — channels that ingest an encoder feed, just-in-time packaging into HLS/DASH/CMAF/Microsoft Smooth output endpoints, content DRM via SPEKE (Widevine/PlayReady/FairPlay), time-shifted viewing (startover/catchup/live-to-VOD harvest), origin endpoint manifest/segment settings and CDN authorization, and the v2 channel groups model (AWS Elemental MediaPackage). Loads the MediaPackage knowledge: how to create a channel, attach format-specific origin endpoints, apply SPEKE DRM and CDN auth, and verify a playable manifest. Consumed by the MediaPackage specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) building the origin stage of a live pipeline.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, mediapackage, origin, packaging, drm, hls]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Elemental MediaPackage

A managed **video origin and just-in-time packager**: it ingests a single encoded feed and packages
it on the fly into multiple streaming formats, applies DRM, enables time-shifted viewing, and serves
a CDN-friendly origin. It is the **packaging/origin** stage of the live pipeline — it sits behind an
encoder (MediaLive) and in front of a CDN (CloudFront); for the encode itself use MediaLive, for
file/VOD transcoding use MediaConvert.

## Core concepts and components
- **Channel** — the ingest point that receives the encoder's feed (HLS/CMAF input) and holds the
  buffer that endpoints package from.
- **Origin endpoints** — per-format outputs packaged **just-in-time** from one ingest: **HLS**,
  **DASH (MPEG-DASH)**, **CMAF**, **Microsoft Smooth**; manifest/segment/window settings per endpoint.
- **DRM / content encryption** — **SPEKE** integration to apply **Widevine / PlayReady / FairPlay**
  keys at packaging time without re-encoding.
- **Time-shifted viewing** — **startover/catchup** windows and **live-to-VOD harvest** jobs to clip a
  live window into a VOD asset.
- **CDN authorization** — origin-level auth (e.g., header/CDN identifier) so only your CloudFront
  distribution can pull the origin.
- **v2 model** — newer **channel groups** organize channels/endpoints; v2 differs from the original
  (v1) channel/endpoint resources.

## Configuration and sizing
- One channel ingests once; add endpoints per format/DRM you must serve rather than re-encoding. Set
  manifest window/segment to match the encoder and target latency; enable startover only if needed.
- Put CloudFront in front and use CDN authorization; size the manifest window to the catchup duration
  you support.

## Security and IAM
- Apply **CDN authorization** so only your CDN can pull the origin; ingest credentials (or
  MediaLive's role) authenticate the encoder feed. Use **SPEKE** with a scoped key provider for DRM.
- Restrict channel/endpoint admin with IAM; serve over HTTPS; keep origin endpoints private behind
  the CDN.

## Cost levers
- Billed by data ingested + packaged/egressed and by origin requests. Front with CloudFront to cut
  origin egress, limit the number of formats/endpoints to what clients need, and bound startover
  windows.

## Scaling and limits
- Quotas on channels and endpoints apply; just-in-time packaging scales with viewer demand behind a
  CDN. Use channel groups (v2) to organize at scale and raise quotas for large deployments.

## Operating procedure
1. **Provision** — create a channel (v1 `aws_media_package_channel` / v2 channel group + channel) via
   Terraform `aws_media_package_channel` / `aws_media_packagev2_channel_group` or
   `aws mediapackage create-channel` / `aws mediapackagev2 create-channel-group`.
2. **Configure** — point the encoder (MediaLive output group) at the channel ingest, add origin
   endpoints (HLS/DASH/CMAF) with manifest/segment/window settings, apply SPEKE DRM, and set the
   startover window.
3. **Secure** — enable CDN authorization, front with CloudFront, configure SPEKE DRM with a scoped
   key provider, enforce HTTPS, and restrict admin IAM.
4. **Verify** — apply [[verify-by-running]]: `aws mediapackage describe-origin-endpoint` to get the
   playback URL, then fetch the manifest with `curl` (or `aws mediapackage describe-channel` for
   ingest health) and confirm it lists renditions/segments and (if DRM) the expected key signaling.

## Inputs
The upstream encoder feed (MediaLive), required output formats and player targets, DRM systems
needed, time-shift/startover requirements, CDN in front, and access/security requirements.

## Output
A channel ingesting the encoder feed, per-format origin endpoints (HLS/DASH/CMAF) with SPEKE DRM and
CDN authorization, startover/harvest as needed, and verification that a manifest is playable behind
the CDN.

## Notes
- Gotchas: MediaPackage packages/originates only — it needs an upstream encoder (MediaLive) feeding
  it; one channel ingest fans out to many endpoints (don't re-encode per format); always front with a
  CDN and enable CDN authorization so the origin isn't directly hammered; SPEKE applies DRM at
  packaging time; v2 (channel groups) and v1 resources differ — pick one consistently.
- IaC/CLI: Terraform `aws_media_package_channel`, `aws_media_package_channel_endpoint` (v1);
  `aws_media_packagev2_channel_group`, `aws_media_packagev2_channel`,
  `aws_media_packagev2_origin_endpoint` (v2). CLI `aws mediapackage create-channel` /
  `create-origin-endpoint` / `describe-origin-endpoint`; `aws mediapackagev2` for v2.
  CloudFormation `AWS::MediaPackage::Channel`, `::OriginEndpoint`; `AWS::MediaPackageV2::*`.
