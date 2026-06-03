---
name: aws-ivs
description: Use when delivering turnkey low-latency or real-time interactive live streaming with Amazon IVS (Interactive Video Service) — low-latency channels (STANDARD/BASIC, channel types, ingest stream keys, playback URLs), real-time stages for multi-host WebRTC video (composition/recording), recording live streams to S3, playback authorization with private channels and signed JWTs, the IVS Chat rooms/messaging service with moderation, and EventBridge stream-state events (Amazon IVS). Loads the IVS knowledge: how to create a channel or real-time stage, ingest via RTMPS/WebRTC, embed the player, secure private playback, add chat, and verify a stream is live. Consumed by the IVS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) building interactive live experiences.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ivs, live-streaming, low-latency, webrtc, chat]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon IVS (Interactive Video Service)

A **turnkey** managed live streaming product: you ingest a feed and IVS handles transcoding,
delivery, and a global low-latency player, plus real-time multi-host video and chat — no pipeline to
assemble. It is the managed alternative to building MediaLive + MediaPackage + CDN yourself; choose
IVS for speed-to-market and interactivity, and the MediaLive/MediaPackage pipeline when you need
fine-grained control, custom DRM, or broadcast workflows.

## Core concepts and components
- **Low-latency channels** — create a channel (type **STANDARD** transcodes an ABR ladder, **BASIC**
  passes through), ingest via **RTMPS** using a **stream key**, and play back via the channel's
  **playback URL** with the IVS player SDK (latency ~2–5s).
- **Real-time stages** — **WebRTC** stages for **multi-host** interactive video (guests/co-streaming)
  with sub-second latency; supports server-side **composition** and recording.
- **Recording** — auto-record live sessions to **S3** (and optionally generate a VOD/thumbnails).
- **Playback authorization** — mark a channel **private** and gate playback with **signed JWT**
  tokens from a playback key pair for entitlement.
- **IVS Chat** — managed **chat rooms** with messaging, a logging/handler integration, and
  **moderation** (delete message / disconnect user).
- **Events** — **EventBridge** stream-state change events (stream start/end, recording state) for
  automation.

## Configuration and sizing
- Pick channel type by need: STANDARD (transcoded ABR, broad device support) vs BASIC (cheaper,
  single rendition, limited resolution). Use real-time **stages** when multiple people share the
  stage; use low-latency **channels** for one-to-many broadcast.
- Enable recording to S3 if you need VOD; choose a channel latency mode appropriate to interactivity.

## Security and IAM
- Use **private channels** + signed JWT playback tokens (from a playback key pair) for entitlement;
  keep stream keys secret and rotate them. IVS Chat tokens are signed and scoped to capabilities
  (publish/subscribe/moderate).
- Restrict channel/stage/chat admin with IAM; recording writes to a scoped S3 bucket.

## Cost levers
- Billed by input + output hours (transcoded STANDARD costs more than BASIC), real-time stage
  participant-minutes, and chat messages. Use BASIC where ABR isn't needed, end idle stages/chat
  rooms, and only record when VOD is required.

## Scaling and limits
- Quotas on concurrent channels/streams, stage participants, and chat rooms apply. IVS scales
  delivery globally automatically; raise quotas for large concurrent audiences.

## Operating procedure
1. **Provision** — create a channel (and optional recording config) via Terraform
   `aws_ivs_channel` / `aws_ivs_recording_configuration` or `aws ivs create-channel`; for
   interactivity create a stage with `aws ivs-realtime create-stage`.
2. **Configure** — ingest via RTMPS with the stream key (or join the WebRTC stage), embed the IVS
   player with the playback URL, attach recording to S3, and create an IVS Chat room if needed.
3. **Secure** — make the channel private and issue signed JWT playback tokens, scope chat tokens to
   capabilities, rotate stream keys, and scope the recording S3 bucket + admin IAM.
4. **Verify** — apply [[verify-by-running]]: push a test feed, then `aws ivs get-stream` (or
   `list-streams`) to confirm the stream state is `LIVE`, fetch the playback URL/master manifest with
   `curl` to confirm it plays, and confirm a stream-start event or recording object appeared.

## Inputs
Broadcast vs multi-host interactive need, expected concurrency and latency target, device/player
targets, recording/VOD requirements, entitlement/private-playback needs, and whether chat is needed.

## Output
A low-latency channel and/or real-time stage with ingest + playback, an embedded player, optional S3
recording, private playback authorization, IVS Chat, and verification that a stream goes LIVE and
plays.

## Notes
- Gotchas: IVS is turnkey — for custom DRM/broadcast control use the MediaLive + MediaPackage
  pipeline instead; STANDARD transcodes (ABR, costs more) vs BASIC pass-through; **real-time stages
  (WebRTC, sub-second, multi-host)** are different from **low-latency channels (RTMPS, ~2–5s,
  one-to-many)**; private playback needs signed JWTs from a playback key pair; keep stream keys
  secret.
- IaC/CLI: Terraform `aws_ivs_channel`, `aws_ivs_playback_key_pair`, `aws_ivs_recording_configuration`,
  `aws_ivschat_room`, `aws_ivschat_logging_configuration`. CLI `aws ivs create-channel` /
  `get-stream` / `list-streams`; `aws ivs-realtime create-stage`; `aws ivschat create-room`.
  CloudFormation `AWS::IVS::Channel`, `::PlaybackKeyPair`, `::RecordingConfiguration`,
  `::Stage`, `AWS::IVSChat::Room`.
