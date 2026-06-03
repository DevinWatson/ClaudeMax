---
name: aws-waf
description: Use when designing, provisioning, securing, or operating AWS WAF — web ACLs, rules and rule groups (custom + AWS Managed Rules + AWS Marketplace), rate-based rules, statement types (IP set, geo-match, byte/regex/size, SQLi/XSS, label-match), rule actions (allow/block/count/CAPTCHA/challenge), web ACL association with CloudFront, Application Load Balancer, API Gateway, AppSync, Cognito user pools and App Runner, request sampling, logging to CloudWatch Logs/S3/Firehose, and WCU capacity budgeting (AWS WAF). Loads the WAF knowledge: design L7 filtering rules, tune managed rule groups, set rate limits, and verify allow/block behavior. Consumed by the WAF specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they add web-application firewalling.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, waf, web-application-firewall, layer7, rules, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS WAF

AWS's managed **layer-7 (application) web firewall**. It inspects HTTP(S) requests against a
**web ACL** of rules and allows, blocks, counts, or challenges them before they reach a
protected resource. WAF filters application traffic; it does not absorb volumetric L3/L4 DDoS
(that is AWS Shield).

## Core concepts and components
- **Web ACL** — the top-level container evaluated against incoming requests; has a **default
  action** (allow or block) and an ordered list of rules. Lives in a **scope**: `CLOUDFRONT`
  (global, `us-east-1`) or `REGIONAL` (ALB, API Gateway, AppSync, Cognito user pool, App Runner,
  Verified Access).
- **Rules** — each has a **statement** and an **action**. Statements: IP set match, geo-match,
  byte/regex/size-constraint, **SQLi** and **XSS** match, label-match, and logical
  AND/OR/NOT plus rate-based. Actions: **allow, block, count, CAPTCHA, challenge**.
- **Rule groups** — reusable rule bundles: **custom rule groups**, **AWS Managed Rules**
  (Core/CRS, Known Bad Inputs, SQL database, IP reputation, Bot Control, Account Takeover
  Prevention, Account Creation Fraud Prevention), and Marketplace groups.
- **Rate-based rules** — count requests per 5-minute window per aggregation key (IP, forwarded
  IP, header, custom keys) and block/challenge over a threshold; the cornerstone of L7 flood
  control.
- **Association** — a web ACL is associated with **CloudFront distributions, ALBs, API Gateway
  stages, AppSync APIs, Cognito user pools, and App Runner services**.
- **Labels** — rules emit labels that later rules can match, enabling staged logic (e.g. Bot
  Control label → custom block).

## Configuration and sizing
- **WCU (Web ACL Capacity Units)** budget the cost of evaluating a web ACL; the default cap is
  **1500 WCU** (raisable). Each rule/managed group consumes WCUs — keep the most selective,
  cheapest rules first. Start managed groups in **count** mode, observe sampled requests and
  labels, then flip to block. Use **scope-down statements** to limit expensive inspections (e.g.
  Bot Control) to specific paths.

## Security and IAM
- Web ACL admin requires `wafv2:*` actions (`CreateWebACL`, `UpdateWebACL`,
  `AssociateWebACL`); scope to the security/network team. Enable **logging** with field
  redaction for sensitive headers/cookies. Use **token domains** for CAPTCHA/challenge across
  subdomains. WAF complements Shield Advanced (which can auto-associate web ACLs for L7 DDoS).

## Cost levers
- Billed per **web ACL/month**, per **rule/month**, and per **million requests**; managed groups
  like **Bot Control / ATP / ACFP** carry additional per-request and subscription fees. Levers:
  consolidate web ACLs, prune unused rules, scope-down expensive groups, and sample rather than
  full-log when volume is high.

## Scaling and limits
- Default **1500 WCU** per web ACL, rules/web ACL and rule-groups/web ACL quotas, rate-rule
  minimum window of 5 minutes, and a rule-group reference limit. Evaluation is inline at the
  edge/regional resource and scales with the protected service.

## Operating procedure
1. **Provision** — create the web ACL in the correct scope (`CLOUDFRONT` in `us-east-1` vs
   `REGIONAL`) with a sensible default action via Terraform `aws_wafv2_web_acl` or
   `aws wafv2 create-web-acl`.
2. **Configure** — add managed rule groups (in **count** first), IP/geo/rate-based and custom
   rules in priority order, scope-down statements, and enable logging to CloudWatch Logs/S3/
   Firehose with redaction.
3. **Secure** — flip validated rules from count to block, set a rate-based rule for floods, add
   CAPTCHA/challenge where bots are suspected, and associate the web ACL with the target
   resource(s).
4. **Verify** — apply [[verify-by-running]]: `aws wafv2 get-web-acl` confirms rules/actions,
   `aws wafv2 get-web-acl-for-resource` confirms association, `aws wafv2 get-sampled-requests`
   shows real allow/block/count decisions, and a crafted test request (e.g. a benign vs an SQLi
   pattern) confirms the intended block while legitimate traffic passes — capture the actual
   output.

## Inputs
The protected resource(s) and their scope, expected traffic and known-bad patterns, compliance/
bot requirements, rate thresholds, geo/IP allow- and block-lists, logging/redaction needs, and
the WCU budget.

## Output
The WAF configuration (web ACL with ordered rules, managed + custom rule groups, rate-based
rules, scope-down statements, logging, and resource association) as code, plus verification via
sampled requests and a crafted allow/block test.

## Notes
- Gotchas: a `CLOUDFRONT`-scope web ACL **must** be created in `us-east-1`; rule **priority
  ordering** matters (first terminating action wins); managed groups can break legitimate traffic
  if flipped to block without a count-mode soak; rate-based rules aggregate over a fixed 5-minute
  window (not instantaneous); WCU exhaustion blocks adding rules; `count` rules still emit labels;
  redact sensitive fields before logging.
- IaC/CLI: Terraform `aws_wafv2_web_acl`, `aws_wafv2_rule_group`, `aws_wafv2_ip_set`,
  `aws_wafv2_regex_pattern_set`, `aws_wafv2_web_acl_association`,
  `aws_wafv2_web_acl_logging_configuration`. CLI `aws wafv2 create-web-acl`, `update-web-acl`,
  `associate-web-acl`, `get-sampled-requests`, `list-resources-for-web-acl`. CloudFormation
  `AWS::WAFv2::WebACL`, `AWS::WAFv2::RuleGroup`, `AWS::WAFv2::IPSet`,
  `AWS::WAFv2::WebACLAssociation`, `AWS::WAFv2::LoggingConfiguration`.
