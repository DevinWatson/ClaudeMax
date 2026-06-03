---
name: aws-shield
description: Use when designing, provisioning, securing, or operating AWS Shield — Shield Standard (always-on, free, layer 3/4 DDoS protection) vs Shield Advanced (subscription), protected resources (CloudFront, Route 53, Global Accelerator, ELB/ALB/NLB, Elastic IPs), the DDoS Response Team (DRT/SRT) and engagement, proactive engagement, health-based detection with Route 53 health checks, automatic application-layer (L7) DDoS mitigation, association of AWS WAF web ACLs and rate-based rules for L7 defense, cost protection / DDoS scaling credits, and Shield Advanced findings and global threat dashboards (AWS Shield). Loads the Shield knowledge: subscribe and protect resources, wire WAF + health-based detection, and verify protections and metrics. Consumed by the Shield specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they harden edge resources.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, shield, ddos, edge-protection, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Shield

AWS's managed **DDoS protection** service. **Shield Standard** is always-on and free, defending
all AWS customers against common network/transport (L3/L4) attacks. **Shield Advanced** is a paid
subscription adding enhanced detection, L7 mitigation, response-team access, and cost protection
for specific protected resources. Shield handles **DDoS**; granular L7 filtering is AWS WAF,
which Shield Advanced integrates with.

## Core concepts and components
- **Shield Standard** — automatic, no-cost protection against the most common **L3/L4** volumetric
  and state-exhaustion attacks at the AWS network edge; nothing to enable.
- **Shield Advanced** — a **subscription** (account/org level) that you then apply to specific
  **protected resources**: **CloudFront** distributions, **Route 53** hosted zones, **Global
  Accelerator**, **ELB** (ALB/NLB/CLB), and **Elastic IPs** (EC2/NLB).
- **Automatic application-layer (L7) DDoS mitigation** — Shield Advanced can auto-create/manage
  **AWS WAF rate-based rules** on associated web ACLs to mitigate L7 floods.
- **Health-based detection** — associate **Route 53 health checks** so detection is informed by
  application health, reducing false positives and speeding mitigation.
- **Shield Response Team (SRT/DRT)** — Advanced subscribers can **engage** the team during an
  attack and enable **proactive engagement** (they contact you on detected events).
- **Cost protection** — Advanced reimburses **DDoS-related scaling charges** (e.g. surge in data
  transfer / scale-out) on protected resources during a documented attack.
- **Visibility** — Shield Advanced **events/findings**, attack diagnostics, and global threat
  dashboards.

## Configuration and sizing
- For most workloads **Standard** is automatic and sufficient at L3/L4. Subscribe to **Advanced**
  when you need L7 auto-mitigation, SRT access, cost protection, or compliance assurance — then
  **add protections** to the actual edge resources (CloudFront/ALB/NLB/EIP/Route 53/GA). Pair
  every L7-exposed protected resource with an **AWS WAF web ACL** (Shield doesn't replace WAF
  rules). Use a Firewall Manager Shield policy to apply protection org-wide.

## Security and IAM
- Shield Advanced uses a **service-linked role** to manage WAF rules and access health checks.
  Grant the SRT a scoped role (`AWSShieldDRTAccessPolicy`) only if you want them to act on your
  behalf during attacks. Restrict who can disassociate protections or cancel the subscription.
  Shield is an edge defense — combine with WAF (filtering), least-privilege, and origin hiding
  (only CloudFront/ALB exposed) for defense in depth.

## Cost levers
- **Standard is free.** **Shield Advanced** is a **fixed monthly subscription** (typically org-
  wide, 1-year commitment) **plus data-transfer-out fees on protected resources** — but it
  includes **cost protection** that refunds attack-driven scaling. Lever: subscribe once at the
  org/consolidated-billing level (don't pay per account), protect only the resources that need it,
  and rely on Standard elsewhere.

## Scaling and limits
- Standard scales transparently at the AWS edge. Advanced protections are per protected resource;
  quotas on number of protected resources and protection groups (raisable). L7 auto-mitigation is
  bounded by the associated WAF web ACL's capacity (WCUs). Route 53 health checks have their own
  limits.

## Operating procedure
1. **Provision** — subscribe to Shield Advanced via Terraform `aws_shield_subscription` (or the
   console/Firewall Manager) and create the service-linked role / SRT access role as needed.
2. **Configure** — add **protections** to the edge resources via `aws_shield_protection`,
   associate **AWS WAF web ACLs** + rate-based rules, enable **automatic L7 mitigation**, attach
   **Route 53 health checks** for health-based detection, and turn on proactive engagement.
3. **Secure** — scope the SRT role, restrict disassociation/cancellation, and ensure origins are
   only reachable via the protected edge (CloudFront/ALB), not directly.
4. **Verify** — apply [[verify-by-running]]: `aws shield list-protections` / `describe-protection`
   confirm the intended resources are protected, `describe-subscription` confirms Advanced is
   active, confirm the WAF web ACL is associated and L7 auto-mitigation is enabled, and check the
   CloudWatch `DDoSDetected`/attack metrics surface — capture the actual output.

## Inputs
The internet-facing edge resources to protect (CloudFront/ALB/NLB/EIP/Route 53/GA), whether
Advanced is warranted (L7/SRT/cost-protection/compliance), associated WAF web ACLs and rate
rules, Route 53 health checks, SRT engagement preferences, and org/billing scope.

## Output
The Shield configuration (Advanced subscription, per-resource protections, protection groups,
WAF + rate-rule association, automatic L7 mitigation, health-based detection, SRT access) as
code, plus verification that resources are protected, the subscription is active, and DDoS
metrics/mitigation are wired.

## Notes
- Gotchas: **Standard needs no setup but Advanced does nothing until you add per-resource
  protections** — subscribing alone protects nothing; Advanced is a **fixed monthly + 1-year
  commitment** typically billed **org-wide** (don't subscribe per account); **Shield is not a WAF**
  — it stops volumetric DDoS, but you still need WAF rules for application-layer filtering (L7
  auto-mitigation only adds rate-based rules); **cost protection requires you to request a credit**
  with attack evidence, it is not automatic; protecting an EIP only covers EC2/NLB behind it;
  origins reachable directly (bypassing CloudFront/ALB) are unprotected — hide them. Cross-ref the
  aws-waf specialist for L7 rule design.
- IaC/CLI: Terraform `aws_shield_subscription`, `aws_shield_protection`,
  `aws_shield_protection_group`, `aws_shield_drt_access_role_arn_association`,
  `aws_shield_application_layer_automatic_response`. CLI `aws shield create-subscription`,
  `create-protection`, `list-protections`, `describe-protection`, `describe-subscription`,
  `associate-drt-role`, `enable-application-layer-automatic-response`. CloudFormation
  `AWS::Shield::Protection`, `AWS::Shield::ProtectionGroup`.
