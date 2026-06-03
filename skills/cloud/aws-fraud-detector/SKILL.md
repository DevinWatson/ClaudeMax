---
name: aws-fraud-detector
description: Use when designing, provisioning, securing, or operating Amazon Fraud Detector — the managed ML service for detecting potentially fraudulent online activity (Amazon Fraud Detector). Loads the Fraud Detector knowledge: event types with their variables/entities/labels, model types (ONLINE_FRAUD_INSIGHTS, TRANSACTION_FRAUD_INSIGHTS, ACCOUNT_TAKEOVER_INSIGHTS) trained on your historical event data in S3, model versions and training/validation metrics (AUC, score distribution), detectors and detector versions composing model scores with rules, the rule language and outcomes, GetEventPrediction real-time scoring (plus batch predictions to S3), variable types and enrichments (IP/email/phone risk), event ingestion / stored events, IAM/KMS security, cost (training + predictions), quotas, and verification by scoring a sample event. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Fraud Detector specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, fraud-detector, ai-ml, fraud-detection, risk, anti-fraud]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Fraud Detector

A managed **fraud-detection** service that trains ML models on your historical event data and combines
their scores with **business rules** to flag potentially fraudulent online activity in real time, with
**no ML model code to write**.

## Core concepts and components
- **Event types** — define the activity you score: its **variables** (e.g., email, IP, amount), the
  **entities** involved (customer/account), and the **labels** (fraud/legit) used for training.
- **Models + model types** — trained on **historical events in S3**:
  **ONLINE_FRAUD_INSIGHTS** (low-volume/cold-start with enrichments), **TRANSACTION_FRAUD_INSIGHTS**
  (transaction history), and **ACCOUNT_TAKEOVER_INSIGHTS** (login/ATO). Produce a **model version** with
  **training metrics** (AUC, score distribution, variable importance).
- **Detectors + rules** — a **detector** (with **detector versions**) composes one or more **model
  scores** plus a **rule language** (expressions over variables and model scores) that map to
  **outcomes** (approve/review/block). Rules are evaluated by a configurable execution mode
  (first-matched vs all-matched).
- **Variables + enrichments** — typed **variables** (with mapped data types) and built-in
  **enrichments** (IP geolocation, email/phone risk) improve signal.
- **Prediction** — **GetEventPrediction** scores a single event in real time; **batch predictions**
  score events in bulk to S3. **Stored events** feed continuous learning.

## Configuration and sizing
- Define the **event type** (variables/entities/labels), import labeled historical events to S3, train a
  **model** of the right type, publish a **model version**, then build a **detector** that combines the
  model score with **rules → outcomes** and publish a **detector version**. Nothing to size — throughput
  scales with prediction request quotas.

## Security and IAM
- Gate with IAM (`frauddetector:*`) plus a **role** granting S3 read for training data. Encrypt training
  data and stored events with **KMS** and lock down S3. Event data (PII: email, IP, payment signals) is
  **sensitive** — restrict who can train models and read predictions; confirm compliance.

## Cost levers
- Bills on **model training-hours/compute** and **predictions** (real-time and batch, priced by model
  type/volume). Levers: train only when data materially changes, prune unused model versions/detectors,
  use **rules-only** detectors (no model) for simple cases, and batch where real-time is unnecessary.

## Scaling and limits
- Per-account limits on event types, models, model versions, and detectors; minimum labeled-event counts
  and fraud-rate requirements for training. Real-time prediction TPS quotas apply. Raise via Service
  Quotas/support.

## Operating procedure
1. **Provision** — create the **event type** (variables/entities/labels), variables/enrichments, and the
   training **IAM role**; via Terraform `aws_frauddetector_*` (entity_type / label / variable /
   event_type / detector / outcome / rule / model) where available, or `aws frauddetector create/put-*`.
2. **Configure** — import labeled events to S3, train a **model** + publish a **model version**, author
   **rules** and **outcomes**, build a **detector** + publish a **detector version**.
3. **Secure** — least-privilege IAM + training role, KMS on data/stored events, locked S3, and PII-aware
   access controls.
4. **Verify** — apply [[verify-by-running]]: after the detector version is **ACTIVE**, score a
   representative event (`aws frauddetector get-event-prediction --detector-id ... --detector-version-id
   ... --event-type-name ... --event-variables ...`) and confirm a sensible model score and the expected
   **outcome** from the matched rule; check model-version metrics (AUC) — capture the actual output.

## Inputs
Event type + variables/entities/labels, labeled historical events in S3, chosen model type
(online/transaction/ATO), rules → outcomes + execution mode, real-time vs batch scoring, security/
compliance (PII/KMS), prediction throughput targets.

## Output
A Fraud Detector setup — an event type with variables/enrichments, a trained model version with
acceptable AUC, a detector version composing model score + rules → outcomes, and least-privilege
IAM/KMS — plus verification that a sample event scores and resolves to the expected outcome.

## Notes
- Gotchas: training needs a **minimum count of labeled events** and a non-trivial fraud rate or it fails;
  rules execute by mode (first-matched stops at the first hit — order matters); event data is PII-heavy —
  encrypt and scope; an inactive detector/model version won't score; enrichments improve cold-start
  models; batch predictions need the role's S3 access.
- IaC/CLI: Terraform `aws_frauddetector_entity_type` / `_label` / `_variable` / `_event_type` /
  `_detector` / `_outcome` / `_rule` (coverage of models/training can lag — use CLI/SDK as fallback).
  CloudFormation `AWS::FraudDetector::Detector`, `AWS::FraudDetector::EntityType`,
  `AWS::FraudDetector::EventType`, `AWS::FraudDetector::Label`, `AWS::FraudDetector::Outcome`,
  `AWS::FraudDetector::Variable`. CLI `aws frauddetector put-event-type` / `create-model` /
  `create-model-version` / `train-model` / `create-detector-version` / `create-rule` /
  `get-event-prediction` / `create-batch-prediction-job`.
