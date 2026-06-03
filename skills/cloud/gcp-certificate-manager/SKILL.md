---
name: gcp-certificate-manager
description: Use when designing, provisioning, securing, or operating Certificate Manager — Google Cloud's service for acquiring, storing, and deploying TLS/SSL certificates at scale on load balancers (Certificate Manager). Covers Google-managed certs (publicly trusted, auto-renewed) with DNS authorizations and load-balancer authorization, CAA control and import from CA Service, self-managed (imported) certs, certificate maps and entries (hostname/SNI to cert, with primary/catch-all), wildcard/SAN certs, trust config for mTLS, and attachment to external Application Load Balancers, plus IAM, cost, scaling, and limits. Loads the Certificate Manager knowledge: provision Google-managed or imported certs, validate via DNS authorization, build certificate maps, attach to load balancers, and verify TLS serves the right cert. Consumed by the Certificate Manager specialist and by the GCP role team (gcp-cloud-architect / gcp-networking-engineer / gcp-security-reviewer) when wiring TLS termination (Certificate Manager).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, certificate-manager, security, tls, ssl, certificates]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Certificate Manager

Google Cloud's service for **acquiring, storing, and deploying TLS/SSL certificates at scale** — primarily
**Google-managed public-trust certificates** (auto-issued and auto-renewed) and **self-managed (imported)**
certificates — and mapping them by hostname to load-balancer frontends. It is the public-trust counterpart
to the private-PKI Certificate Authority Service.

## Core concepts and components
- **Certificate** — a TLS cert: **Google-managed** (publicly trusted, **auto-renewed**, validated via DNS or
  load-balancer authorization) or **self-managed** (you import cert + private key, including from CA Service
  for private trust). Supports **wildcard** and **SAN/multi-domain** certs.
- **DNS authorization** — proves domain ownership for Google-managed certs by creating a **CNAME** record;
  enables issuance for wildcards and decoupled (per-project) validation, independent of where the LB lives.
- **Certificate map** — a named collection of **map entries** that route by **hostname/SNI** to a specific
  certificate, with a **primary (catch-all)** entry; attach the map to a load balancer so one frontend can
  serve many hostnames/certs.
- **Load-balancer authorization** — alternative validation that issues for the domains pointed at the LB
  (simpler, but less flexible than DNS authorization).
- **Trust config** — CA trust anchors / intermediate bundles used for **mTLS** (client-certificate
  validation) on the load balancer.
- **CAA / CA-Authorization** — control which CAs may issue for your domains.
- **Deployment targets** — global and regional **external Application Load Balancers** (and other supported
  frontends); a cert/map is attached to the LB's target proxy.

## Configuration and sizing
- Prefer **Google-managed certs with DNS authorization** (auto-renewal, supports wildcards, decoupled from
  the LB) for public endpoints; use **self-managed/imported** when you need a specific CA or private trust
  (e.g. from CA Service). Use a **certificate map** with per-hostname entries + a **primary** entry for
  multi-tenant/multi-domain frontends. Add a **trust config** when terminating **mTLS**.

## Security and IAM
- Grant least-privilege Certificate Manager IAM (`roles/certificatemanager.editor` / `...owner` to a narrow
  set, `...viewer` for read). Protect **imported private keys** (store/source from Secret Manager, never in
  code). Use **CAA** to restrict authorized CAs. For mTLS, manage the **trust config** carefully (it defines
  who is allowed to connect). Keep DNS-authorization CNAMEs in place — removing them blocks renewal.

## Cost levers
- Google-managed certificate issuance/renewal is generally low/no direct cost; cost is dominated by the
  **load balancer** that serves the cert and any **CA Service** issuance for private certs. Levers:
  consolidate hostnames behind a **certificate map** on one LB rather than many LBs, and use **wildcard**
  certs to cut per-host cert count.

## Scaling and limits
- Designed for **many certificates/domains per frontend** via certificate maps (far beyond the small
  classic SSL-certificate-per-proxy limits). Bounds exist on certificates per project, map entries per map,
  SANs per cert, and DNS-authorization/issuance throughput. Google-managed issuance **requires DNS/LB
  validation to succeed** before the cert goes ACTIVE.

## Operating procedure
1. **Provision** — enable the Certificate Manager API; for Google-managed certs create a **DNS
   authorization** (and add the **CNAME**) or plan **LB authorization**; for self-managed certs prepare the
   cert/key (or source from CA Service).
2. **Configure** — create the **certificate** (Google-managed referencing the DNS authorization, or
   imported), build a **certificate map** with per-hostname **entries** + a **primary** entry, add a **trust
   config** if doing mTLS.
3. **Secure** — grant least-privilege IAM, source imported private keys from **Secret Manager**, set **CAA**,
   and keep DNS-authorization records in place.
4. **Verify** — apply [[verify-by-running]]: confirm the cert reaches **ACTIVE**
   (`gcloud certificate-manager certificates describe`), attach the **map** to the LB, then
   `curl -v https://<host>` / `openssl s_client -servername <host> -connect <lb-ip>:443` and confirm the
   **served cert/SNI matches** the expected hostname and chain (and mTLS rejects an untrusted client if
   configured) — capture the ACTIVE status and the TLS handshake.

## Inputs
The hostnames/domains to serve, public vs private trust (Google-managed vs imported/CA Service), validation
method (DNS authorization vs LB authorization), wildcard/SAN needs, the load-balancer frontend(s) to attach
to, mTLS/trust-config requirements, the IAM model, and CAA constraints.

## Output
A Certificate Manager configuration (Google-managed and/or imported certificates, DNS authorizations,
certificate map with per-hostname entries + primary, trust config for mTLS, LB attachment) with
least-privilege IAM, plus verification that the cert is ACTIVE and TLS serves the correct cert for each
hostname.

## Notes
- Gotchas: a **Google-managed cert stays PROVISIONING/FAILED until DNS/LB validation succeeds** (missing or
  wrong **CNAME** is the classic cause); removing the **DNS-authorization record breaks auto-renewal**;
  forgetting the **primary (catch-all) map entry** means unmatched SNI gets no cert; **imported private keys**
  must be protected (Secret Manager); Certificate Manager certs use **certificate maps**, not the legacy
  per-proxy `ssl-certificates` model — don't mix paradigms on one frontend; **CAA** records can block
  issuance if they exclude Google's CA.
- IaC/CLI: Terraform `google_certificate_manager_certificate` (managed/self_managed),
  `google_certificate_manager_dns_authorization`, `google_certificate_manager_certificate_map`,
  `google_certificate_manager_certificate_map_entry`, `google_certificate_manager_trust_config`, plus the LB
  `google_compute_target_https_proxy` `certificate_map` attachment. CLI
  `gcloud certificate-manager certificates|maps|dns-authorizations` and `curl`/`openssl s_client` to verify.
