---
name: aws-secrets-manager
description: Use when designing, provisioning, securing, or operating AWS Secrets Manager — storing secrets (database credentials, API keys, OAuth tokens, arbitrary key/value or binary), KMS encryption of secret values, automatic rotation via Lambda rotation functions (including managed rotation for RDS/Aurora/Redshift/DocumentDB), secret versions and staging labels (AWSCURRENT/AWSPENDING/AWSPREVIOUS), resource policies and cross-account access, replication of secrets to other regions, retrieval (GetSecretValue, the AWS-managed cache/agent, and the Lambda extension), and recovery windows on deletion (AWS Secrets Manager). Loads the Secrets Manager knowledge: store secrets, wire rotation and cross-account/region access, and verify retrieval + rotation. Consumed by the Secrets Manager specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they manage secrets.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, secrets-manager, secrets, rotation, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Secrets Manager

AWS's managed service for the **lifecycle of secret values** — storing, encrypting, retrieving,
rotating, and replicating credentials, API keys, and tokens. It owns the secret *value and its
rotation*; KMS encrypts those values and IAM controls access. For plain/non-rotating config use
SSM Parameter Store; for credentials that must rotate, Secrets Manager is the fit.

## Core concepts and components
- **Secret** — a named resource holding an encrypted **value** (JSON key/value, plaintext string,
  or binary) plus metadata, tags, and an optional resource policy.
- **KMS encryption** — every secret value is encrypted with a KMS key (the AWS managed
  `aws/secretsmanager` key by default, or a CMK you control for cross-account/auditing).
- **Versions + staging labels** — each value is a **version**; labels track which is live:
  **AWSCURRENT** (active), **AWSPENDING** (being rotated in), **AWSPREVIOUS** (last good).
- **Rotation** — automatic on a schedule via a **Lambda rotation function** implementing
  create/set/test/finish secret steps; **managed rotation** exists for RDS/Aurora/Redshift/
  DocumentDB. Rotation swaps AWSPENDING → AWSCURRENT atomically.
- **Access** — IAM identity policies + per-secret **resource policies** (enabling cross-account
  retrieval); condition keys can pin `secretsmanager:VersionStage`.
- **Replication** — replicate a secret to other regions (read replicas; the primary owns
  rotation) for multi-region apps/DR.
- **Retrieval** — `GetSecretValue`, the **Secrets Manager caching library**, and the **Lambda
  extension / agent sidecar** that caches and serves secrets locally to reduce calls.

## Configuration and sizing
- Store related fields as **one JSON secret** rather than many tiny secrets where they rotate
  together. Use a **CMK** when you need cross-account access or independent audit. Enable
  **rotation** for database/credential secrets; choose managed rotation when the engine supports
  it, else a custom Lambda. Cache reads (extension/library) instead of calling per request.

## Security and IAM
- Scope `secretsmanager:GetSecretValue` to **specific secret ARNs** (and optionally
  `VersionStage`); never grant `*`. Cross-account access needs the **resource policy on the
  secret** *and* the CMK key policy allowing the external principal. Restrict who can
  `PutSecretValue`/`DeleteSecret`/`UpdateSecret`. The rotation Lambda needs least-privilege
  access to the secret and the target system. CloudTrail logs every retrieval — monitor for
  anomalies. Never log retrieved secret values.

## Cost levers
- Billed **per secret per month** plus **per 10,000 API calls**. Biggest levers: **cache reads**
  (Lambda extension / caching library) to slash GetSecretValue calls; consolidate co-rotating
  fields into one secret instead of many; clean up unused secrets (mind the recovery window);
  replicas are billed as additional secrets per region. Rotation Lambda invocations add minor
  cost.

## Scaling and limits
- `GetSecretValue` is high-throughput but **rate-limited** (caching avoids throttling at scale).
  Secret value size cap (~64 KB). Quotas on secrets per account/region and versions retained
  (mostly soft/raisable). Deletion enforces a **recovery window (7–30 days, default 30)** before
  permanent removal — `--force-delete-without-recovery` skips it (irreversible).

## Operating procedure
1. **Provision** — create the secret (value + KMS CMK + tags) via Terraform
   `aws_secretsmanager_secret`/`aws_secretsmanager_secret_version` or `aws secretsmanager
   create-secret`; add a resource policy for cross-account and replicas for multi-region.
2. **Configure** — attach rotation (managed or a Lambda rotation function) with a schedule, and
   wire consumers to read via the caching library/extension using the secret ARN (not a copied
   value).
3. **Secure** — scope GetSecretValue to the ARN, set the CMK key policy for any cross-account
   principals, restrict write/delete, and confirm no secret values are logged.
4. **Verify** — apply [[verify-by-running]]: `aws secretsmanager get-secret-value` returns the
   expected AWSCURRENT value, trigger `rotate-secret` and confirm a new AWSCURRENT version is
   staged and the target system accepts the new credential, and confirm an unauthorized principal
   is denied — capture the actual output.

## Inputs
The secrets to manage (type, who consumes them), KMS key choice, rotation requirement and target
system, cross-account/region needs, retrieval pattern (direct vs cached), access boundaries, and
deletion/recovery policy.

## Output
The Secrets Manager configuration (secrets with CMK encryption, rotation schedules + rotation
Lambda/managed rotation, resource policies, replicas, consumer wiring) as code, plus verification
that retrieval returns the current value, rotation produces a working new version, and access is
scoped.

## Notes
- Gotchas: deletion is **not immediate** — a 7–30 day recovery window applies unless you force-
  delete (irreversible); **rotation requires network reachability** from the rotation Lambda to
  the target DB (VPC config / SG) — a common silent failure leaving AWSPENDING stuck; cross-
  account retrieval needs **both** the secret resource policy **and** the CMK key policy; rotating
  a secret while consumers hold a cached old value briefly breaks them unless they re-fetch on
  auth failure; the AWS managed key can't be used for cross-account (use a CMK); Parameter Store
  `SecureString` is cheaper for non-rotating config — don't default everything to Secrets Manager.
- IaC/CLI: Terraform `aws_secretsmanager_secret`, `aws_secretsmanager_secret_version`,
  `aws_secretsmanager_secret_rotation`, `aws_secretsmanager_secret_policy`. CLI `aws
  secretsmanager create-secret`, `get-secret-value`, `put-secret-value`, `rotate-secret`,
  `replicate-secret-to-regions`, `delete-secret`, `restore-secret`. CloudFormation
  `AWS::SecretsManager::Secret`, `AWS::SecretsManager::RotationSchedule`,
  `AWS::SecretsManager::ResourcePolicy`.
