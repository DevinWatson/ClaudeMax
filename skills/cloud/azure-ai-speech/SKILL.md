---
name: azure-ai-speech
description: Use when designing, provisioning, securing, or operating Azure AI Speech — Microsoft Azure's managed speech service for speech-to-text, text-to-speech, speech translation, and speaker recognition (Azure AI Speech). Covers the Speech (Cognitive Services) resource and region/endpoint, real-time + batch speech-to-text (STT) and conversation transcription, text-to-speech (TTS) with neural voices and SSML, custom neural voice and custom speech models, speech translation, pronunciation assessment, keyword spotting, speaker recognition, the Speech SDK vs REST, single vs multi-service resources and tiers (F0/S0), keys vs Entra ID/managed identity, Private Link/VNet, and cost. Loads the Azure AI Speech knowledge: provision a resource, run STT/TTS, secure access, and verify. Consumed by the azure-ai-speech specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure AI Speech).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ai-speech, ai-ml, speech-to-text, text-to-speech, ssml, translation]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure AI Speech

Microsoft Azure's **managed speech service**: convert speech to text (STT), text to lifelike neural
speech (TTS), translate speech across languages, and recognize speakers — with custom voice/speech model
support, behind an Azure AI services Speech resource.

## Core concepts and components
- **Resource** — a `SpeechServices` single-service or **multi-service Azure AI services
  (`CognitiveServices`)** account, scoped to a **region** with an endpoint + key pair; region matters
  because custom models and endpoints are region-bound.
- **Speech-to-text (STT)** — **real-time** streaming recognition, **batch** transcription over stored
  audio, and **conversation transcription** (speaker diarization); supports phrase lists and **custom
  speech** models for domain vocabulary/accents.
- **Text-to-speech (TTS)** — **neural voices** with prosody/style control via **SSML**, plus **custom
  neural voice** (gated) for branded voices.
- **Speech translation** — real-time speech-in → translated text/speech-out across languages.
- **Speaker recognition & assessment** — speaker verification/identification, **pronunciation
  assessment**, and **keyword spotting**.
- **SDK vs REST** — the **Speech SDK** for streaming/real-time; **REST/batch APIs** for file-based STT
  and long-form TTS; custom models are trained in **Speech Studio**.

## Configuration and sizing
- Choose **single-** vs **multi-service** resource and a **region** that supports your features (custom
  voice/speech are region-specific). Pick **tier** (`F0` free vs `S0` standard). Select voices/locales;
  for domain accuracy train a **custom speech** model, for branded audio a **custom neural voice**
  (apply for gated access). Use **batch** for large offline transcription, streaming SDK for live.

## Security and IAM
- Prefer **Microsoft Entra ID + RBAC** (`Cognitive Services User` / Speech roles) with **managed
  identity** over keys; disable key auth where possible. Use **managed identity** for batch access to
  audio in **Blob storage**. Isolate with **Private Link** / `publicNetworkAccess=Disabled`, keep keys in
  **Key Vault**, and enable **CMK** if required. **Custom neural voice** is gated with Responsible-AI
  obligations (consent/disclosure).

## Cost levers
- Billed **per hour of audio** (STT) and **per character** (TTS), by tier; custom-model **endpoint
  hosting** bills hourly. Levers: use **F0** for dev, **batch** STT (cheaper/throughput) for offline,
  pick standard neural voices over hosted custom where possible, **delete idle custom endpoints**, and
  cache synthesized audio for repeated text.

## Scaling and limits
- **Concurrency/transaction limits per tier** (F0 very low) gate throughput; **audio length/file-size**
  and **TTS character** limits apply per request; custom-speech/voice **training data minimums** and
  **region availability** apply. Hosted custom endpoints have their own throughput/scale.

## Operating procedure
1. **Provision** — create the **Speech / Azure AI services account** in a feature-supporting region via
   Terraform `azurerm_cognitive_account` (`kind = "SpeechServices"` or `"CognitiveServices"`) (or
   Bicep/`az cognitiveservices account create`); for **custom neural voice** complete gated access first.
2. **Configure** — pick **voices/locales** and SSML for TTS, choose **real-time vs batch** STT, and
   (optional) train+deploy a **custom speech** or **custom voice** endpoint in Speech Studio.
3. **Secure** — use **Entra ID + managed identity** (incl. managed-identity to batch audio storage),
   disable key auth, set **Private Link** with `publicNetworkAccess=Disabled`, and enable **CMK** if
   required.
4. **Verify** — apply [[verify-by-running]]: confirm the resource (and any custom endpoint) is ready,
   then **run STT** on a sample clip and/or **synthesize TTS** from sample SSML (REST/`az rest` or the
   SDK) and confirm the transcript / audio is sensible. Capture the transcript text and/or synthesized
   audio result.

## Inputs
The speech task (real-time vs batch STT, TTS + voices/SSML, translation, speaker recognition,
pronunciation), languages/locales, custom model/voice needs, expected volume (tier), region, and the
networking/identity security requirements.

## Output
An Azure AI Speech setup: a Speech / Azure AI services account at the chosen tier and region with the
selected voices/features and any custom speech/voice endpoint — isolated by Private Link, Entra
ID/managed identity, and CMK — plus verification of a sensible STT transcript and/or TTS synthesis.

## Notes
- Gotchas: **region matters** — custom voice/speech and some features are region-specific; **F0
  concurrency is very low** (use S0); **custom neural voice is gated** with consent/disclosure
  obligations; **delete idle custom endpoints** (hourly hosting cost); audio length/file-size and TTS
  character limits apply per request. This owns the **managed Azure AI Speech service** (resource,
  STT/TTS/translation, custom models/endpoints, RBAC, scaling) — not the app-side voice-app/orchestration
  code that *calls* it. Often pairs with **azure-bot-service** (voice channels) and **azure-ai-language**
  (CLU). 2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud
  peers: AWS Transcribe + Polly, GCP Speech-to-Text + Text-to-Speech.
- IaC/CLI: Terraform `azurerm_cognitive_account` (`kind = "SpeechServices"` / `"CognitiveServices"`)
  (custom models via Speech Studio/REST); Bicep/ARM `Microsoft.CognitiveServices/accounts`. CLI
  `az cognitiveservices account create`; verify via the **Speech REST/SDK** (STT recognition or TTS
  synthesis) using `az rest`, curl, or the Speech SDK with an Entra token or key.
