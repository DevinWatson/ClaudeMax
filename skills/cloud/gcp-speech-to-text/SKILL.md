---
name: gcp-speech-to-text
description: Use when designing, provisioning, securing, or operating Cloud Speech-to-Text — Google Cloud's pretrained automatic speech recognition (ASR) service: synchronous, asynchronous (long-running from Cloud Storage), and streaming transcription, recognition models (latest_long/latest_short, telephony, medical, chirp), language/locale config, model adaptation (phrase sets/boost/custom classes), speaker diarization, punctuation, word timestamps, and profanity filtering (Speech-to-Text). Loads the Speech-to-Text knowledge: pick a model, transcribe sync/async/streaming, tune accuracy with adaptation, secure the identity, and verify a transcript. Consumed by the Speech-to-Text specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add ASR.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, speech-to-text, ai-ml, asr, transcription, streaming]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Speech-to-Text

A pretrained automatic speech recognition (ASR) service that converts audio to text. You send audio
(inline, a Cloud Storage URI, or a stream) plus a recognition config, and it returns transcripts with
confidence, optional timestamps, and speaker labels — no model training or hosting required.

## Core concepts and components
- **Recognition modes** — **synchronous** (short audio, ≤~1 min, inline), **asynchronous /
  long-running** (longer audio from Cloud Storage via `longRunningRecognize`), and **streaming**
  (real-time bidirectional over gRPC for live mics/calls).
- **Models** — purpose-tuned models: `latest_long` / `latest_short`, **telephony** (8 kHz calls),
  **medical**, and **Chirp** (the large universal speech model); pick by audio type for accuracy.
- **Config** — language/locale code(s), encoding + sample rate, multi-channel, alternatives,
  automatic punctuation, word **timestamps**, profanity filter.
- **Model adaptation** — **phrase sets**, **boost**, and **custom classes** to bias recognition
  toward domain vocabulary (product names, jargon).
- **Speaker diarization** — labels "who spoke when" across speakers.
- **Recognizers** (v2 API) — reusable, regionalized configuration objects.

## Configuration and sizing
- Match the **model** to the audio (telephony for 8 kHz calls, medical for clinical, chirp/latest for
  general). Set the correct **encoding + sample rate** (mismatch wrecks accuracy). Use sync for short
  clips, async (Cloud Storage) for files, streaming for live. Add adaptation for domain terms and
  diarization when speaker labels matter. Choose the regional endpoint for residency/latency.

## Security and IAM
- Transcribe with a dedicated **service account** scoped to the recognizer and the audio Cloud
  Storage bucket — avoid API keys for server use. Audio/transcripts may contain **PII/PHI**: CMEK-encrypt
  Cloud Storage, restrict access, enable VPC-SC, and audit via Cloud Audit Logs. Choose a regional
  recognizer for data-residency requirements.

## Cost levers
- Cost is per **15 seconds of audio processed** (model-dependent). Levers: trim silence/irrelevant
  audio, use the right model (don't over-pay for a heavier model than needed), batch via async rather
  than many tiny sync calls, and cache transcripts to avoid re-processing.

## Scaling and limits
- Sync has audio-length/size limits; async handles long files; streaming has a per-stream duration
  cap (reconnect for longer). Per-project QPS/streaming-concurrency quotas apply — raise via the
  quotas page. The service is fully managed (no infrastructure to scale).

## Operating procedure
1. **Provision** — enable the Speech-to-Text API (`gcloud services enable speech.googleapis.com`;
   Terraform `google_project_service`), create a least-privilege **service account**, and (for async)
   the audio **Cloud Storage** bucket; with the v2 API, create a regional **recognizer**.
2. **Configure** — choose the **model**, language/encoding/sample rate, recognition mode (sync /
   async / streaming), and enable punctuation/timestamps/diarization + **model adaptation** (phrase
   sets/boost) as needed.
3. **Secure** — scope the service account least-privilege, CMEK-encrypt audio buckets, pick the
   regional recognizer for residency, enable VPC-SC, and protect PII/PHI.
4. **Verify** — apply [[verify-by-running]]: enable confirmed via `gcloud services list`, then
   transcribe a representative sample (`gcloud ml speech recognize` / `recognize-long-running` or the
   SDK/streaming) and confirm an accurate transcript with sensible confidence (and diarization if
   enabled) — capture the actual output.

## Inputs
Audio type + source (inline / Cloud Storage / live stream), language(s) + encoding/sample rate,
mode (sync/async/streaming), accuracy needs (adaptation/diarization/timestamps), region/residency,
PII/PHI + encryption requirements, and IAM scope.

## Output
A Speech-to-Text integration (chosen model + recognition config, sync/async/streaming wiring, optional
adaptation/diarization, a regional recognizer, scoped service account, CMEK) plus verification of an
accurate sample transcript with sensible confidence scores.

## Notes
- Gotchas: wrong encoding/sample-rate config silently destroys accuracy; pick the model that matches
  the audio (telephony/medical/chirp); streaming has a per-stream time limit (reconnect); sync has a
  length cap (use async for files); audio/transcripts can be PII/PHI (CMEK, VPC-SC, regional
  recognizer); v1 vs v2 (recognizers) APIs differ. This is ASR — for the reverse (text→audio) use
  Text-to-Speech; the AWS equivalent is Amazon Transcribe.
- IaC/CLI: Terraform `google_project_service` (enable) + `google_service_account`/IAM and
  `google_storage_bucket` for async I/O (the v2 recognizer has limited/no first-class Terraform
  resource — create via API). CLI `gcloud ml speech recognize / recognize-long-running`; the
  Speech-to-Text REST/SDK (`recognize`, `longRunningRecognize`, `StreamingRecognize`) for application
  use.
