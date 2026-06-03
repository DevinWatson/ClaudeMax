---
name: gcp-binary-authorization
description: Use when designing, provisioning, securing, or operating Binary Authorization — Google Cloud's deploy-time control that enforces only trusted, attested container images run on GKE and Cloud Run (Binary Authorization). Covers the admission policy (default + per-cluster/per-service rules), enforcement modes (enforced-block vs dry-run/audit), attestors and KMS-signed attestations bound to image digests, allowlist exemptions, Continuous Validation of running pods, and supply-chain integration with Cloud Build / Artifact Registry / Container Analysis scanning, plus IAM, cost, and limits. Loads the Binary Authorization knowledge: define the policy and attestors, sign images in the pipeline, enforce on GKE/Cloud Run, and verify an unsigned image is blocked. Consumed by the Binary Authorization specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when wiring supply-chain admission control (Binary Authorization).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, binary-authorization, security, supply-chain, attestation, gke]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Binary Authorization

Google Cloud's **deploy-time** security control: it enforces that only **trusted, attested container images**
can be deployed to **GKE** and **Cloud Run**. It is the admission gate of a software **supply-chain** story —
images must carry the **attestations** your policy requires (built by a trusted pipeline, scanned, approved)
or the deploy is blocked.

## Core concepts and components
- **Policy** — the org/project deploy-time admission policy: a **default rule** plus optional
  **per-cluster** (GKE) / **per-service** (Cloud Run) rules. Each rule sets an **evaluation mode**.
- **Evaluation / enforcement modes** — `ALWAYS_ALLOW`, `ALWAYS_DENY`, or
  `REQUIRE_ATTESTATION` (only images with the required attestations deploy); enforcement can be **enforced
  (block)** or **dry-run / audit-only** (log the violation but allow — the safe rollout mode).
- **Attestor** — a named authority that **verifies attestations** using its associated **public keys**
  (backed by **Cloud KMS** asymmetric signing keys or PGP). A rule lists the attestors whose attestations
  it requires.
- **Attestation** — a **signed claim** about a specific image digest ("this image passed gate X"), produced
  in the pipeline (e.g. by Cloud Build) and signed by the attestor's KMS key. Bound to the **image digest**,
  not the tag.
- **Allowlist / exemptions** — `admissionWhitelistPatterns` exempt images matching a pattern (e.g.
  Google system images) from attestation requirements.
- **Continuous Validation (CV)** — re-checks **already-running** pods against policy and logs drift (an image
  that was admitted but no longer complies).
- **Supply-chain integration** — works with **Cloud Build** (build provenance / SLSA), **Artifact Registry**,
  and **Container Analysis** vulnerability scanning to gate on scan results.

## Configuration and sizing
- Define the **default rule** as `REQUIRE_ATTESTATION` in **dry-run first**, create **attestors** backed by
  **KMS keys**, and have the **CI pipeline sign** each image digest after it passes the required gates
  (build provenance, vuln scan, QA). Add **per-cluster/per-service** exceptions sparingly and **allowlist**
  only trusted system images. Flip to **enforced** once dry-run shows no false blocks. Enable **Continuous
  Validation** to catch drift in running workloads.

## Security and IAM
- Grant least-privilege: `roles/binaryauthorization.policyEditor` / `...policyViewer` for the policy,
  `roles/binaryauthorization.attestorsAdmin`/`...attestorsViewer` for attestors, and KMS signer roles only
  to the **pipeline identity** that creates attestations. The **attestor's signing key is the trust
  anchor** — protect it (HSM/restricted KMS). The policy itself is a critical control — restrict who can
  weaken rules or add allowlist patterns.

## Cost levers
- Binary Authorization has **no significant separate charge**; cost flows through the **GKE/Cloud Run**
  workloads, **KMS** signing operations/keys, and **Container Analysis** scanning. Levers: reuse one attestor
  per gate rather than many, and avoid unnecessary KMS key proliferation.

## Scaling and limits
- Scales across many clusters/services via per-cluster/per-service rules. Bounds: attestors per project,
  attestations per image, allowlist patterns, and KMS signing throughput. The main operational effort is
  keeping the **pipeline signing step** reliable so legitimate deploys aren't blocked.

## Operating procedure
1. **Provision** — enable the Binary Authorization API on the project and enable it on the **GKE cluster** /
   **Cloud Run** service; create **Cloud KMS asymmetric signing keys** for attestors.
2. **Configure** — create **attestors** (referencing the KMS public keys), set the **policy** (default rule
   `REQUIRE_ATTESTATION` in **dry-run**, per-cluster/service rules, allowlist patterns), and add the
   **signing step** to the CI pipeline so passing images get attested.
3. **Secure** — grant least-privilege IAM, restrict the **KMS signing key** to the pipeline identity, lock
   down who can edit the policy/allowlist, and enable **Continuous Validation**.
4. **Verify** — apply [[verify-by-running]]: deploy a **properly attested** image and confirm it is
   **admitted**, then deploy an **unsigned/unattested** image and confirm it is **blocked** (or logged in
   dry-run) — check the admission denial (`kubectl` event / Cloud Run deploy error) and the Binary
   Authorization audit logs; confirm CV logs drift — capture the allow, the block, and the audit entry.

## Inputs
The deploy targets (GKE clusters / Cloud Run services), the gates that must be enforced (trusted build,
vuln scan, QA approval) and thus the attestors needed, the CI pipeline that will sign, KMS key custody,
allowlist exemptions, dry-run-vs-enforced rollout plan, and the IAM model.

## Output
A Binary Authorization configuration (policy with default + per-target rules, attestors backed by KMS keys,
pipeline signing step, allowlist, Continuous Validation) with least-privilege IAM, plus verification that an
attested image is admitted and an unattested image is blocked (or logged in dry-run).

## Notes
- Gotchas: roll out `REQUIRE_ATTESTATION` in **dry-run first** — going straight to enforced can **block all
  deploys** if the signing step isn't wired; attestations bind to the **image digest, not the tag** (re-tag
  ≠ re-attest); the **attestor signing key is the trust anchor** — protect it; an over-broad **allowlist
  pattern** silently bypasses the gate; the **pipeline signing step is a single point of failure** for
  legitimate deploys — make it reliable; Binary Authorization is **deploy-time** admission, not runtime
  protection (pair with workload security); **Continuous Validation only logs** drift, it does not evict.
- IaC/CLI: Terraform `google_binary_authorization_policy` (default_admission_rule, cluster rules,
  admission_whitelist_patterns), `google_binary_authorization_attestor` (with the KMS/PGP public key),
  `google_container_analysis_note`, and the GKE `enable_binary_authorization` / Cloud Run platform-policy
  settings. CLI `gcloud container binauthz policy`, `... attestors`, `... attestations` and
  `gcloud beta container binauthz` to sign/verify; check admission via `kubectl`/Cloud Run deploy + audit logs.
