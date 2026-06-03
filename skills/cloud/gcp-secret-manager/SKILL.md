---
name: gcp-secret-manager
description: Use when designing, provisioning, securing, or operating Secret Manager — Google Cloud's managed service for storing, versioning, accessing, and rotating secrets like API keys, passwords, certificates, and connection strings (Secret Manager). Covers secrets and immutable secret versions (add/access/disable/destroy, version aliases and "latest"), replication policy (automatic vs user-managed multi-region), CMEK encryption of secret payloads, rotation (rotation period + Pub/Sub topic notifications wired to a rotation function), expiration/TTL, access via client libraries / Cloud Run + GKE secret integration / gcloud, least-privilege accessor IAM, audit logging, plus cost and limits. Loads the Secret Manager knowledge: create secrets with the right replication, add versions, set rotation, grant least-privilege accessors, and verify access. Consumed by the Secret Manager specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when wiring secret storage (Secret Manager).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, secret-manager, security, secrets, rotation, cmek]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Secret Manager

Google Cloud's managed service for **storing and accessing secrets** — API keys, passwords, certificates,
and connection strings — with versioning, replication, CMEK encryption, rotation, and fine-grained IAM. It
replaces secrets embedded in code/config/env files and is the canonical secret store for GCP workloads.

## Core concepts and components
- **Secret** — a named container with metadata (replication, rotation, labels, CMEK); holds versions but no
  payload itself.
- **Secret version** — an **immutable** payload; you **add** a new version to change a value. Versions have
  state (enabled/disabled/destroyed). Access by number, by alias, or by the **`latest`** alias.
- **Replication policy** — **automatic** (Google-managed, multi-region) or **user-managed** (you pick the
  replica regions for residency); replication is **fixed at create time**.
- **CMEK** — encrypt the secret payload with your own Cloud KMS key (per replica for user-managed
  replication); requires the Secret Manager **service agent** to hold encrypter/decrypter on the key.
- **Rotation** — set a **rotation period** and a **Pub/Sub topic**; Secret Manager publishes a rotation
  message that triggers your rotation function to add a new version (Secret Manager does not generate the
  new value itself).
- **Expiration / TTL** — secrets can auto-expire (`expire_time`/`ttl`).
- **Access** — client libraries, `gcloud secrets versions access`, and native integration: **Cloud Run/
  Cloud Functions** can mount/inject a secret version and **GKE** via the CSI driver / Workload Identity.

## Configuration and sizing
- Choose **automatic** replication unless **residency** requires user-managed regions (fix at create). Use
  the **`latest`** alias for rotating values, pinned version numbers for stability-critical consumers. Add
  **labels** for ownership/environment. Wire **rotation** (period + Pub/Sub + function) for credentials that
  must rotate; set **expiration** for short-lived secrets.

## Security and IAM
- Grant least-privilege at the **secret** level: `roles/secretmanager.secretAccessor` (read payload) to the
  consuming **service account only**, `roles/secretmanager.viewer` (metadata), and
  `roles/secretmanager.admin` to a narrow admin set. Never grant project-wide accessor. Enable **CMEK** for
  sensitive payloads, keep **audit logs** (Data Access logs) for access, and prefer **disabling** over
  destroying so access is recoverable.

## Cost levers
- Billed per **active secret version per location per month**, per **access operation**, and for **rotation
  notifications**. Levers: destroy/disable unused old versions (each replica bills monthly),
  **cache** the secret in the app instead of calling `access` on every request, and avoid excessive replica
  regions under user-managed replication.

## Scaling and limits
- High access QPS is supported but **rate-limited per project/secret** — **cache** accessed values rather
  than reading per request. Versions per secret, secrets per project, and payload size (64 KiB) are bounded.
  User-managed replication regions and CMEK keys add operational and cost overhead.

## Operating procedure
1. **Provision** — enable the Secret Manager API; create the **secret** with the chosen **replication
   policy** (automatic vs user-managed regions) and optional **CMEK** key + labels.
2. **Configure** — **add the first version** (payload), set **rotation** (period + Pub/Sub topic + rotation
   function) and/or **expiration** as needed, and wire the consumer (Cloud Run/Functions secret mount or GKE
   CSI / client library reading `latest`).
3. **Secure** — grant `secretAccessor` to the **workload SA at the secret level** only, enable Data Access
   audit logging, and prefer disable over destroy.
4. **Verify** — apply [[verify-by-running]]: read the payload back as the workload identity
   (`gcloud secrets versions access latest --secret=...`) and confirm it matches, confirm a principal
   **without** the accessor role is **denied**, and (if rotation is set) confirm the **Pub/Sub rotation
   message** fires / a new version is added — capture the access result and the denied check.

## Inputs
The secrets to store and their sensitivity, residency/replication needs, whether CMEK is required, rotation
requirements (period + function), which workloads consume each secret (and how — mount vs API), the accessor
IAM model, and access-rate/cost expectations.

## Output
A Secret Manager configuration (secrets with the right replication, CMEK where required, versions, rotation/
expiration, consumer wiring) with least-privilege accessor IAM at the secret level, plus verification that
the workload can access the value and unauthorized principals cannot.

## Notes
- Gotchas: **replication policy is immutable** after creation (residency choices are permanent); secret
  **versions are immutable** — you add a version to "change" a value; **rotation does not generate the new
  value** — it only notifies your function (you must implement the rotate); destroying a version is
  **irreversible** (prefer disable); **per-request `access` calls** hit rate limits and inflate cost (cache);
  CMEK needs the **service agent** granted on the KMS key or version add fails; granting project-wide
  `secretAccessor` over-exposes every secret.
- IaC/CLI: Terraform `google_secret_manager_secret` (with `replication`, `rotation`, `topics`,
  `customer_managed_encryption`), `google_secret_manager_secret_version` (consider managing payloads outside
  state), `google_secret_manager_secret_iam_member` (secret-level accessor). CLI
  `gcloud secrets create|versions add|versions access` to manage and verify access.
