---
name: aws-personalize
description: Use when designing, provisioning, securing, or operating Amazon Personalize — the managed real-time recommendation/personalization service (Amazon Personalize). Loads the Personalize knowledge: the dataset group with Interactions/Users/Items datasets and schemas, recipes (user-personalization, similar-items, personalized-ranking, trending-now, plus ECOMMERCE/VIDEO_ON_DEMAND domain recommenders), solutions + solution versions (training) and HPO, campaigns (real-time endpoints with provisioned minimum TPS) vs batch inference jobs, event trackers for real-time ingestion, filters for business rules, the runtime recommendation APIs, metrics, IAM/KMS security, cost (training-hours + campaign TPS-hours + batch), quotas, the maintenance-mode/limited-new-onboarding status, and verification by requesting recommendations. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Personalize specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, personalize, ai-ml, recommendations, recommender, personalization]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Personalize

A managed **recommendation/personalization** service that trains and serves recommenders from your
interaction/user/item data, with **no ML model code to write**, exposing real-time and batch inference.

> Status note: Amazon Personalize is in **limited new onboarding / maintenance** for some accounts and
> features. Confirm availability for the target account/region before designing around it, and flag this
> to consumers; for new builds, evaluate Bedrock/SageMaker-based alternatives where appropriate.

## Core concepts and components
- **Dataset group + datasets** — a **dataset group** holds up to three datasets:
  **Interactions** (events: user–item–timestamp, the core signal), **Users**, and **Items**, each with a
  declared **schema** (Avro-style).
- **Recipes** — algorithms: **USER_PERSONALIZATION** (personalized recs), **SIMILAR_ITEMS**,
  **PERSONALIZED_RANKING** (re-rank a candidate list), **trending-now**, **next-best-action**, plus
  **domain recommenders** for **ECOMMERCE** and **VIDEO_ON_DEMAND** (pre-tuned use cases).
- **Solution + solution version** — a **solution** binds a recipe to a dataset group;
  **training** produces a **solution version**; supports **HPO** (hyperparameter optimization).
- **Serving** — **campaigns** provide **real-time** inference endpoints (provisioned **minimum TPS**,
  billed while live) and **batch inference jobs** produce recommendations in bulk to S3.
- **Real-time data** — an **event tracker** ingests live events (`PutEvents`) so recommendations
  reflect recent behavior without full retraining.
- **Business rules** — **filters** apply include/exclude logic (e.g., exclude purchased items) at
  inference; **metrics** (coverage, precision, MRR) evaluate solution versions.

## Configuration and sizing
- Define schemas, import historical **Interactions** (plus Users/Items), pick a **recipe** or domain
  recommender, train a **solution version** (optionally HPO), then create a **campaign** sized by
  **minimum provisioned TPS** (it bills continuously) or use **batch jobs**. Add an **event tracker**
  for freshness and **filters** for rules.

## Security and IAM
- Gate with IAM (`personalize:*`) plus a **role** granting S3 read for dataset import and
  `personalize:PutEvents` for the event tracker. Encrypt training data/artifacts with **KMS** and lock
  down S3. Interaction/user data is **PII-adjacent** — restrict access and confirm consent/compliance.

## Cost levers
- Bills on **data ingestion/training-hours**, **campaign TPS-hours** (continuous while a campaign is
  live, even idle), and **batch inference**. Levers: **delete idle campaigns** and prefer **batch** for
  non-real-time use, right-size minimum TPS, retrain on a sensible cadence (not constantly), and clean up
  old solution versions/dataset groups.

## Scaling and limits
- Campaign throughput scales with **provisioned minimum TPS** (auto-scales above it); per-account limits
  on dataset groups, solutions, and campaigns; dataset size and minimum-interaction-count requirements
  for training. Raise quotas via Service Quotas/support.

## Operating procedure
1. **Provision** — create the **dataset group**, datasets + **schemas**, and the import **IAM role**;
   via Terraform (`aws_personalize_*` resources where available — coverage is partial), or
   `aws personalize create-*`.
2. **Configure** — import data, choose a recipe/domain recommender, train a **solution version**
   (optional HPO), create a **campaign** (min TPS) or **batch job**, add an **event tracker** and
   **filters**.
3. **Secure** — least-privilege IAM + import role, KMS on data, locked S3, and PII-aware access controls.
4. **Verify** — apply [[verify-by-running]]: after training succeeds and the campaign is **ACTIVE**,
   request recommendations (`aws personalize-runtime get-recommendations --campaign-arn ...
   --user-id ...` or `get-personalized-ranking`) and confirm a sensible, filter-respecting ranked item
   list; check solution-version **metrics** — capture the actual output.

## Inputs
Interaction/user/item data + schemas, use case → recipe / domain recommender (ECOMMERCE / VOD), serving
mode (real-time campaign min-TPS vs batch), real-time event ingestion need, business-rule filters,
security/compliance (PII/KMS), throughput + retrain cadence, account/region availability of the service.

## Output
A Personalize setup — a dataset group with schemas and imported data, a trained solution version on the
right recipe, a sized campaign and/or batch jobs, an event tracker and filters, and least-privilege
IAM/KMS — plus verification that recommendations are sensible and rule-respecting.

## Notes
- Gotchas: campaigns bill continuously while ACTIVE even with no traffic — delete idle ones; the service
  is in **limited new onboarding/maintenance** for some accounts — confirm availability first; training
  needs a minimum volume of interactions or quality suffers; schema mistakes force re-import; event
  tracker freshness is not a substitute for periodic retraining; filters must be created before they can
  be applied at inference.
- IaC/CLI: Terraform `aws_personalize_*` coverage is **partial** — use CLI/SDK as the primary/fallback
  path for dataset groups, solutions, campaigns, and event trackers. CloudFormation has limited
  Personalize support. CLI `aws personalize create-dataset-group` / `create-schema` / `create-dataset` /
  `create-dataset-import-job` / `create-solution` / `create-solution-version` / `create-campaign` /
  `create-event-tracker` / `create-filter` / `create-batch-inference-job`; runtime
  `aws personalize-runtime get-recommendations` / `get-personalized-ranking`.
