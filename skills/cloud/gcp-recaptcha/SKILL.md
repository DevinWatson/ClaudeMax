---
name: gcp-recaptcha
description: Use when designing, provisioning, securing, or operating reCAPTCHA Enterprise — Google Cloud's bot-defense and fraud-prevention service that scores the risk of web/mobile interactions (reCAPTCHA Enterprise). Covers site keys (score-based / checkbox / invisible, web vs Android/iOS), the assessment API and risk score (0.0–1.0) with reason codes, action tokens and the create-assessment flow, account-defender and fraud-prevention/password-leak signals, WAF integration with Cloud Armor and reCAPTCHA WAF challenge pages, multi-factor (SMS) and the express keys, plus IAM, cost, and limits. Loads the reCAPTCHA knowledge: create site keys, run assessments, act on scores, and verify. Consumed by the reCAPTCHA specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when defending against bots/abuse (reCAPTCHA Enterprise).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, recaptcha, security, bot-defense, fraud-prevention, risk-score, waf]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# reCAPTCHA Enterprise

Google Cloud's **bot-defense and fraud-prevention** service. It evaluates web and mobile interactions
and returns a **risk score** so you can allow, challenge, or block — protecting logins, signups,
checkout, and form submissions from automated abuse and fraud.

## Core concepts and components
- **Site keys** — credentials bound to a platform and mode: **score-based** (frictionless, returns a
  risk score), **checkbox** ("I'm not a robot"), or **invisible**; **web** keys (domain-bound) and
  **Android/iOS** app keys (package/bundle-bound). **WAF keys** integrate with edge challenge.
- **Assessment / risk score** — the client gets a **token**; the backend calls **createAssessment**
  with the token + expected **action** and receives a **score `0.0`–`1.0`** (1.0 = likely human) plus
  **reason codes**. Your app decides thresholds per action.
- **Action token** — names the protected action (`login`, `checkout`) so scores are contextual; the
  token is single-use and short-lived.
- **Account Defender** — tracks account behavior to flag suspicious/abusive accounts across sessions.
- **Fraud Prevention** — payment-fraud risk for transactions; **password-leak detection** checks
  credentials against known breaches (privacy-preserving).
- **WAF integration** — pair reCAPTCHA **WAF keys** with **Cloud Armor** to serve **challenge pages**
  and enforce score-based rules at the edge, before traffic reaches the app.

## Configuration and sizing
- Use **score-based** keys for frictionless protection; add **checkbox/challenge** only for high-risk
  paths. Create a **distinct key per platform/domain/app**. Always call **createAssessment server-side**
  and key decisions on **action + score threshold** (tune per action). For edge enforcement, attach
  **WAF keys** to Cloud Armor. Never trust the client token without a backend assessment.

## Security and IAM
- Grant `roles/recaptchaenterprise.agent` to the backend service account that creates assessments;
  keep the **secret/API key** server-side. The risk score is **advisory** — combine with your own
  signals; never expose thresholds to the client. Validate the **token action** matches the protected
  action to prevent token replay across flows. Audit key usage and reason codes.

## Cost levers
- Billed per **assessment** with a monthly free tier; Fraud Prevention/Account Defender features and
  WAF assessments are priced separately. Levers: assess **only on protected actions** (not every page),
  reuse the right key type, and avoid redundant assessments per request.

## Scaling and limits
- Assessment is a high-throughput API subject to per-project **quotas** (assessments/min); tokens are
  **short-lived and single-use** (assess promptly). WAF challenge throughput scales with Cloud Armor.
  Score is **probabilistic** — design graceful fallback for low/ambiguous scores.

## Operating procedure
1. **Provision** — enable `recaptchaenterprise.googleapis.com`; create the **site key(s)** for each
   web domain / mobile app and mode (score/checkbox/invisible, or **WAF** key for edge); grant the
   backend service account `recaptchaenterprise.agent`.
2. **Configure** — embed the site key in the client to obtain a **token + action**; implement the
   server-side **createAssessment** call and the **score-threshold policy** per action; for edge
   defense, attach the **WAF key to Cloud Armor**; enable **Account Defender / Fraud Prevention** if
   needed. Manage keys via Terraform `google_recaptcha_enterprise_key`.
3. **Secure** — keep keys/assessment calls **server-side**, validate the **action** in the assessment,
   set per-action thresholds, and add fallback for ambiguous scores.
4. **Verify** — apply [[verify-by-running]]: submit a legitimate interaction and confirm
   **createAssessment returns a high score** (and is allowed), simulate/script an automated request and
   confirm it returns a **low score** (and is challenged/blocked), and confirm the assessment's
   **action and reason codes** are as expected; for WAF, confirm the **challenge page** serves. Capture
   the high-score allow and low-score deny.

## Inputs
The actions/flows to protect (login/signup/checkout/forms), platforms (web domains, Android/iOS apps),
desired friction (score vs checkbox), per-action score thresholds, whether to use Account Defender/
Fraud Prevention/WAF, and the backend service account.

## Output
Configured reCAPTCHA Enterprise site keys per platform/action with a server-side createAssessment flow
and per-action score-threshold policy (and optional WAF/Cloud Armor integration and Account Defender/
Fraud Prevention), plus verification that legitimate traffic scores high/allows and automated traffic
scores low/challenges.

## Notes
- Gotchas: **never decide solely on the client token** — always **createAssessment server-side**;
  validate the **action** to stop token replay; tokens are **single-use/short-lived**; the score is
  **probabilistic** (set thresholds + fallback, don't hard-block on a single low score); use the right
  **key type per platform** (web vs Android vs iOS vs WAF). 2nd consumer: the GCP role team wires bot/
  abuse defense posture, not just the specialist. It is bot defense, distinct from Cloud Armor's
  general WAF (they integrate).
- IaC/CLI: Terraform `google_recaptcha_enterprise_key` (web/android/ios/`waf_settings`) and Cloud Armor
  `google_compute_security_policy` rules referencing the WAF key. CLI/REST `gcloud recaptcha keys` and
  the `recaptchaenterprise.googleapis.com` `projects.assessments.create` API to run and verify.
