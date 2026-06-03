---
name: aws-q-developer
description: Use when enabling, configuring, securing, or operating Amazon Q Developer — AWS's generative-AI coding assistant for IDEs, the CLI, the console, and the web, including inline code suggestions, the chat/agentic developer agents, code transformation/upgrades, and customizations trained on your private code (Amazon Q Developer). Loads the Q Developer knowledge: the subscription tiers (Free vs Pro) and IAM Identity Center licensing, IDE/CLI/console surfaces, inline suggestions and reference tracking, agentic capabilities (/dev feature development, /test, /doc, /review), code transformation (Java/.NET upgrades), customizations from private repos, security scanning, profiles, admin controls, data handling/opt-out, and verification by exercising suggestions and agents on real code. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect) wiring identity, licensing, and admin guardrails. Consumed by the Q Developer specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, q-developer, ai-ml, coding-assistant, generative-ai, devtools]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Q Developer

A managed **generative-AI coding assistant** that lives in your IDE, terminal/CLI, AWS console, and the
web. It provides **inline code suggestions**, a conversational **chat**, **agentic developers** that can
implement features/tests/docs across a workspace, **code transformation** for language/framework
upgrades, and **customizations** grounded in your private codebase. It is a managed product, not a
model you train or host — contrast SageMaker (custom training) and Bedrock (raw foundation models).

## Core concepts and components
- **Subscription tiers** — **Free** (limited) and **Pro** (per-user, higher limits, customizations,
  admin controls, IP indemnity). Pro is licensed and assigned via **IAM Identity Center**.
- **Surfaces** — IDE plugins (VS Code, JetBrains, Visual Studio, Eclipse), the **Q Developer CLI**
  (terminal completions + agentic chat), the AWS **console/chat**, and the web app.
- **Inline suggestions** — real-time completions with **reference tracking** that flags suggestions
  resembling open-source training data (license attribution).
- **Agentic capabilities** — slash-command agents: **/dev** (multi-file feature implementation),
  **/test** (unit-test generation), **/doc** (documentation), **/review** (code review), plus
  transform.
- **Code transformation** — automated **Java version upgrades** and **.NET porting** (Windows→Linux)
  across a project.
- **Customizations** (Pro) — index your **private repos** (via CodeConnections/S3) so suggestions match
  your internal APIs, libraries, and patterns.
- **Security scanning** — detects vulnerabilities in generated and existing code.

## Configuration and sizing
- No infrastructure to size. Sizing is **per-user licensing**: assign Pro subscriptions through Identity
  Center groups, scope **customizations** to the repos a team should learn from, and choose which
  surfaces/agents are enabled. Indexing for customizations consumes connector/S3 access, not your
  compute.

## Security and IAM
- License/admin access flows through **IAM Identity Center**; the Q Developer **profile** controls
  features, customizations, and data settings org-wide. Grant the customization role least-privilege
  access only to the source repos/buckets it indexes. Enable/disable **reference tracking** per policy.
  Configure **data handling** — Pro content is not used to train the base model and can be region-scoped;
  set opt-out and telemetry per compliance needs. Restrict who can manage profiles/customizations.

## Cost levers
- Cost is **per active Pro user/month** plus transformation/agent usage limits. Levers: keep most
  developers on Free where Pro features aren't needed, assign Pro only to teams using customizations or
  heavy agentic/transform workflows, reclaim unused Pro licenses, and batch large code-transformation
  jobs rather than leaving idle seats. Customization indexing/storage is incremental.

## Scaling and limits
- Per-user request/agent quotas differ by tier; Free has lower inline/chat limits. Customizations have
  repo-size and indexing limits and need periodic re-indexing. Code transformation has per-job size and
  language-version support boundaries. Surfaces require a supported IDE/CLI version.

## Operating procedure
1. **Provision** — enable Amazon Q Developer for the org, create the **Q Developer profile**, and (for
   Pro) connect it to **IAM Identity Center**; assign Pro subscriptions to the right groups.
2. **Configure** — enable the desired surfaces (IDE/CLI/console), turn on **customizations** by
   connecting private repos (CodeConnections/S3) and indexing, set reference-tracking and agent policy.
3. **Secure** — scope the customization role to only indexed sources, set data-handling/opt-out and
   region settings, and restrict profile/customization admin to the platform team.
4. **Verify** — apply [[verify-by-running]]: from a licensed IDE/CLI session, trigger an **inline
   suggestion** and a customization-aware completion on real code, run a **/dev** or **/test** agent
   task and a **security scan**, and (if in scope) start a **code transformation** — confirm each
   produces real output and capture it; check assignment via `aws q-developer` / Identity Center.

## Inputs
Org/Identity Center setup, which teams need Pro vs Free, target surfaces (IDE/CLI/console), private
repos to index for customizations, data-handling/region/opt-out requirements, agentic and
transformation use cases, license budget.

## Output
An Amazon Q Developer rollout — profile + Identity Center licensing, enabled surfaces, configured
customizations from private repos, reference-tracking/data-handling policy, and least-privilege admin —
plus verification that suggestions, an agent task, and a security scan return real results for a
licensed user.

## Notes
- Gotchas: Pro features (customizations, admin controls, IP indemnity, higher limits) require an Identity
  Center connection and per-user assignment — Free won't surface them; reference tracking is the
  attribution guardrail, don't disable it blindly; customizations need periodic re-indexing to reflect
  new code; agentic `/dev` changes are proposals — review before merging; code transformation supports a
  bounded set of language/framework versions; data-handling/opt-out must be set deliberately for
  compliance.
- IaC/CLI: Terraform coverage is **partial** — there is no dedicated Q Developer resource; manage
  licensing via `aws_ssoadmin_*` (Identity Center) assignments and connectors via
  `aws_codeconnections_connection`, and configure the profile/customizations through the console or
  `aws q-developer` CLI (`create-subscription`, `list-customizations`, `create-customization`) /
  `aws qbusiness` where applicable. No CloudFormation resource for the assistant itself; provision
  identity/connection prerequisites with CFN and finish in the console.
