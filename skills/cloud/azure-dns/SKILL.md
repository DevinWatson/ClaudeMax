---
name: azure-dns
description: Use when designing, provisioning, securing, or operating Azure DNS — Azure's managed DNS hosting for public internet name resolution and private in-VNet resolution (Azure DNS). Covers public DNS zones (with registrar NS delegation), private DNS zones (split-horizon resolution via VNet links, optional VM auto-registration), record sets (A/AAAA/CNAME/MX/TXT/SRV/NS/SOA/CAA/PTR) and TTLs, alias records pointing dynamically at Azure resources (public IPs, Front Door, Traffic Manager), zone delegation and child zones, and the DNS Private Resolver for hybrid forwarding. Loads the knowledge: create zones, manage record sets and alias records, delegate, link private zones to VNets, secure, provision, and verify resolution. Consumed by the azure-dns specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure DNS).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-dns, networking, dns, name-resolution]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure DNS

Azure's **managed DNS hosting** for **public** internet name resolution and **private** in-VNet resolution.
This skill owns the **DNS zone/record managed-service layer** — public and private zones, record sets, alias
records, delegation, and VNet links. (DNS-based **global traffic routing** is **Traffic Manager**; this skill
is authoritative name hosting, not health-based routing.)

## Core concepts and components
- **Public DNS zones** — host a domain on Azure's name servers. Resolution works only after the registrar
  **delegates** the domain (NS records at the parent point to the zone's assigned Azure name servers).
- **Private DNS zones** — internal resolution inside VNets via **virtual network links**; supports
  **split-horizon** (same name, different answer internally vs externally) and optional **auto-registration**
  of VM A records on a linked VNet.
- **Record sets** — collections of records of one type for a name: **A/AAAA, CNAME, MX, TXT, SRV, NS, SOA,
  CAA, PTR**; each set has a **TTL**. (CNAME cannot coexist with other types at the same name.)
- **Alias records** — **A/AAAA/CNAME** that point **dynamically** at an Azure resource (public IP, **Front
  Door**, **Traffic Manager**, CDN), updating automatically and allowing apex/zone-root targeting.
- **Delegation / child zones** — delegate subdomains to separate zones via **NS** record sets.
- **DNS Private Resolver** — managed inbound/outbound endpoints + forwarding rulesets for **hybrid** on-prem
  ↔ Azure DNS resolution (replaces custom DNS-forwarder VMs).

## Configuration and sizing
- Create a **public zone** and set the registrar's **NS delegation** to Azure's name servers; create **private
  zones** and **link** them to the relevant VNets (enable **auto-registration** where useful); add **record
  sets** with appropriate **TTLs** and **alias records** for Azure resources; delegate **child zones** and add
  a **DNS Private Resolver** for hybrid forwarding.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (DNS Zone Contributor / Private DNS Zone Contributor) — scope
  per zone. Keep **private zones** off the public internet (resolution only via linked VNets), use **alias
  records** so targets update automatically (avoids dangling records), publish **CAA** records to constrain
  certificate issuance, and protect against **dangling DNS / subdomain takeover** by removing records for
  decommissioned resources.

## Cost levers
- Bills on **hosted zones (per zone/month)** + **DNS queries (per million)**. Levers: consolidate records into
  fewer zones where sensible, use **alias records** (no extra query cost and self-healing), set sensible
  **TTLs** to balance freshness vs query volume, and remove unused zones. The DNS Private Resolver bills per
  endpoint/hour + queries.

## Scaling and limits
- Azure DNS scales to **very high query volumes** with anycast and a high-availability SLA. Limits: public
  resolution requires correct **registrar NS delegation** (a common misconfig); **CNAME** can't sit at the
  zone apex (use an **alias A/AAAA**) and can't coexist with other record types at the same name; **private
  zones** resolve only via **VNet links**; per-zone record-set limits apply; **TTL/propagation** delays mean
  changes aren't instant.

## Operating procedure
1. **Provision** — create the **public/private zone(s)** via Terraform `azurerm_dns_zone` /
   `azurerm_private_dns_zone` (+ `azurerm_private_dns_zone_virtual_network_link`), Bicep
   `Microsoft.Network/dnsZones` / `privateDnsZones`, or `az network dns zone create` / `az network
   private-dns zone create`.
2. **Configure** — add **record sets** (`azurerm_dns_a_record` etc.), **alias records** to Azure resources,
   set **TTLs**, **link** private zones to VNets (auto-registration), **delegate** child zones, and add a
   **DNS Private Resolver** for hybrid.
3. **Secure** — set the registrar **NS delegation** for public zones, scope **RBAC** per zone, keep private
   zones VNet-only, add **CAA** records, and remove records for decommissioned resources (avoid dangling DNS).
4. **Verify** — apply [[verify-by-running]]: confirm the zone provisioned and records present (`az network dns
   record-set list`), then **resolve the name** against the zone's name servers (public) or from a linked VNet
   (private) — e.g. `dig`/`nslookup` / `Resolve-DnsName` — and confirm the expected answer and TTL. Capture
   state and result.

## Inputs
The domain(s) and whether resolution is public/private, the record sets (type, value, TTL) and any alias
targets (Front Door/Traffic Manager/public IP), VNets to link for private zones (and auto-registration),
child-zone delegations, hybrid forwarding needs (Private Resolver), and RBAC scope.

## Output
An Azure DNS setup: public zone(s) with correct registrar NS delegation and private zone(s) linked to the
right VNets, record sets with sensible TTLs, alias records for Azure resources, child-zone delegation, CAA
records, scoped RBAC — plus verification that names resolve to the expected answers publicly and privately.

## Notes
- Gotchas: public resolution **does nothing until the registrar delegates** NS to Azure's name servers;
  **CNAME at the apex is illegal** — use an **alias A/AAAA**; CNAME can't coexist with other types at a name;
  **private zones resolve only via VNet links**; **TTL/propagation** delays mean updates aren't instant;
  **dangling DNS** to deleted resources enables **subdomain takeover** — remove stale records. For DNS-based
  global, health-aware routing use **Traffic Manager** (not authoritative zones). Broad DNS strategy is the
  role team's call via network-design. 2nd consumer: the Azure role team (azure-networking-engineer /
  azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS Route 53, GCP Cloud DNS.
- IaC/CLI: Terraform `azurerm_dns_zone` / `azurerm_private_dns_zone` (+ record-set resources /
  `azurerm_private_dns_zone_virtual_network_link`); Bicep/ARM `Microsoft.Network/dnsZones` /
  `privateDnsZones`. CLI `az network dns zone/record-set` / `az network private-dns zone/link`.
