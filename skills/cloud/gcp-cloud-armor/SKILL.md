---
name: gcp-cloud-armor
description: Use when designing, provisioning, securing, or operating Google Cloud Armor — Google Cloud's edge web application firewall (WAF) and DDoS protection that attaches security policies to external Application Load Balancer backend services to filter, rate-limit, and block traffic at Google's network edge before it reaches origins. Loads the Cloud Armor knowledge: build security policies and rules (allow/deny/throttle/redirect by IP/CIDR/geo/expression), use preconfigured WAF rules (OWASP CRS for SQLi/XSS/LFI/RCE), configure rate limiting and bot management (reCAPTCHA), enable adaptive protection and edge security, plus IAM and cost/scaling levers. Consumed by the Cloud Armor specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add WAF/DDoS to a web edge (Google Cloud Armor).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-armor, networking, waf, ddos, security-policy, rate-limiting]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Google Cloud Armor

Google Cloud Armor is an edge **WAF and DDoS protection** service. It attaches **security policies** to
the **backend service** of an **external Application Load Balancer**, evaluating and filtering requests
at Google's global network edge — blocking, throttling, or challenging traffic before it reaches your
origins.

## Core concepts and components
- **Security policy** — an ordered set of **rules** evaluated by **priority** (lowest number first),
  attached to one or more LB backend services; a **default rule** (priority 2147483647) catches the rest
  (allow or deny).
- **Rules & match conditions** — actions **allow / deny(403/404/502) / throttle / rate-based-ban /
  redirect** matched on **source IP/CIDR ranges**, **geo (region code)**, or **CEL expressions**
  (`evaluatePreconfiguredExpr(...)`, headers, paths, ASN, etc.).
- **Preconfigured WAF rules** — managed **OWASP ModSecurity CRS** signatures for **SQLi, XSS, LFI, RCE,
  scanner detection, protocol attacks**, tunable by **sensitivity level** and per-rule opt-out.
- **Rate limiting / bot management** — **throttle** and **rate-based-ban** by key (IP, header, cookie),
  plus **reCAPTCHA Enterprise** integration for bot defense and JavaScript challenges.
- **DDoS & adaptive protection** — always-on L3/L4 **DDoS protection** (and Advanced/Managed Protection
  Plus tiers), **Adaptive Protection** ML-based L7 attack detection with suggested rules, and **edge
  security policies** for cache/CDN traffic.

## Configuration and sizing
- Order rules by **priority**: specific allow/deny first, **rate limits**, **preconfigured WAF**
  (tune sensitivity to control false positives), then a sensible **default**. Start WAF rules in
  **preview (logging-only)** mode, observe, then enforce. Enable **Adaptive Protection** for volumetric
  L7. Choose Standard vs **Managed Protection Plus** based on DDoS risk and support needs.

## Security and IAM
- Use **deny-by-default** where feasible (default deny + explicit allow), geo/IP blocking for known-bad
  sources, and **rate-based-ban** against brute force/scraping. Roll out preconfigured WAF via **preview
  mode** to avoid false-positive outages. Grant least-privilege IAM
  (`roles/compute.securityAdmin`). Enable **Cloud Armor request logging** and verdict logging; review
  Adaptive Protection alerts. Layer with Cloud CDN and origin lockdown.

## Cost levers
- Cost depends on **tier** (Standard: per-policy + per-rule + per-request; Managed Protection Plus:
  subscription with bundled WAF/Adaptive Protection) and **request volume** evaluated. Consolidate rules,
  reuse a policy across backends, and pick the tier matching DDoS exposure to control spend.

## Scaling and limits
- Cloud Armor evaluates at Google's global edge and scales with the external Application Load Balancer's
  capacity. Limits: rules per policy, policies per project, and expression complexity; rule evaluation is
  by priority order. Adaptive Protection and Managed Protection Plus features require the appropriate tier.

## Operating procedure
1. **Provision** — create a **security policy** (Terraform `google_compute_security_policy`) and attach it
   to the **external Application Load Balancer backend service** (`google_compute_backend_service.security_policy`).
2. **Configure** — add **rules** (priority, match by IP/geo/CEL, action), **preconfigured WAF** rules
   (`evaluatePreconfiguredExpr`, sensitivity), **rate limiting / rate-based-ban**, and a sensible
   **default rule**; enable **Adaptive Protection** and choose the tier.
3. **Secure** — start WAF rules in **preview/logging-only** mode, then enforce; apply deny-by-default and
   geo/IP blocks; grant least-privilege IAM; enable request and verdict **logging**.
4. **Verify** — apply [[verify-by-running]]: send requests that should be **blocked** (e.g., a SQLi/XSS
   probe, a denied geo/IP) and confirm a 403, send allowed traffic and confirm it passes, exercise
   **rate limiting** by exceeding the threshold and confirming throttling/ban, and review **Cloud Armor
   logs** for the matched rule/verdict — capture the curl responses and the log entries.

## Inputs
Fronting external Application Load Balancer / backend service, threat profile (geo/IP blocks, OWASP WAF
needs, bot/DDoS exposure), rate-limit thresholds and keys, preview-vs-enforce rollout plan, tier choice
(Standard vs Managed Protection Plus), IAM model, logging requirements, and cost target.

## Output
A Cloud Armor security policy attached to the LB backend (prioritized allow/deny/throttle rules,
preconfigured OWASP WAF at chosen sensitivity, rate limiting / rate-based-ban, default rule, Adaptive
Protection), preview-then-enforce rollout, least-privilege IAM and request logging, plus verification of
blocked/allowed/throttled traffic and matched log verdicts.

## Notes
- Gotchas: Cloud Armor only attaches to **external Application Load Balancer** backend services (no
  standalone WAF); **rule priority order** matters — a broad early allow can shadow later denies; enforcing
  **preconfigured WAF** without **preview mode** first commonly causes **false-positive outages** (tune
  sensitivity and opt out noisy signatures); rate-limit **keys** must match the abuse pattern; Adaptive
  Protection and advanced DDoS need the **Managed Protection Plus** tier; pair with origin lockdown so
  attackers can't bypass the LB.
- IaC/CLI: Terraform `google_compute_security_policy` (rules, `preview`, `rate_limit_options`,
  `adaptive_protection_config`), attached via `google_compute_backend_service.security_policy`. CLI
  `gcloud compute security-policies` (`create`, `rules create`, `rules update --preview`),
  `gcloud compute backend-services update --security-policy`; verify by probing the LB and reviewing
  Cloud Armor logs in Cloud Logging.
