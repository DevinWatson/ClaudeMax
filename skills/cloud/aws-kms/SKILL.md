---
name: aws-kms
description: Use when designing, provisioning, securing, or operating AWS Key Management Service — customer managed keys (CMKs) vs AWS managed vs AWS owned keys, symmetric vs asymmetric (RSA/ECC) and HMAC keys, key policies (the root authority on a key) plus IAM and grants, key usage (encrypt/decrypt, sign/verify, generate-data-key), envelope encryption and data keys, automatic + on-demand key rotation, aliases, multi-region keys (primary/replica), key stores (CloudHSM / external key store XKS), import of key material (BYOK), deletion with mandatory waiting period, and condition keys like kms:ViaService / EncryptionContext (AWS KMS). Loads the KMS knowledge: create and scope keys, wire envelope encryption and rotation, and verify encrypt/decrypt + access. Consumed by the KMS specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they design encryption.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, kms, encryption, keys, envelope-encryption, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Key Management Service (KMS)

AWS's managed service for creating and controlling **encryption keys**. It is the root of trust
for encryption across AWS: most services use KMS keys to encrypt data at rest, and applications
use it for envelope encryption, signing, and HMAC. KMS owns **keys** — secret *values* are
Secrets Manager; KMS commonly encrypts those secrets.

## Core concepts and components
- **Key types** — **customer managed keys (CMKs)** (you own policy/rotation/lifecycle), **AWS
  managed** keys (per-service, e.g. `aws/s3`), and **AWS owned** keys (invisible). Prefer CMKs
  where you need control/auditing.
- **Key specs** — **symmetric** (AES-256, the default for encrypt/decrypt + data keys),
  **asymmetric** (RSA/ECC for encrypt/decrypt or **sign/verify**), and **HMAC** keys.
- **Key policy** — the resource policy that is the **primary authority** on a key; IAM grants
  access only if the key policy delegates to IAM. **Grants** give temporary, scoped programmatic
  permissions (often used by AWS services on your behalf).
- **Envelope encryption** — `GenerateDataKey` returns a plaintext data key (used locally) + an
  encrypted copy; you store the ciphertext and the wrapped key, never the plaintext key. KMS
  encrypts/decrypts only the **data key**, not your bulk data.
- **Rotation** — **automatic** annual (and configurable) rotation of CMK backing material (old
  material retained to decrypt old ciphertext) and **on-demand** rotation.
- **Aliases**, **multi-region keys** (a primary + replicas sharing key material across regions),
  **custom key stores** (CloudHSM-backed or **external key store / XKS**), **imported key
  material (BYOK)**, and **EncryptionContext** (AAD bound into condition keys).

## Configuration and sizing
- Use **symmetric CMKs** for at-rest encryption and data keys; reserve asymmetric for cross-trust
  encrypt or signing. Enable **automatic rotation** on long-lived CMKs. Use **aliases** in code/
  IaC (not key IDs) so rotation/replacement is transparent. Use **multi-region keys** only when
  you genuinely need the same key material in multiple regions (e.g. global tables, DR).

## Security and IAM
- The **key policy is the root of access** — a key with a too-broad `kms:*` to the account root
  effectively delegates everything to IAM; scope it. Use **`kms:ViaService`** to allow use only
  through a specific service, and **`kms:EncryptionContext`** conditions to bind keys to a
  context. Separate **key administrators** from **key users**. Avoid granting `kms:Decrypt` on
  `Resource: *`. Grants should be least-privilege and retired when done.

## Cost levers
- Billed **per CMK per month** plus **per API request** (encrypt/decrypt/GenerateDataKey/etc.);
  asymmetric and HMAC requests cost more. Biggest levers: use **envelope encryption** (one KMS
  call per data key, then bulk-encrypt locally) instead of calling KMS per record; cache data
  keys where safe; consolidate keys where blast-radius/isolation allows. Multi-region replicas
  and custom key stores (CloudHSM) add cost.

## Scaling and limits
- Per-region **cryptographic request rate** quotas (shared across symmetric/asymmetric, raisable);
  exceeding them throttles encrypt/decrypt. Quotas on CMKs, grants per key, and aliases. Deletion
  enforces a **7–30 day waiting period** (cannot be immediate). Cross-region calls add latency.

## Operating procedure
1. **Provision** — create the CMK with the right spec + a least-privilege **key policy** and an
   **alias** via Terraform `aws_kms_key`/`aws_kms_alias` (or multi-region/replica resources) or
   `aws kms create-key`; enable rotation.
2. **Configure** — wire the key into the consuming service (S3/EBS/RDS/Secrets Manager/etc.) or
   into app envelope encryption (`GenerateDataKey`), set `ViaService`/`EncryptionContext`
   conditions, and add grants where services need them.
3. **Secure** — separate admin vs user permissions, scope decrypt, enable rotation + logging
   (CloudTrail records every KMS call), and avoid `Resource: *` decrypt.
4. **Verify** — apply [[verify-by-running]]: `aws kms encrypt` then `aws kms decrypt` with the
   alias (and matching EncryptionContext) and confirm round-trip plaintext, confirm an
   unauthorized principal is denied, and confirm `aws kms get-key-rotation-status` shows rotation
   enabled — capture the actual output.

## Inputs
What needs encrypting (services/apps), key spec (symmetric/asymmetric/HMAC), who administers vs
uses the key, single- vs multi-region need, rotation policy, EncryptionContext/ViaService
constraints, BYOK/HSM requirements, and compliance/audit needs.

## Output
The KMS configuration (CMKs with scoped key policies + aliases, rotation, grants, multi-region/
custom-key-store where needed, service/app wiring) as code, plus verification of an encrypt/
decrypt round-trip, denied unauthorized access, and rotation enabled.

## Notes
- Gotchas: the **key policy is authoritative** — locking yourself out (no admin in the policy) can
  orphan a key; key deletion has a **mandatory 7–30 day waiting period** and destroys all
  ciphertext encrypted under it — disable instead when unsure; **multi-region keys are not global
  replication of data**, only of key material, and primary/replica share material but have
  independent policies; **EncryptionContext must match exactly** on decrypt or it fails; AWS
  managed keys cannot have custom policies or manual rotation; cross-account use needs grants/key
  policy on the key **and** IAM on the caller; request-rate throttling is a common prod surprise.
- IaC/CLI: Terraform `aws_kms_key`, `aws_kms_alias`, `aws_kms_grant`, `aws_kms_key_policy`,
  `aws_kms_replica_key`, `aws_kms_external_key`. CLI `aws kms create-key`, `create-alias`,
  `enable-key-rotation`, `get-key-rotation-status`, `encrypt`, `decrypt`, `generate-data-key`,
  `create-grant`, `schedule-key-deletion`. CloudFormation `AWS::KMS::Key`, `AWS::KMS::Alias`,
  `AWS::KMS::ReplicaKey`.
