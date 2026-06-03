---
name: aws-route53
description: Use when designing, provisioning, securing, or operating Amazon Route 53 — the AWS scalable DNS and domain service. Loads the Route 53 knowledge: public and private hosted zones, record types (A/AAAA, CNAME, alias, MX, TXT, NS, SRV, CAA), alias records for AWS targets (CloudFront/ALB/S3) vs CNAME, routing policies (simple, weighted, latency, failover, geolocation, geoproximity, multivalue), health checks and DNS failover, traffic flow policies, domain registration and transfers, DNSSEC signing, query logging, and least-privilege IAM. Covers how to create zones and records, pick a routing policy, wire health-check failover, sign with DNSSEC, and verify resolution. Consumed by the Route 53 specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology via network-design — this owns the Route 53 DNS service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, route53, dns, hosted-zone, routing-policy, health-check, dnssec]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Route 53

AWS's highly available, scalable **DNS** and domain-name service. It hosts your zones, answers DNS
queries globally, registers domains, and offers traffic-management routing policies with health
checks for automatic DNS failover.

## Core concepts and components
- **Hosted zone** — a container for the records of a domain. **Public** zones answer internet
  queries; **private** zones answer only inside associated VPCs (split-horizon DNS).
- **Records** — A/AAAA, CNAME, MX, TXT, NS, SOA, SRV, CAA, etc. **Alias records** are a Route 53
  extension that point a zone apex or subdomain at AWS targets (CloudFront, ALB/NLB, S3 website, API
  Gateway, another R53 record) for free and at the apex (where CNAME is illegal).
- **Routing policies** — **simple**, **weighted** (split %), **latency** (nearest Region),
  **failover** (primary/secondary via health checks), **geolocation** (by user country/continent),
  **geoproximity** (by distance with bias), **multivalue answer** (up to 8 healthy answers).
- **Health checks** — monitor endpoint health (HTTP/HTTPS/TCP), CloudWatch alarms, or calculated
  checks; drive failover and remove unhealthy answers.
- **DNSSEC** — origin-authentication signing of a public zone (KMS asymmetric key).
- **Query logging** — public-zone query logs to CloudWatch.

## Configuration and sizing
- Use **alias** records for AWS targets (apex-safe, no extra query charge) and CNAME only for
  non-apex external targets. Pick the routing policy by intent (weighted for canary/blue-green,
  latency for global perf, failover for HA, geo for compliance/locale). Keep TTLs low on records you
  fail over, higher on stable records to cut query cost/latency.

## Security and IAM
- Scope `route53:ChangeResourceRecordSets` per **hosted zone** with least-privilege IAM (a fat zone
  policy is a takeover risk). Enable **DNSSEC** on public zones to prevent spoofing; set a **CAA**
  record to restrict which CAs may issue certs. Use private hosted zones for internal names. Enable
  query logging + CloudTrail.

## Cost levers
- Priced per hosted zone/month + per million queries (alias-to-AWS queries are free) + health
  checks. Consolidate records into fewer zones, use alias targets, and right-size health-check
  frequency/regions. Domain registration is billed annually per TLD.

## Scaling and limits
- DNS resolution scales globally and automatically. Watch limits on records per zone, hosted zones
  per account, and health checks; geoproximity/traffic-flow needs a traffic policy. NS delegation
  must match at the registrar for a public zone to resolve.

## Operating procedure
1. **Provision** — create the hosted zone (public or private+VPC) via Terraform `aws_route53_zone`
   or `aws route53 create-hosted-zone`; delegate NS at the registrar for public zones.
2. **Configure** — add records (alias to AWS targets), choose routing policies, create health checks
   and failover record sets, set TTLs.
3. **Secure** — per-zone least-privilege IAM, DNSSEC on public zones, CAA records, private zones for
   internal names, query logging.
4. **Verify** — apply [[verify-by-running]]: `list-resource-record-sets` shows the records/policies;
   `dig`/`nslookup` against the zone NS resolves to the expected target; failing the primary
   health check flips resolution to the secondary; `get-dnssec` shows signing active; an unauthorized
   principal cannot change records.

## Inputs
Domain(s) + apex/subdomain targets, public vs private (VPC) zones, routing intent (weighted/latency/
failover/geo), health-check endpoints, TTL strategy, DNSSEC/CAA requirements, registrar/NS details.

## Output
A hosted-zone + record-set definition (alias targets, chosen routing policy), health checks +
failover, DNSSEC/CAA, per-zone IAM, and verification of resolution, failover, and signing.

## Notes
- Gotchas: a public zone only resolves once registrar NS records match the zone's NS set; CNAME is
  illegal at the apex — use alias; latency routing uses AWS Region latency, not literal geography;
  health-checked failover needs low TTLs to flip quickly (caching resolvers honor TTL); DNSSEC needs
  the parent zone's DS record published; deleting a zone with live delegation breaks the domain.
- IaC/CLI: Terraform `aws_route53_zone`, `aws_route53_record`, `aws_route53_health_check`,
  `aws_route53_key_signing_key`, `aws_route53_query_log`. CLI `aws route53 create-hosted-zone`,
  `change-resource-record-sets`, `create-health-check`, `list-resource-record-sets`. CloudFormation
  `AWS::Route53::HostedZone`, `AWS::Route53::RecordSet`, `AWS::Route53::HealthCheck`.
