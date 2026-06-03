---
name: aws-cloudfront
description: Use when designing, provisioning, securing, or operating Amazon CloudFront — the AWS global content delivery network (CDN) that caches and serves content from edge locations. Loads the CloudFront knowledge: distributions, origins (S3, custom/ALB, origin groups for failover), cache behaviors and path patterns, cache policies / origin-request policies / response-headers policies, TTLs and invalidations, Origin Access Control (OAC) for private S3, viewer + origin protocol/TLS and ACM certificates, WAF and geo-restriction, CloudFront Functions vs Lambda@Edge, and access logs. Covers how to define origins and behaviors, lock S3 to OAC, attach TLS/WAF, tune caching, and verify cache hits and origin shielding. Consumed by the CloudFront specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology via network-design — this owns the CloudFront CDN service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, cloudfront, cdn, edge, caching, oac, tls]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon CloudFront

AWS's global **content delivery network (CDN)**: it caches content at hundreds of **edge locations**
close to users, lowering latency and offloading origins. It also terminates TLS at the edge and is
the standard front door for static sites, media, and API/app acceleration.

## Core concepts and components
- **Distribution** — the top-level CDN resource; has one or more origins and behaviors, an edge
  domain (`*.cloudfront.net`) plus optional alternate domain names (CNAMEs).
- **Origins** — where content is fetched: an **S3** bucket (lock down with OAC), a **custom origin**
  (ALB, API Gateway, any HTTP server), or an **origin group** (primary + failover).
- **Cache behaviors** — ordered **path patterns** (`/api/*`, `/static/*`, default `*`) that map
  requests to an origin and a set of policies; first match wins.
- **Policies** — **cache policy** (what's in the cache key + TTLs), **origin-request policy** (what's
  forwarded to the origin: headers/cookies/query strings), **response-headers policy** (CORS,
  security headers).
- **OAC (Origin Access Control)** — signs CloudFront→S3 requests so the bucket can stay private
  (replaces legacy OAI).
- **TLS** — viewer protocol policy (redirect-to-HTTPS), an **ACM cert in us-east-1** for custom
  domains, and origin protocol/TLS to the backend.
- **Edge compute** — **CloudFront Functions** (lightweight, viewer req/resp, JS) vs **Lambda@Edge**
  (heavier, all four trigger points).
- **Invalidations** — purge cached objects by path; **access logs** to S3/CloudWatch.

## Configuration and sizing
- Set behaviors per content type: long TTLs + minimal cache key for static assets, short/no caching
  with full forwarding for dynamic/API paths. Use a managed cache policy where it fits. Enable
  **origin shield** for a high cache-hit ratio across regions. Use origin groups for origin failover.

## Security and IAM
- Lock S3 origins to **OAC** with a bucket policy that only allows the distribution; block public
  bucket access. Force **HTTPS** (redirect-to-HTTPS) with a TLS 1.2+ policy and an ACM cert in
  us-east-1. Attach **AWS WAF** and **geo-restriction** as needed. Sign URLs/cookies for private
  content. Gate `cloudfront:*` with least-privilege IAM; enable access logs + CloudTrail.

## Cost levers
- Priced on data transfer out (by region) + requests + invalidations + edge-function invocations.
  Raise cache-hit ratio (good cache keys, longer TTLs, origin shield) to cut origin transfer; use a
  cheaper price class if you don't need all edge regions; avoid mass invalidations (use versioned
  object paths instead).

## Scaling and limits
- Edge network scales automatically and absorbs traffic spikes. Watch limits on behaviors/origins
  per distribution, invalidation paths per request, and CloudFront Functions size/duration. Config
  changes propagate to all edges (minutes).

## Operating procedure
1. **Provision** — create the distribution with origin(s) and a default behavior via Terraform
   `aws_cloudfront_distribution` (+ `aws_cloudfront_origin_access_control`) or
   `aws cloudfront create-distribution`.
2. **Configure** — define path-pattern behaviors, cache/origin-request/response-headers policies,
   TTLs, origin shield, origin groups, and any edge functions.
3. **Secure** — OAC + private S3 bucket policy, redirect-to-HTTPS with an ACM (us-east-1) cert, WAF +
   geo-restriction, signed URLs for private content, access logs.
4. **Verify** — apply [[verify-by-running]]: `get-distribution` shows `Deployed`, the behaviors, and
   the cert; a request to the edge domain returns the object with `X-Cache: Hit from cloudfront` on a
   repeat; direct S3 access is **denied** (OAC enforced); HTTP redirects to HTTPS; an invalidation
   clears a stale path.

## Inputs
Origins (S3/ALB/API GW), path/behavior map + caching needs, custom domain + ACM cert, TLS/WAF/geo
requirements, private-content needs (signed URLs/OAC), edge-function logic, logging.

## Output
A distribution definition (origins, behaviors, policies, TTLs), OAC + private bucket policy,
TLS/WAF/geo config, edge functions, and verification of cache hits, denied direct-origin access,
HTTPS enforcement, and invalidation.

## Notes
- Gotchas: the ACM cert for a custom domain MUST be in **us-east-1**; OAC requires a matching bucket
  policy (and replaces deprecated OAI); behaviors match in order — order them specific→general;
  invalidations cost money and are slow, prefer versioned paths; cache key misconfig (forwarding all
  headers/cookies) destroys hit ratio; config changes take minutes to propagate.
- IaC/CLI: Terraform `aws_cloudfront_distribution`, `aws_cloudfront_origin_access_control`,
  `aws_cloudfront_cache_policy`, `aws_cloudfront_function`, `aws_cloudfront_response_headers_policy`.
  CLI `aws cloudfront create-distribution`, `get-distribution`, `create-invalidation`,
  `update-distribution`. CloudFormation `AWS::CloudFront::Distribution`,
  `AWS::CloudFront::OriginAccessControl`, `AWS::CloudFront::CachePolicy`.
