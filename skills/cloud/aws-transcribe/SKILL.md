---
name: aws-transcribe
description: Use when designing, provisioning, securing, or operating Amazon Transcribe — the managed automatic-speech-recognition (ASR) service that converts audio to text (Amazon Transcribe). Loads the Transcribe knowledge: batch transcription jobs over S3 vs streaming transcription (WebSocket/HTTP/2) for real-time, speaker diarization (speaker labels), channel identification, custom vocabularies and custom language models (CLM) for domain accuracy, vocabulary filters for profanity/redaction, automatic language identification, alternative transcriptions/confidence, PII identification and redaction, Transcribe Medical and Call Analytics (Contact Lens style), supported media formats and sample rates, IAM/KMS/VPC security, cost (per-second of audio, tiered) and quotas/concurrency, and verification by running a transcription. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Transcribe specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, transcribe, ai-ml, speech-to-text, asr, transcription]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Transcribe

A managed **automatic-speech-recognition (ASR)** service that turns audio/video speech into text via
API calls, with **no model to build**, supporting both **batch** (file) and **streaming** (real-time)
transcription plus customization for domain accuracy and PII handling.

## Core concepts and components
- **Batch transcription jobs** — `StartTranscriptionJob` over media in **S3**; output JSON (transcript +
  word-level timestamps/confidence) written to your bucket or a Transcribe-managed bucket. Async, polled
  via `GetTranscriptionJob`.
- **Streaming transcription** — real-time over **WebSocket** or **HTTP/2** (also SDK streaming);
  returns partial + final results with low latency for live captioning/agent assist.
- **Speaker diarization** — **speaker labels** to attribute speech to up to N speakers; **channel
  identification** for multi-channel audio (e.g., stereo call recordings).
- **Customization** — **custom vocabularies** (boost domain terms/acronyms), **custom language models
  (CLM)** trained on domain text for accuracy, and **vocabulary filters** (mask/remove/tag words for
  profanity or compliance).
- **Language** — explicit language code or **automatic language identification**; multi-language support.
- **PII** — **content identification/redaction** of PII in the transcript.
- **Specializations** — **Transcribe Medical** (clinical speech) and **Call Analytics** (turn-by-turn
  transcript with sentiment, talk time, categories, redaction for contact centers).

## Configuration and sizing
- Choose **batch vs streaming** by latency need. Set language (or auto-ID), enable diarization/channel
  ID, attach custom vocabulary/CLM/vocabulary filter, and enable PII redaction where required. Match
  **media format** (FLAC/WAV/MP3/MP4/Ogg/AMR/WebM) and **sample rate** to the source. There is no
  instance to size — throughput is governed by job concurrency and streaming session limits.

## Security and IAM
- Gate with IAM (`transcribe:*` scoped to jobs/vocabularies/models) plus an S3 access pattern for input
  media and output (a **service-linked** role or explicit `OutputBucketName` + KMS). Encrypt output and
  custom-model artifacts with **KMS**; run access privately via **VPC endpoints**. Audio and transcripts
  are sensitive (voice, PII, PHI) — restrict who can start jobs and where output lands; confirm
  compliance (HIPAA for Medical).

## Cost levers
- Bills **per second of audio** transcribed (tiered, with surcharges for features like Call Analytics /
  Medical / redaction). Levers: trim/segment audio to the needed span, disable unused features, prefer
  batch over streaming where real-time is not required, and reuse custom vocabularies instead of CLM
  unless accuracy demands it.

## Scaling and limits
- Per-account **concurrent batch job** quotas and **concurrent streaming session** limits; media
  duration/size limits per job. Language support and feature availability vary by region. Raise quotas
  via Service Quotas/support.

## Operating procedure
1. **Provision** — create input/output S3 buckets, the IAM access (service-linked role or output-bucket
   policy + KMS), and any **custom vocabulary**/**CLM**/**vocabulary filter**; via Terraform
   `aws_transcribe_vocabulary` / `aws_transcribe_language_model` / `aws_transcribe_vocabulary_filter`,
   or `aws transcribe create-*`.
2. **Configure** — pick batch or streaming, set language (or auto-ID), enable diarization/channel ID,
   attach customization + vocabulary filter, and enable PII redaction where required.
3. **Secure** — least-privilege IAM, KMS on output/models, VPC endpoints, locked buckets, and PII/PHI
   handling controls.
4. **Verify** — apply [[verify-by-running]]: run a representative batch job
   (`aws transcribe start-transcription-job`) on sample audio, poll
   `aws transcribe get-transcription-job` until `COMPLETED`, and inspect the transcript JSON for sensible
   text/confidence (and speaker labels/redaction if enabled); for streaming, run a short live session and
   confirm partial/final results — capture the actual output.

## Inputs
Mode (batch vs streaming), media format/sample rate + source location, language (or auto-ID),
diarization/channel needs, customization (vocabulary/CLM/filter), PII/redaction + compliance
(PII/PHI/KMS), throughput (concurrent jobs/sessions) targets, output S3 + access pattern.

## Output
A Transcribe setup — the chosen mode (batch S3 job or streaming session) with the right language,
diarization/channel ID, customization (vocabulary/CLM/filter) and PII handling, plus least-privilege
IAM/KMS — and verification that transcription returns sensible text.

## Notes
- Gotchas: streaming has session-duration/concurrency limits and needs HTTP/2 or WebSocket plumbing;
  batch output goes to a Transcribe-managed bucket unless you set `OutputBucketName` (and grant access);
  sample-rate/format mismatch degrades accuracy; custom vocabulary is cheaper/faster to iterate than a
  CLM; Medical/Call Analytics cost more and Medical (PHI) output is sensitive; auto language ID can pick
  wrong for short/noisy clips.
- IaC/CLI: Terraform `aws_transcribe_vocabulary`, `aws_transcribe_language_model`,
  `aws_transcribe_vocabulary_filter` (no Terraform resource for individual jobs — start jobs via
  CLI/SDK). CLI `aws transcribe start-transcription-job`, `get-transcription-job`,
  `start-medical-transcription-job`, `create-vocabulary`, `create-language-model`,
  `create-vocabulary-filter`, `start-call-analytics-job`; streaming via the SDK
  `StartStreamTranscription` API. CloudFormation coverage is limited — provision jobs via CLI/SDK.
