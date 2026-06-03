---
name: aws-lex
description: Use when designing, provisioning, securing, or operating Amazon Lex (V2) — the managed conversational-AI service for building text and voice chatbots (Amazon Lex). Loads the Lex knowledge: the V2 resource model (bot → bot locale → intents → slots/slot types → bot versions + aliases), sample utterances and natural-language understanding, slot elicitation/prompts/confirmation, fulfillment and dialog code hooks via Lambda, built-in and custom slot types, session management and context, conversation logs to CloudWatch/S3, voice via Polly + ASR for telephony/Connect integration, channel integrations, streaming conversations, the RuntimeV2 RecognizeText/RecognizeUtterance APIs, IAM/KMS security, cost (per text/speech request) and quotas, and verification by running a conversation. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Lex specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, lex, ai-ml, chatbot, conversational-ai, nlu]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Lex (V2)

A managed **conversational-AI** service for building **text and voice chatbots** with
natural-language understanding (NLU) and automatic speech recognition, deployed to channels and
contact centers, with **no ML model to build**.

## Core concepts and components
- **Bot → locale → intents → slots** — a **bot** contains one or more **bot locales** (language +
  voice); each locale has **intents** (what the user wants) defined by **sample utterances**; intents
  collect **slots** (parameters) typed by **slot types** (built-in like `AMAZON.Date`/`AMAZON.Number`
  or **custom** value lists with synonyms).
- **Dialog management** — slot **elicitation prompts**, **confirmation** prompts, value resolution, and
  **session attributes/context** carry state across turns; default fallback intent handles no-match.
- **Lambda hooks** — a **dialog code hook** (validate/branch mid-conversation) and a **fulfillment code
  hook** (execute the business action) backed by **Lambda**.
- **Versions + aliases** — immutable **bot versions** and movable **aliases** (each alias points a stage
  like `prod` at a version and binds the Lambda) for safe promotion.
- **Channels + voice** — text via **RecognizeText**, speech via **RecognizeUtterance**/streaming using
  **ASR + Polly**; integrate with **Amazon Connect**, messaging channels, and the web.
- **Logging** — **conversation logs** (text to CloudWatch Logs, audio to S3) for analytics and tuning.

## Configuration and sizing
- Model intents with **enough varied sample utterances**, define slots with prompts/required flags, set
  confidence thresholds and the fallback intent, and wire Lambda hooks. Create a **version** and point an
  **alias** at it per stage. Nothing to size — throughput is governed by runtime request quotas; Lambda
  concurrency sizes fulfillment.

## Security and IAM
- Gate build-time with IAM (`lex:*` scoped to bots/aliases) and runtime with `lex:RecognizeText` /
  `lex:RecognizeUtterance`; the bot assumes a **service role** to call Lambda/Polly/Comprehend. Encrypt
  conversation-log audio (S3) and data with **KMS**, scope the Lambda's permissions tightly, and treat
  utterances/slots (which may carry PII) as sensitive in logs.

## Cost levers
- Bills **per request** (separate rates for **text** and **speech** requests; streaming differs).
  Levers: prefer text over speech where possible, keep conversations short, avoid unnecessary re-prompts,
  and sample (not always store) conversation logs. Lambda fulfillment is billed separately.

## Scaling and limits
- Per-account **runtime TPS** quotas and build-time limits on intents/slots/slot-type values per bot;
  language/voice support per locale. Aliases enable blue/green promotion. Raise quotas via Service
  Quotas/support.

## Operating procedure
1. **Provision** — create the bot, **bot locale(s)**, **intents**, **slot types**, the bot **service
   role**, and the fulfillment **Lambda**; via Terraform `aws_lexv2models_bot` /
   `aws_lexv2models_bot_locale` / `aws_lexv2models_intent` / `aws_lexv2models_slot` /
   `aws_lexv2models_slot_type` / `aws_lexv2models_bot_version` / `..._bot_alias`, or
   `aws lexv2-models create-*`.
2. **Configure** — author sample utterances, slot prompts/confirmation, fallback intent, dialog +
   fulfillment Lambda hooks, conversation logs, and **build** the locale; create a version + alias per
   stage.
3. **Secure** — least-privilege build/runtime IAM, a tightly scoped bot service role, KMS on log audio,
   and PII-aware logging.
4. **Verify** — apply [[verify-by-running]]: build the locale, then run a representative conversation
   (`aws lexv2-runtime recognize-text --bot-id ... --bot-alias-id ... --locale-id ... --session-id ...
   --text "..."`) and confirm the right intent is recognized, slots are elicited/filled, and fulfillment
   responds correctly — capture the actual dialog output.

## Inputs
Channels (text/voice/Connect), intents + sample utterances, slots + slot types (built-in/custom),
prompts/confirmation/fallback, dialog + fulfillment Lambda, locales/languages/voices, conversation-log
needs (PII/KMS), promotion model (versions/aliases/stages), throughput targets.

## Output
A Lex V2 bot — modeled intents/slots with adequate utterances, dialog + fulfillment Lambda hooks, built
locale(s), versioned and aliased per stage, conversation logging, and least-privilege IAM/KMS — plus
verification that a representative conversation recognizes intents and fulfills correctly.

## Notes
- Gotchas: you must **build** a locale after model changes before runtime sees them; runtime calls need
  the **alias** (not the draft) for prod; too-few/overlapping sample utterances cause misrecognition;
  conversation-log audio in S3 and utterances/slots can contain PII — encrypt and scope; the bot service
  role must allow invoking your Lambda or fulfillment silently fails; V1 (classic) and V2 APIs differ —
  prefer V2.
- IaC/CLI: Terraform `aws_lexv2models_*` (bot/bot_locale/intent/slot/slot_type/bot_version/bot_alias) —
  coverage of newer features can lag, with CLI/SDK as fallback. CloudFormation `AWS::Lex::Bot`,
  `AWS::Lex::BotAlias`, `AWS::Lex::BotVersion`, `AWS::Lex::ResourcePolicy`. CLI `aws lexv2-models
  create-bot` / `create-intent` / `build-bot-locale` / `create-bot-version` / `create-bot-alias`;
  runtime `aws lexv2-runtime recognize-text` / `recognize-utterance`.
