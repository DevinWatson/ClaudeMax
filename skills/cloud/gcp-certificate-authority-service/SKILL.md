---
name: gcp-certificate-authority-service
description: Use when designing, provisioning, securing, or operating Certificate Authority Service (CA Service / CAS) — Google Cloud's managed private CA for issuing private X.509 certificates and PKI hierarchies (Certificate Authority Service). Covers CA pools and tiers (DevOps vs Enterprise), the CA hierarchy (root and subordinate CAs, bridging to an external root), certificate templates and pool issuance policy (subject/SAN/key/lifetime constraints), CA key custody (Cloud KMS / HSM / BYO), certificate lifetime and revocation/CRL/OCSP, and audit logging, plus least-privilege IAM, cost, scaling, and limits. Loads the CA Service knowledge: build the CA hierarchy in a CA pool, define templates and issuance policy, issue/revoke certs, secure CA keys, and verify a cert chains to the root. Consumed by the CA Service specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when wiring private PKI (Certificate Authority Service).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, certificate-authority-service, security, pki, private-ca, x509]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Certificate Authority Service (CA Service / CAS)

Google Cloud's **managed private CA**: stand up and operate a private **PKI** to issue and manage private
**X.509 certificates** for internal services, mTLS, devices, and workloads — without running your own CA
infrastructure. It is GCP's private-trust counterpart to the public-trust Certificate Manager.

## Core concepts and components
- **CA pool** — the issuance unit: a group of CAs that share an **issuance policy** and **tier**, with
  certificates issued from the pool (enabling rotation/load-balancing across member CAs).
- **Tier** — **DevOps** (high-throughput, no per-cert CRL/list overhead, cheaper) vs **Enterprise**
  (per-certificate tracking, revocation/CRL, higher assurance).
- **CA hierarchy** — **root CA** (self-signed trust anchor) and **subordinate CAs** (signed by the root or
  an external root — supports **bridging** to an existing enterprise root). Build a tiered hierarchy (root →
  subordinate → leaf) for blast-radius control.
- **Certificate** — an issued leaf (or CA) cert with subject, SANs, key usages, and lifetime.
- **Certificate template** — a reusable definition that constrains/predefines **identity (subject/SAN)**,
  **key usages/extended key usages**, and **X.509 extensions**, optionally enforced by the issuance policy.
- **Issuance policy** — pool-level rules: allowed subject/SAN values, allowed key types/sizes, maximum
  lifetime, allowed/required extensions, and which templates apply.
- **CA key custody** — CA signing keys live in **Cloud KMS** (software or **HSM** protection level) or are
  **imported/BYO**; key custody is the trust root of the whole PKI.
- **Revocation** — Enterprise tier supports **revocation** with **CRL** (published, e.g. to a bucket) and
  OCSP-style checking.

## Configuration and sizing
- Create a **CA pool** with the right **tier** (DevOps for high-volume short-lived workload certs;
  Enterprise where revocation/tracking is required). Build a **root + subordinate** hierarchy (keep the root
  offline/disabled and issue from subordinates), choose **HSM** protection for production CA keys, define
  **templates** + **issuance policy** to constrain what can be issued, and set **short lifetimes** for leaf
  certs.

## Security and IAM
- Grant least-privilege: `roles/privateca.certificateManager` (request certs),
  `roles/privateca.certificateRequester`, `roles/privateca.caManager` (manage CAs/pools), and
  `roles/privateca.admin` to a narrow set. Protect **CA signing keys** (HSM, restricted KMS access) — they
  are the trust root. Enforce issuance policy/templates so callers cannot mint over-broad certs. Keep audit
  logs of issuance/revocation.

## Cost levers
- Billed by **CA tier** (DevOps vs Enterprise have different per-CA and per-certificate pricing) and the
  number of CAs/certificates. Levers: use **DevOps tier** for high-volume short-lived certs that don't need
  revocation, consolidate CAs into pools, and disable/clean up unused CAs (a CA still bills while enabled).

## Scaling and limits
- DevOps tier targets **high issuance throughput**; Enterprise trades throughput for per-cert tracking/
  revocation. Limits: CAs per pool/location, issuance QPS, certificate lifetime bounds, and CRL size. Plan
  the hierarchy for rotation (subordinate CAs can be rotated without changing the root).

## Operating procedure
1. **Provision** — enable the Private CA API; create a **CA pool** (choose **tier**) and the **CA
   hierarchy**: a **root CA** (or bridge to an external root) and one or more **subordinate CAs** with keys
   in **KMS/HSM**.
2. **Configure** — define **certificate templates** and the pool **issuance policy** (allowed subject/SAN,
   key types, lifetime, extensions), set **revocation/CRL** (Enterprise) and publish the CRL/CA cert.
3. **Secure** — grant least-privilege Private CA IAM, protect CA keys (HSM/restricted KMS), enforce
   templates/issuance policy, keep the root constrained, and enable audit logging.
4. **Verify** — apply [[verify-by-running]]: **issue a test certificate** from the pool
   (`gcloud privateca certificates create`), confirm it **chains to the root** and matches the template
   (`openssl verify` / `openssl x509 -text`), and (Enterprise) **revoke** it and confirm it appears on the
   **CRL** — capture the issued chain and the verify/revocation result.

## Inputs
The PKI use case (mTLS/workload/device certs), trust model (new root vs bridge to existing root), required
tier (DevOps vs Enterprise / revocation), the CA hierarchy design, certificate templates and issuance
constraints, CA key custody (KMS/HSM/BYO), the IAM model, and cost/throughput expectations.

## Output
A CA Service configuration (CA pool at the right tier, root + subordinate hierarchy with KMS/HSM keys,
templates and issuance policy, revocation/CRL where needed) with least-privilege IAM, plus verification that
an issued certificate chains to the root and (Enterprise) can be revoked.

## Notes
- Gotchas: **CA signing keys are the trust root** — protect with HSM and tight KMS IAM (compromise breaks
  all issued trust); keep the **root offline/disabled** and issue from **subordinates**; **DevOps tier has
  no per-cert revocation/CRL** — don't choose it where revocation is required; an over-broad **issuance
  policy/template** lets callers mint privileged certs; an **enabled CA still bills** even when unused;
  external clients must **trust the CA cert** (distribute the chain); CRL must be **published and reachable**
  for revocation to take effect.
- IaC/CLI: Terraform `google_privateca_ca_pool` (tier, issuance_policy),
  `google_privateca_certificate_authority` (root/subordinate, `key_spec`/HSM), `google_privateca_certificate`,
  `google_privateca_certificate_template`, and `google_privateca_ca_pool_iam_member`. CLI
  `gcloud privateca pools/roots/subordinates/templates` and `gcloud privateca certificates create|revoke` to
  issue and verify.
