---
name: gcp-text-to-speech
description: Use when designing, provisioning, securing, or operating Cloud Text-to-Speech — Google Cloud's pretrained speech synthesis service: synthesizing natural audio from text or SSML, voice selection across Standard, WaveNet, Neural2, Studio, and Chirp 3 HD voices, language/locale + gender, SSML control (prosody, breaks, say-as, emphasis), audio encoding/format and sample rate, speaking rate/pitch/volume tuning, and long-audio synthesis to Cloud Storage (Text-to-Speech). Loads the Text-to-Speech knowledge: pick a voice, synthesize from text/SSML, tune output, secure the identity, and verify playable audio. Consumed by the Text-to-Speech specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add speech synthesis.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, text-to-speech, ai-ml, tts, speech-synthesis, ssml]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Text-to-Speech

A pretrained speech synthesis service that converts text (or SSML markup) into natural-sounding
audio. You send text plus a voice + audio config and it returns encoded audio — no model training or
hosting required. It is the inverse of Speech-to-Text.

## Core concepts and components
- **Input** — plain **text** or **SSML** (Speech Synthesis Markup Language) for fine control:
  `<break>`, `<prosody>` (rate/pitch/volume), `<say-as>` (numbers/dates/spell), `<emphasis>`,
  `<phoneme>`, `<audio>`.
- **Voices** — tiered voice families per language/locale and gender:
  - **Standard** — basic, lowest cost.
  - **WaveNet** — high-quality neural voices.
  - **Neural2** — improved neural voices.
  - **Studio** — premium, narration-grade.
  - **Chirp 3 HD** — the latest large-model HD voices.
- **Audio config** — encoding/format (LINEAR16/WAV, MP3, OGG_OPUS), sample rate, and **speaking
  rate / pitch / volume gain** adjustments.
- **Synthesis modes** — standard `synthesize` (short text) and **long-audio synthesis**
  (asynchronous, long text → audio file in Cloud Storage).

## Configuration and sizing
- Pick the **voice tier** by quality vs cost (Standard for IVR/cost-sensitive, WaveNet/Neural2 for
  quality, Studio/Chirp 3 HD for narration). Choose the right **encoding** for the consumer
  (MP3/OGG for streaming, LINEAR16 for telephony/processing) and a matching sample rate. Use **SSML**
  for pronunciation/pacing control. Use **long-audio synthesis** for documents/articles.

## Security and IAM
- Synthesize with a dedicated **service account** scoped to the API and the output Cloud Storage
  bucket — avoid API keys for server use. Restrict access to generated audio (it may voice sensitive
  content), CMEK-encrypt output buckets, enable VPC-SC where required, and audit via Cloud Audit Logs.
  Be mindful of usage policies for synthetic voice content.

## Cost levers
- Cost is per **character synthesized**, and **varies sharply by voice tier** (Studio/Chirp 3 HD >
  Neural2/WaveNet > Standard). Levers: pick the lowest tier that meets quality needs, **cache**
  synthesized audio for repeated/static phrases instead of re-synthesizing, and trim/normalize text.
  SSML markup characters count toward billing in some cases — keep it lean.

## Scaling and limits
- Standard `synthesize` has a per-request input-size cap (~5,000 bytes); **long-audio synthesis**
  handles larger text asynchronously to Cloud Storage. Per-project QPS quotas apply (raise via the
  quotas page). Fully managed — no infrastructure to scale.

## Operating procedure
1. **Provision** — enable the Text-to-Speech API (`gcloud services enable texttospeech.googleapis.com`;
   Terraform `google_project_service`), create a least-privilege **service account**, and (for long
   audio) the output **Cloud Storage** bucket.
2. **Configure** — choose the **voice** (language/locale, gender, tier), audio **encoding** + sample
   rate, speaking rate/pitch/volume, author **SSML** as needed, and select standard vs **long-audio**
   synthesis.
3. **Secure** — scope the service account least-privilege, CMEK-encrypt the output bucket, restrict
   access to generated audio, and enable VPC-SC where required.
4. **Verify** — apply [[verify-by-running]]: enable confirmed via `gcloud services list`, then
   synthesize a representative sample (`gcloud ml speech` is ASR — use the Text-to-Speech REST/SDK or
   a `synthesize` call) and confirm a non-empty, **playable** audio artifact in the expected
   encoding/voice (inspect bytes/duration or play it) — capture the actual output.

## Inputs
Text/SSML content, target voice (language/locale, gender, tier), output encoding + sample rate,
prosody adjustments, standard-vs-long-audio + output Cloud Storage location, region/residency,
encryption requirements, and IAM scope.

## Output
A Text-to-Speech integration (chosen voice + audio config, SSML where needed, standard or long-audio
synthesis, output bucket with CMEK, scoped service account) plus verification of a playable audio
artifact in the expected encoding and voice.

## Notes
- Gotchas: cost varies sharply by voice tier — cache static/repeated audio instead of re-synthesizing;
  standard synthesize has a per-request size cap (use long-audio synthesis for big text); SSML must be
  well-formed or the call fails; encoding/sample-rate must match the downstream consumer; voice/tier
  availability varies by language. This is TTS — for the reverse (audio→text) use Speech-to-Text; the
  AWS equivalent is Amazon Polly.
- IaC/CLI: Terraform `google_project_service` (enable) + `google_service_account`/IAM and
  `google_storage_bucket` for long-audio output — there are no per-synthesis Terraform resources (the
  API is invoked at runtime). CLI/tooling: enable via `gcloud services enable`; the Text-to-Speech
  REST/SDK (`text:synthesize`, `projects.locations.synthesizeLongAudio`) for application use.
