---
name: aws-private-ca
description: Use when designing, provisioning, securing, or operating AWS Private Certificate Authority (AWS Private CA) — standing up a private PKI with root and subordinate CA hierarchies, the CA modes (general-purpose vs short-lived certificate), certificate templates and X.509 path-length/constraints, issuing private end-entity certificates directly or via ACM, certificate revocation through CRLs and OCSP, audit reports, cross-account CA sharing via AWS RAM, integration with ACM, EKS, IoT, and mutual-TLS use cases, and the matching CA tenant model (AWS Private CA). Loads the Private CA knowledge: design the CA hierarchy, issue and revoke internal certs, and verify the chain. Consumed by the Private CA specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they build internal PKI.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, private-ca, pki, internal-certificates, revocation, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Private CA

AWS's managed **private certificate authority** for building an internal **PKI**. It issues
**privately trusted** X.509 certificates for internal services, mutual-TLS, devices, and
workloads — for cases where ACM's publicly trusted certificates are not appropriate. Private CA
provides the internal trust root; ACM provides public, internet-trusted certificates.

## Core concepts and components
- **CA hierarchy** — a **root CA** anchors trust; one or more **subordinate (issuing) CAs** sign
  end-entity certificates, keeping the root offline-equivalent. You design depth and path-length
  constraints to mirror a real PKI.
- **CA modes** — **GENERAL_PURPOSE** (standard certs with configurable validity) and
  **SHORT_LIVED_CERTIFICATE** (certs valid <=7 days, cheaper per-cert, ideal for high-churn
  workloads/mTLS).
- **Certificate templates** — control the certificate's purpose and extensions (e.g.
  `EndEntityCertificate`, `SubordinateCACertificate_PathLen0`, code-signing, mTLS client/server),
  setting key usage, EKUs, and basic constraints.
- **Issuance** — issue end-entity certs **directly** via `issue-certificate`, or let **ACM**
  request and auto-manage private certs from the CA (managed renewal for ACM-tracked certs).
- **Revocation** — **CRL** (Certificate Revocation List published to S3) and/or **OCSP**
  (managed responder) to revoke compromised certs; configure at CA creation.
- **Sharing** — share a CA across accounts with **AWS RAM** so an org can centralize PKI in one
  account while other accounts issue from it.
- **Audit reports** — generate issuance/revocation audit reports to S3.

## Configuration and sizing
- Design the hierarchy first (root → subordinate issuing CAs), choosing **mode** (short-lived for
  high-volume mTLS), **key algorithm** (RSA 2048/4096 or ECDSA), validity, and **revocation**
  (CRL and/or OCSP — decide before creation, as some settings are immutable). Centralize the CA in
  a security/PKI account and **share via RAM**. Use templates to constrain what each CA can issue.

## Security and IAM
- The CA private key is HSM-backed and **non-exportable**. Tightly restrict
  `acm-pca:IssueCertificate`, `RevokeCertificate`, and CA lifecycle actions — issuance is a trust
  decision. Keep the **root CA** disabled/used only to sign subordinates. Enable CRL/OCSP so
  compromised certs can actually be revoked, and protect the CRL S3 bucket. Cross-account issuance
  via RAM should be least-privileged.

## Cost levers
- Billed a **monthly charge per CA** (general-purpose CAs are significantly more expensive than
  short-lived-mode CAs) plus a **per-certificate issuance** fee (tiered; short-lived certs are
  cheaper per issuance). Levers: consolidate CAs, use **short-lived mode** for high-churn mTLS,
  delete/disable unused CAs (you still pay monthly while a CA exists), and share one CA org-wide.

## Scaling and limits
- Quotas on CAs per account and issuance throughput; certificate-per-second issuance is high but
  bounded. CRLs grow with revocations; OCSP scales for real-time checks. Short-lived mode trades
  long validity for cheaper, higher-volume issuance.

## Operating procedure
1. **Provision** — create the **root CA**, then **subordinate issuing CA(s)** with the chosen
   mode, key algorithm, validity, and **revocation** config via Terraform
   `aws_acmpca_certificate_authority` (+ root/subordinate cert signing) or
   `aws acm-pca create-certificate-authority`.
2. **Configure** — install the CA certificate (self-sign the root, sign subordinates from it),
   set up CRL/OCSP, apply certificate **templates**, and (optionally) share the issuing CA via
   AWS RAM and wire ACM to request private certs from it.
3. **Secure** — restrict issuance/revocation IAM, keep the root CA out of the issuing path, enable
   audit reports, and confirm CRL/OCSP endpoints are reachable so revocation works.
4. **Verify** — apply [[verify-by-running]]: `aws acm-pca describe-certificate-authority` confirms
   status `ACTIVE` and the chain, issue a test end-entity cert (`issue-certificate` →
   `get-certificate`) and validate the chain with `openssl verify`, then **revoke** it and confirm
   it appears in the CRL/OCSP — capture the actual output.

## Inputs
The intended PKI hierarchy and depth, CA mode and key algorithm, validity periods, revocation
mechanism (CRL/OCSP), certificate templates/usages, cross-account sharing needs, and whether ACM
will manage issuance.

## Output
The Private CA configuration (root + subordinate CAs, mode/key/validity, CRL/OCSP, templates, RAM
sharing, ACM integration) as code, plus verification that the CA is ACTIVE, a test cert chains and
validates, and revocation propagates to the CRL/OCSP.

## Notes
- Gotchas: several CA settings (**revocation config, key algorithm, mode**) are set at creation
  and are effectively immutable — design before creating; you **pay the monthly CA charge while
  the CA exists**, even if idle — delete or disable unused CAs; the **root CA** should sign only
  subordinates, never end-entity certs; **short-lived mode** certs cannot exceed 7 days; without
  CRL/OCSP configured you cannot truly revoke a leaked cert; Private CA issues **privately trusted**
  certs only — for internet-facing endpoints use ACM public certs.
- IaC/CLI: Terraform `aws_acmpca_certificate_authority`, `aws_acmpca_certificate`,
  `aws_acmpca_certificate_authority_certificate`, `aws_acmpca_permission`, `aws_ram_resource_share`.
  CLI `aws acm-pca create-certificate-authority`, `get-certificate-authority-csr`,
  `import-certificate-authority-certificate`, `issue-certificate`, `get-certificate`,
  `revoke-certificate`, `describe-certificate-authority`. CloudFormation
  `AWS::ACMPCA::CertificateAuthority`, `AWS::ACMPCA::Certificate`,
  `AWS::ACMPCA::CertificateAuthorityActivation`, `AWS::ACMPCA::Permission`.
