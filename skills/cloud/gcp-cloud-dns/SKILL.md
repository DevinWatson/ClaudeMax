---
name: gcp-cloud-dns
description: Use when designing, provisioning, securing, or operating Cloud DNS — Google Cloud's scalable, authoritative, low-latency managed DNS service running on Google's global anycast name servers. Loads the Cloud DNS knowledge: create public and private managed zones, manage record sets (A/AAAA/CNAME/MX/TXT/SRV/etc.), enable DNSSEC for public zones, configure routing policies (weighted round-robin, geolocation, failover) and health checks, set up DNS peering/forwarding and split-horizon, plus IAM, logging, and cost/scaling levers. Consumed by the Cloud DNS specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they build name resolution for a platform (Cloud DNS).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-dns, networking, dns, dnssec, managed-zones, routing-policy]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud DNS

Google Cloud DNS is a scalable, reliable, authoritative managed DNS service served from Google's
**global anycast** name servers. You manage **zones** and **record sets** via API/IaC with a 100% SLA on
the public service, instead of running your own DNS infrastructure.

## Core concepts and components
- **Managed zones** — a container for the records of a DNS name (`example.com.`). **Public zones** are
  resolvable on the internet; **private zones** resolve only within attached VPC networks (split-horizon).
- **Record sets** — `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `SRV`, `NS`, `SOA`, `CAA`, `PTR` etc., each with a
  name, type, **TTL**, and rrdatas.
- **DNSSEC** — signs **public zone** responses to prevent spoofing/cache poisoning; you publish the
  zone's DS record at the registrar.
- **Routing policies** — **weighted round-robin** (traffic split), **geolocation** (answer by client
  region), and **failover** (primary/backup with **health checks**) for traffic management at the DNS
  layer.
- **DNS peering / forwarding** — **DNS forwarding zones** send queries to on-prem/another DNS;
  **DNS peering** lets one VPC use another's zones; **inbound/outbound server policies** integrate hybrid
  resolution.
- **Reverse lookup & private managed reverse zones** for PTR records.

## Configuration and sizing
- Choose public vs private (or both for split-horizon) per name. Set **TTLs** to balance change agility
  vs cache efficiency. Use **routing policies** for geo/weighted/failover traffic management; attach
  **health checks** for failover. Wire **forwarding/peering/server policies** for hybrid and shared-VPC
  resolution. Enable **DNSSEC** on public zones and publish the DS record at the registrar.

## Security and IAM
- Enable **DNSSEC** on public zones and verify the **DS record** at the registrar. Grant least-privilege
  IAM (`roles/dns.admin`, `roles/dns.reader`; scope record edits narrowly). Restrict **private zones** to
  the intended VPCs only; control hybrid forwarding targets. Enable **Cloud DNS query logging** (public
  and private) for audit/troubleshooting. Guard against accidental NS/SOA edits that can break a zone.

## Cost levers
- Cost is per **managed zone** (monthly) plus **per-query** charges (tiered by volume), and query logging
  storage. Consolidate zones, set sensible TTLs (longer TTLs reduce query volume and cost), and sample/scope
  query logging to control spend.

## Scaling and limits
- The anycast service scales to high query volumes automatically (public zones carry a 100% SLA). Limits:
  managed zones per project, record sets per zone, rrdatas per record set, and routing-policy targets;
  raise via quota requests. DNS changes propagate after the record TTL elapses in resolver caches.

## Operating procedure
1. **Provision** — enable the Cloud DNS API and create the **managed zone(s)** (Terraform
   `google_dns_managed_zone`, public or `private_visibility_config` bound to VPC networks).
2. **Configure** — add **record sets** (`google_dns_record_set`), set TTLs, and apply **routing policies**
   (weighted/geo/failover with health checks); set up **forwarding/peering/server policies** for hybrid.
3. **Secure** — enable **DNSSEC** on public zones (and publish DS at the registrar), grant least-privilege
   DNS IAM, scope private-zone VPC bindings, and enable query logging.
4. **Verify** — apply [[verify-by-running]]: resolve representative records against the zone's name
   servers (`dig @<ns> example.com A`, `gcloud dns record-sets list`), confirm **DNSSEC** validates
   (`dig +dnssec`, check DS at registrar), exercise a **routing policy** (geo/weighted/failover) and a
   **private-zone** lookup from an attached VPC, and confirm propagation respects TTL — capture the dig
   output and record listing.

## Inputs
Domains/zones to host (public, private, split-horizon), record sets and TTLs, traffic-management needs
(weighted/geo/failover + health checks), hybrid resolution requirements (forwarding/peering/server
policies), DNSSEC and registrar access, IAM model, logging requirements, and cost target.

## Output
Managed zone(s) with record sets and appropriate TTLs, routing policies and health checks, hybrid
forwarding/peering/server policies, DNSSEC on public zones with DS published, least-privilege DNS IAM and
query logging, plus verification of resolution, DNSSEC validation, and routing/private-zone behavior.

## Notes
- Gotchas: DNS changes only take effect after the **record TTL** expires in caches — lower TTLs before a
  planned cutover; **DNSSEC** is incomplete until the **DS record is published at the registrar**;
  private zones resolve only on **explicitly attached VPCs** (and require the right server policy for
  hybrid); editing **NS/SOA** records can break a zone; CNAME cannot coexist with other records at the
  same name; routing policies need correctly-configured health checks for failover.
- IaC/CLI: Terraform `google_dns_managed_zone`, `google_dns_record_set`, `google_dns_policy`,
  `google_dns_response_policy` / `..._rule`, plus `google_project_service`. CLI `gcloud dns managed-zones`,
  `gcloud dns record-sets` (`transaction` or `--rrdatas`), `gcloud dns dns-keys` (DNSSEC), and `gcloud dns
  policies` for forwarding/logging; verify with `dig`/`gcloud dns record-sets list`.
