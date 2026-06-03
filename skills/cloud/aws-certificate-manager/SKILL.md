---
name: aws-certificate-manager
description: Use when designing, provisioning, securing, or operating AWS Certificate Manager (ACM) — provisioning public TLS/SSL certificates (free, AWS-signed) and managing private certificates issued from AWS Private CA, DNS vs email domain validation, wildcard and multi-SAN certificates, automatic managed renewal and the renewal-eligibility rules, integration with CloudFront, Application/Network Load Balancers, API Gateway, App Runner and other AWS services, importing third-party certificates, Region scoping (incl. the us-east-1 requirement for CloudFront), and ACM in AWS Organizations (AWS Certificate Manager). Loads the ACM knowledge: request and validate certificates, wire them into endpoints, and verify the served chain. Consumed by the ACM specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they provision TLS.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, certificate-manager, acm, tls, certificates, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Certificate Manager (ACM)

AWS's service for **provisioning, managing, and renewing TLS/SSL certificates** used by AWS
endpoints. ACM issues free public certificates, manages private certificates from AWS Private
CA, and **automatically renews** certificates it can validate — removing manual cert rotation.

## Core concepts and components
- **Public certificates** — free, AWS-issued (publicly trusted) X.509 certs for your domains.
  Used to terminate TLS on integrated AWS services; the **private key is non-exportable**.
- **Private certificates** — issued from **AWS Private CA** for internal/mutual-TLS use;
  managed renewal applies when ACM tracks them.
- **Imported certificates** — third-party certs uploaded for use on AWS endpoints; these are
  **not auto-renewed** (you must re-import before expiry).
- **Domain validation** — **DNS validation** (add a CNAME; enables hands-off auto-renewal) or
  **email validation** (manual approval; brittle for renewal). Supports **wildcards**
  (`*.example.com`) and multiple **SANs**.
- **Managed renewal** — ACM renews eligible certs automatically (DNS-validated and in active use
  by an integrated service); renewal requires the validation record to remain in place.
- **Integration** — directly consumable by **CloudFront, ALB/NLB, API Gateway, App Runner,
  Cognito, Elastic Beanstalk**, and more; ACM-public certs cannot be installed on EC2/self-managed
  servers (use Private CA / exportable certs there).

## Configuration and sizing
- Prefer **DNS validation** so renewal is automatic; create the validation CNAME in Route 53
  (one-click) or your DNS. Match the certificate **Region** to the consuming service — and use
  **us-east-1** for any CloudFront certificate. Use a single multi-SAN/wildcard cert where it
  reduces validation overhead, but avoid over-broad wildcards.

## Security and IAM
- ACM public/private keys are managed and **non-exportable** (you cannot leak them). Restrict
  `acm:RequestCertificate`, `DeleteCertificate`, and `ImportCertificate` to the platform/security
  team. For private certs, control the issuing **Private CA** permissions. Enforce TLS 1.2+ at the
  consuming endpoint and monitor expiry (especially imported certs) via Config/EventBridge.

## Cost levers
- **Public ACM certificates are free**; you pay for the AWS resources that use them. **Private
  certificates** incur AWS Private CA issuance/CA costs. Imported certs are free but carry
  operational cost (manual renewal). Lever: prefer public DNS-validated certs over imported ones
  to eliminate rotation toil.

## Scaling and limits
- Quotas on certificates per account/Region, domain names (SANs) per certificate, and
  in-progress certificate requests; most are raisable. Renewal is automatic for eligible certs;
  imported and email-validated certs are operational liabilities at scale.

## Operating procedure
1. **Provision** — request a public certificate (`aws acm request-certificate` / Terraform
   `aws_acm_certificate`) in the **correct Region** (us-east-1 for CloudFront), listing the apex,
   wildcard, and any SAN domains; choose **DNS** validation.
2. **Configure** — create the validation CNAME(s) (Route 53 `aws_route53_record` from the
   `domain_validation_options`) and wait for status `ISSUED`; for private certs select the
   Private CA ARN.
3. **Secure** — associate the certificate ARN with the endpoint (CloudFront/ALB/API Gateway),
   enforce a modern TLS security policy, restrict ACM admin actions, and add expiry monitoring for
   any imported certs.
4. **Verify** — apply [[verify-by-running]]: `aws acm describe-certificate` confirms status
   `ISSUED` and `RenewalEligibility ELIGIBLE`, and an actual TLS probe of the endpoint (e.g.
   `openssl s_client -connect host:443` or `curl -vI https://host`) confirms the correct chain,
   SANs, and expiry are served — capture the actual output.

## Inputs
The domains/SANs and whether public or private, the consuming endpoint(s) and their Region, the
DNS zone for validation (or Private CA ARN), the required TLS policy, and any third-party cert to
import.

## Output
The ACM configuration (requested/issued certificate, DNS validation records, endpoint
association, TLS policy) as code, plus verification that the cert is ISSUED and renewal-eligible
and that the endpoint serves the correct validated chain.

## Notes
- Gotchas: a **CloudFront** certificate **must** be in `us-east-1` regardless of distribution
  origin; **DNS validation is required for hands-off auto-renewal** — email-validated and
  imported certs are NOT auto-renewed; deleting the validation CNAME breaks renewal; ACM public
  certs are **non-exportable** so they cannot be used on EC2/self-managed servers; certs must be
  in the **same Region** as the regional service consuming them; a cert stuck in
  `PENDING_VALIDATION` usually means the CNAME is missing or wrong.
- IaC/CLI: Terraform `aws_acm_certificate`, `aws_acm_certificate_validation`,
  `aws_route53_record` (for validation). CLI `aws acm request-certificate`,
  `describe-certificate`, `list-certificates`, `import-certificate`, `add-tags-to-certificate`.
  CloudFormation `AWS::CertificateManager::Certificate`.
