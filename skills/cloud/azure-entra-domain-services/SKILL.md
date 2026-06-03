---
name: azure-entra-domain-services
description: Use when designing, provisioning, securing, or operating Microsoft Entra Domain Services — managed Active Directory Domain Services (AD DS) in Azure providing domain join, LDAP, Kerberos, and NTLM without running domain controllers (Microsoft Entra Domain Services). Covers the managed domain instance and its dedicated subnet/VNet, one-way sync from Entra ID (users/groups/credentials), domain join for Windows/Linux VMs, legacy auth protocols (LDAP/LDAPS, Kerberos, NTLM), group policy and organizational units, secure LDAP exposure, replica sets for HA/geo, and Entra/RBAC. Loads the knowledge: provision the managed domain into a VNet, configure DNS and secure LDAP, domain-join workloads, secure protocols, and verify join/auth and LDAP queries work. Consumed by the entra-domain-services specialist and by the Azure role team when standing up the managed service (Microsoft Entra Domain Services).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-entra-domain-services, identity, managed-ad, ldap]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Entra Domain Services

**Managed Active Directory Domain Services (AD DS)** in Azure — domain join, **LDAP**, **Kerberos**, and
**NTLM** for legacy/IaaS workloads **without you running domain controllers**. Microsoft operates the DCs,
patching, and HA. This skill owns the **managed-domain layer**: the instance, networking/DNS, protocols, and
domain join.

## Core concepts and components
- **Managed domain** — a Microsoft-operated AD DS domain (you pick a DNS domain name) deployed into **your
  VNet** on a **dedicated subnet**; you don't get Domain/Enterprise Admin (it's managed) but get an **AAD DC
  Administrators** group for delegated tasks.
- **One-way sync from Entra ID** — users, groups, and **password hashes** sync **from Entra ID into the managed
  domain** (one-way); cloud-only accounts need a password change to sync usable hashes. Changes flow Entra →
  managed domain, never back.
- **Domain join** — Windows and Linux VMs join the managed domain for centralized auth/SSO; legacy apps use
  **LDAP/Kerberos/NTLM** they couldn't get from cloud Entra ID.
- **Protocols** — **LDAP** (and **secure LDAP / LDAPS** over the internet or VNet with a cert), **Kerberos**,
  **NTLM** (can disable weak NTLM v1/legacy ciphers).
- **OUs & Group Policy** — a built-in OU structure plus custom OUs; **Group Policy** via the AADDC Computers/
  Users containers (managed via standard GPMC tools).
- **Replica sets** — additional **replica sets** in other regions/VNets for HA and geo-distribution.

## Configuration and sizing
- Choose a **SKU** (Standard/Enterprise/Premium — differ by object count, replica-set count, and backup
  frequency), deploy into a **dedicated subnet** in a peered VNet, set the VNet **DNS** to the managed domain's
  IPs, and enable **secure LDAP** if external LDAP is needed. Add **replica sets** for HA/geo.

## Security and IAM
- Administration is delegated via the **AAD DC Administrators** group (no full Domain Admin). Harden by
  **disabling NTLM v1/legacy ciphers** and unsynced password hashes where possible, enabling **LDAPS** (never
  expose plain LDAP to the internet), restricting the subnet with an **NSG** (allow only required AD ports),
  and scoping **Entra RBAC** on the resource. The sync is **one-way** — manage identities in Entra ID.

## Cost levers
- Billed **per hour by SKU** (Standard/Enterprise/Premium) plus **per replica set**. Levers: choose the **lowest
  SKU** that meets object count/backup needs, add **replica sets** only where HA/geo truly requires, and
  decommission if a pure-cloud (Entra ID / Kerberos for cloud) approach removes the legacy-protocol need.

## Scaling and limits
- Object count and replica-set count are bounded by **SKU**; the managed domain runs in **one forest/one
  domain** (no trusts on lower SKUs; forest trusts on Enterprise+). You **cannot** schema-extend or get Domain
  Admin. Initial provisioning + first sync takes time. DNS misconfiguration is the most common break.

## Operating procedure
1. **Provision** — create the managed domain (`azurerm_active_directory_domain_service` / portal) into a
   **dedicated subnet** in a VNet, pick the **SKU** and DNS domain name.
2. **Configure** — set the **VNet DNS** to the managed domain IPs, enable **secure LDAP (LDAPS)** with a cert if
   needed, define **OUs/GPOs**, and add **replica sets** for HA/geo.
3. **Secure** — restrict the subnet with an **NSG**, **disable NTLM v1/legacy ciphers**, require **LDAPS** for
   external LDAP, delegate via **AAD DC Administrators**, and scope Entra RBAC.
4. **Verify** — apply [[verify-by-running]]: confirm the domain is **Running** and synced
   (`az ad ds show` / portal health), **domain-join** a test VM and authenticate with a synced account, run an
   **LDAP/LDAPS** query (`ldapsearch`/`Get-ADUser`) against the managed domain, and confirm **Kerberos** ticket
   issuance. Capture state and result.

## Notes
- Gotchas: identity sync is **one-way (Entra → managed domain)** so manage users in Entra ID; **cloud-only
  users must reset their password** before their hash syncs for legacy auth; **DNS** on the VNet must point at
  the managed domain — the #1 join failure; **never expose plain LDAP** to the internet (LDAPS only); you do
  **not** get Domain Admin and **cannot extend the schema**; provisioning/sync is slow. 2nd consumer: the
  Azure role team (azure-iam-engineer / azure-cloud-architect / azure-iac-engineer). Sibling
  azure-microsoft-entra-id is the cloud IdP this syncs from. Cross-cloud peer: AWS Managed Microsoft AD.
- IaC/CLI: Terraform `azurerm_active_directory_domain_service` (+ `_replica_set`); Bicep/ARM
  `Microsoft.AAD/domainServices`. CLI `az ad ds` and standard AD tooling (GPMC, `ldapsearch`, `Get-ADUser`).

## Inputs
The DNS domain name and VNet/subnet placement, SKU (object/replica needs), DNS strategy, legacy-protocol
requirements (LDAP/LDAPS/Kerberos/NTLM), workloads to domain-join, OU/GPO design, HA/geo (replica sets),
security hardening (NSG, NTLM/cipher policy), and region/subscription.

## Output
A Microsoft Entra Domain Services setup: a managed AD DS domain in a dedicated subnet with VNet DNS pointed at
it, LDAPS enabled where needed, hardened protocols/NSG, OUs/GPOs, replica sets for HA — plus verification that
domain join, Kerberos/NTLM auth, and LDAP queries work.
