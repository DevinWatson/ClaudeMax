---
name: gcp-cloud-kms
description: Use when designing, provisioning, securing, or operating Cloud KMS — Google Cloud's managed key management service for creating, using, rotating, and destroying cryptographic keys (Cloud KMS). Covers key rings, keys (CryptoKey) and CryptoKey versions, purposes (symmetric encrypt/decrypt, asymmetric sign/decrypt, MAC), protection levels (software, HSM via Cloud HSM, external via EKM/Cloud EKM), automatic and manual rotation, key state and version lifecycle (enable/disable/destroy with scheduled-destroy delay), CMEK (customer-managed encryption keys) wiring into other GCP services, IAM separation (key admin vs encrypter/decrypter), Autokey, location/residency, plus cost and limits. Loads the Cloud KMS knowledge: design key rings/keys, choose protection level, set rotation, grant least-privilege crypto IAM, wire CMEK, and verify encrypt/decrypt. Consumed by the Cloud KMS specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when wiring encryption-at-rest (Cloud KMS).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-kms, security, encryption, kms, cmek, hsm]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud KMS

Google Cloud's managed **key management service**: create, use, rotate, and destroy cryptographic keys, and
wire them as **CMEK** (customer-managed encryption keys) into other GCP services so you control the
encryption key for your data at rest. It is the root of GCP's encryption-control surface.

## Core concepts and components
- **Key ring** — a logical, **location-bound** container for keys (a key ring's location is permanent).
- **Key (CryptoKey)** — a named key with a **purpose**: `ENCRYPT_DECRYPT` (symmetric), `ASYMMETRIC_SIGN`,
  `ASYMMETRIC_DECRYPT`, or `MAC`.
- **CryptoKey version** — the actual key material; a key has one **primary** version (used for new encrypt)
  plus older versions retained to decrypt prior ciphertext. Versions have **state**: enabled, disabled,
  scheduled-for-destruction, destroyed.
- **Protection level** — `SOFTWARE`, `HSM` (FIPS 140-2 L3 via **Cloud HSM**), or `EXTERNAL`/`EXTERNAL_VPC`
  (key in a third-party manager via **Cloud EKM**).
- **Rotation** — **automatic** rotation period (creates a new primary version on schedule) or **manual**;
  old versions stay enabled to decrypt existing data.
- **CMEK** — point a service (Cloud Storage, BigQuery, Compute disks, Cloud SQL, Pub/Sub, etc.) at a KMS key
  so its data is encrypted with **your** key; the service's **service agent** must hold
  `roles/cloudkms.cryptoKeyEncrypterDecrypter`.
- **Autokey** — automates key-ring/key creation per resource for CMEK at scale.

## Configuration and sizing
- Group keys into **key rings per location/purpose/environment**; put the key ring in the **same region** as
  the data it protects (location is immutable). Choose **HSM** for compliance-grade key custody, **EKM** for
  external key control/residency. Enable **automatic rotation** (e.g. 90 days) for symmetric keys; never
  destroy old versions while ciphertext encrypted under them still exists.

## Security and IAM
- Enforce **separation of duties**: `roles/cloudkms.admin` (manage keys, no crypto ops) vs
  `roles/cloudkms.cryptoKeyEncrypterDecrypter` / `...Encrypter` / `...Decrypter` (use, not manage). Grant at
  the **key/key-ring** level, not project-wide. Use **scheduled-destroy** (24h+ delay) so a destroy is
  recoverable. CMEK requires granting the consuming service's **service agent** the encrypter/decrypter role.

## Cost levers
- Billed per **active key version per month** plus **per cryptographic operation**; **HSM** and **EKM** keys
  cost more than software. Levers: avoid orphaned enabled versions (each bills monthly), batch/wrap with
  envelope encryption rather than calling KMS per object, and reserve HSM/EKM for data that needs it.

## Scaling and limits
- High operation QPS is supported but **rate-limited per key/location** — use **envelope encryption** (DEK
  wrapped by a KMS KEK) for high-volume data rather than encrypting each object directly with KMS. Versions
  per key, keys per key ring, and key rings per location are bounded. Keys are **regional/multi-regional** —
  honor residency.

## Operating procedure
1. **Provision** — enable the Cloud KMS API; create a **key ring** in the correct location and a **key** with
   the right **purpose** and **protection level** (software/HSM/EKM).
2. **Configure** — set **rotation** (automatic period for symmetric keys), create the initial version, and
   **wire CMEK** into the consuming service (grant its service agent encrypter/decrypter and point the
   resource at the key).
3. **Secure** — apply **separation-of-duties** IAM at the key/key-ring level (admin vs crypto-user), enable
   **scheduled-destroy** delay, and keep old versions enabled while their ciphertext lives.
4. **Verify** — apply [[verify-by-running]]: encrypt then decrypt a test payload
   (`gcloud kms encrypt`/`gcloud kms decrypt`) and confirm round-trip, confirm **rotation** created a new
   primary version (`gcloud kms keys versions list`), and confirm the **CMEK-protected resource** reads/writes
   (and that revoking the service agent's role blocks it) — capture the encrypt/decrypt round-trip and the
   version list.

## Inputs
Data to protect and its location/residency, key purpose (symmetric/asymmetric/MAC), required protection level
(software/HSM/EKM), rotation policy, which services need CMEK, the IAM separation-of-duties model, and cost/
operation-rate expectations.

## Output
A Cloud KMS configuration (key rings/keys with the right purpose and protection level, rotation policy, CMEK
wiring with service-agent grants, scheduled-destroy) with separation-of-duties IAM, plus verification of an
encrypt/decrypt round-trip and rotation.

## Notes
- Gotchas: a **key ring's location is permanent** (choose carefully); **destroying a key version is
  irreversible** once the scheduled-destroy delay elapses and breaks all ciphertext under it — keep old
  versions enabled; CMEK fails silently if the consuming service's **service agent** lacks encrypter/decrypter
  (resource creation errors); **per-key rate limits** make direct per-object KMS encryption a scaling trap —
  use envelope encryption; HSM/EKM cost and latency differ from software; rotating a key does **not**
  re-encrypt existing data.
- IaC/CLI: Terraform `google_kms_key_ring`, `google_kms_crypto_key` (with `rotation_period`,
  `version_template.protection_level`), `google_kms_crypto_key_version`,
  `google_kms_crypto_key_iam_member` (service-agent CMEK grant), `google_kms_key_ring_import_job`, and the
  service-side `kms_key_name`/`encryption` blocks. CLI `gcloud kms keyrings/keys/keys versions`,
  `gcloud kms encrypt|decrypt` to verify round-trip.
