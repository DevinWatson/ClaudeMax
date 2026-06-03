---
name: aws-polly
description: Use when designing, provisioning, securing, or operating Amazon Polly — the managed text-to-speech service that turns text into lifelike spoken audio (Amazon Polly). Loads the Polly knowledge: the SynthesizeSpeech (synchronous, streamed audio) and StartSpeechSynthesisTask (asynchronous, large text → S3) APIs, voice engines (standard, neural/NTTS, long-form, and generative) and the catalog of voices/languages, output formats (MP3/OGG/PCM) and sample rates, SSML control (prosody, breaks, emphasis, say-as, phonemes), speech marks for timing/visemes/lip-sync, pronunciation lexicons (PLS) for custom pronunciations, IAM/KMS security, cost (per character, differing by engine) and quotas/TPS, and verification by synthesizing and inspecting audio. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Polly specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, polly, ai-ml, text-to-speech, speech-synthesis, ssml]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Polly

A managed **text-to-speech** service that converts text into **lifelike spoken audio** through API
calls — no models to host. You send text (or **SSML**), choose a **voice** and **engine**, and get an
audio stream or an S3 file back.

## Core concepts and components
- **Synthesis APIs** — **SynthesizeSpeech** (synchronous, returns a streamed audio buffer, for
  short/real-time text) and **StartSpeechSynthesisTask** (asynchronous, for **long text** → delivers
  the audio file to **S3**, with status polling/SNS).
- **Engines** — **standard**, **neural (NTTS)** (more natural), **long-form** (optimized for longer
  content), and **generative** (most expressive). Engine determines voice availability, quality, and
  price.
- **Voices & languages** — a catalog of named voices across many languages/locales, some bilingual;
  voice availability depends on the engine.
- **Output** — formats **MP3 / OGG (Vorbis/Opus) / PCM** and **JSON speech marks**; selectable **sample
  rate**.
- **SSML** — markup to control **prosody** (rate/pitch/volume), **breaks/pauses**, **emphasis**,
  **say-as** (numbers/dates/spell-out), and **phoneme** pronunciation; wrap text in `<speak>`.
- **Speech marks** — sentence/word/viseme/SSML timing metadata for **lip-sync**, highlighting, and
  captioning.
- **Lexicons (PLS)** — uploaded pronunciation lexicons that override how specific words/acronyms are
  spoken.

## Configuration and sizing
- There is nothing to provision/size — choose **engine** (quality vs cost), **voice/language**,
  **output format + sample rate**, and `TextType` (text vs SSML). Use **SynthesizeSpeech** for short
  real-time prompts and **StartSpeechSynthesisTask** for long documents (sync has a per-request
  character cap). Attach **lexicons** for domain pronunciations and request **speech marks** when you
  need timing.

## Security and IAM
- Gate with IAM (`polly:SynthesizeSpeech`, `polly:StartSpeechSynthesisTask`,
  `polly:*Lexicon`) and grant async tasks `s3:PutObject` on the output bucket (+ SNS if notifying).
  Encrypt the output bucket with **KMS** and lock it down (synthesized audio may contain sensitive
  content). Reach Polly via **VPC endpoints**; manage lexicon access as configuration.

## Cost levers
- Billed **per character** synthesized, with **different rates per engine** (standard < neural <
  long-form/generative); speech marks billed as requests. Levers: choose the lowest engine that meets
  quality, **cache/reuse** synthesized audio for repeated phrases instead of re-synthesizing, trim
  SSML-only overhead, and batch long content via async tasks. Avoid re-synthesizing static prompts.

## Scaling and limits
- Per-account **TPS quotas** and a **per-request character limit** for SynthesizeSpeech (use async
  tasks above it); lexicon size/count limits; async task concurrency limits. Quotas are raisable via
  support. Generative/long-form voices have narrower availability.

## Operating procedure
1. **Provision** — create supporting resources only as needed: an output S3 bucket for async tasks and
   (optional) a **pronunciation lexicon** (`aws polly put-lexicon`). Voices/engines need no
   provisioning.
2. **Configure** — choose engine/voice/language, output format + sample rate, `TextType` (SSML vs
   text), attach lexicons, and (async) set the S3 output prefix + optional SNS notification.
3. **Secure** — least-privilege `polly`/`s3:PutObject` IAM, KMS on the output bucket, locked bucket,
   VPC endpoints.
4. **Verify** — apply [[verify-by-running]]: synthesize a representative sample
   (`aws polly synthesize-speech --text "..." --voice-id ... --engine neural --output-format mp3
   out.mp3`) and confirm a non-empty, playable audio file of the expected format/voice; for async, run
   `start-speech-synthesis-task`, poll `get-speech-synthesis-task` until `completed`, and confirm the S3
   object — capture the actual output.

## Inputs
Voice + language, engine (standard/neural/long-form/generative), text vs SSML content, output format +
sample rate, sync vs async (text length), lexicon/pronunciation needs, speech-mark needs, output S3 +
KMS, throughput targets.

## Output
A Polly setup — the chosen voice/engine producing audio in the right format via sync or async synthesis,
with SSML/lexicons/speech marks as needed and least-privilege IAM/KMS on the output — plus verification
that synthesis produces correct, playable audio.

## Notes
- Gotchas: SynthesizeSpeech has a per-request character cap — use StartSpeechSynthesisTask for long
  text; engine choice changes voice availability AND price (generative/long-form cost more); SSML must
  be well-formed and `TextType=ssml`, or markup is read aloud literally; re-synthesizing static prompts
  wastes money — cache audio; lexicons must be applied per request; speech marks are a separate request
  type; generative voices are region-limited.
- IaC/CLI: Terraform `aws_polly_lexicon` (lexicons). Most Polly usage is runtime API/SDK, not IaC. CLI
  `aws polly synthesize-speech`, `start-speech-synthesis-task`, `get-speech-synthesis-task`,
  `describe-voices`, `put-lexicon`, `get-lexicon`, `list-lexicons`. There is no dedicated
  CloudFormation resource for synthesis — invoke at runtime; manage lexicons via CLI/SDK.
