---
name: azure-key-vault
description: Use when designing, provisioning, securing, or operating an Azure Key Vault — the managed service for storing and controlling access to secrets, keys, and certificates (Azure Key Vault). Covers the three object types (secrets, keys, certificates with auto-rotation/issuer integration), the two SKUs (Standard software-protected vs Premium HSM-backed FIPS 140-2 Level 2), the authorization model (legacy access policies vs Azure RBAC), data protection (soft-delete + purge protection, versioning), network isolation (firewall, private endpoints), managed identities for app access, rotation, and Managed HSM as the single-tenant option. Loads the knowledge: provision the vault, choose RBAC vs access policies, enable soft-delete/purge protection + private endpoints, store objects, and verify access. Consumed by the azure-key-vault specialist and by the Azure role team (azure-security-reviewer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Key Vault).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-key-vault, security, secrets, keys]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Key Vault

**Azure Key Vault** is the managed service for storing and controlling access to **secrets**, **cryptographic
keys**, and **certificates**, with a hardware-protection option. It centralizes sensitive material out of code
and config, gates access through Entra ID, and supports rotation and auditing. This skill owns the
**single-vault managed-service layer** — provisioning, authorization model, data protection, network
isolation, and object lifecycle.

## Core concepts and components
- **Object types** — **secrets** (arbitrary strings: passwords, connection strings), **keys** (RSA/EC for
  encrypt/decrypt/sign/wrap; never exported), and **certificates** (X.509 with policy, **auto-rotation**, and
  CA **issuer** integration). All support **versioning**.
- **SKUs** — **Standard** (software-protected) and **Premium** (**HSM-backed**, FIPS 140-2 **Level 2**). For
  single-tenant FIPS 140-2 **Level 3**, use **Azure Managed HSM** (a separate offering).
- **Authorization model** — two options for the data plane: legacy **vault access policies** (per-identity
  permission lists, vault-wide) vs **Azure RBAC** (granular, scoped, auditable roles like *Key Vault Secrets
  User/Officer*, *Crypto User*). **RBAC is recommended.** Control plane is always Azure RBAC.
- **Data protection** — **soft-delete** (recovers deleted objects/vault within a retention window; on by
  default) and **purge protection** (blocks permanent deletion until retention elapses — irreversible once on).
- **Network isolation** — vault **firewall** (selected networks/IPs), **service endpoints**, and **private
  endpoints (Private Link)** to keep the vault off the public internet.
- **App access** — apps authenticate with **managed identities** (system/user-assigned) and read secrets at
  runtime; integrate with **Key Vault references** in App Service/Functions and the **CSI Secrets Store** in AKS.
- **Rotation** — **key/secret rotation policies** and certificate auto-renewal reduce long-lived credentials.

## Configuration and sizing
- Pick the **SKU** (Premium only if you need HSM-backed keys), choose **Azure RBAC** over access policies, turn
  on **soft-delete** (default) and decide on **purge protection** (recommended for prod), and plan **network
  isolation** (private endpoint + firewall deny-public) and which **managed identities** read which objects.

## Security and IAM
- Control plane via **Entra ID + Azure RBAC**; data plane via **Key Vault RBAC roles** (Secrets/Certificates/
  Crypto User vs Officer) scoped least-privilege per identity. Apps use **managed identities** (no stored
  creds). Enable **purge protection** + **soft-delete**, restrict network with **private endpoints/firewall**,
  enable **diagnostic logging** to Log Analytics/Sentinel, and rotate keys/secrets/certs on a policy.

## Cost levers
- Billed per **operation** (transactions) plus **HSM key** charges (Premium) and any **managed HSM** pool
  (hourly). Levers: prefer **Standard** unless HSM is required, **cache** secrets in the app instead of reading
  per request, consolidate vaults sensibly (one per app/environment for blast-radius isolation but avoid
  per-secret sprawl), and avoid chatty per-call crypto where a wrapped data-key pattern fits.

## Scaling and limits
- Key Vault enforces **per-vault transaction throttling** (RPS limits per operation type) — hot paths must
  **cache**, not call per request. **Purge protection is irreversible** once enabled. Soft-deleted vault names
  are reserved during retention. HSM key operations and managed HSM have their own limits. Plan separate vaults
  per environment for isolation and to spread throttling.

## Operating procedure
1. **Provision** — create the vault via Terraform `azurerm_key_vault` (`sku_name`, `enable_rbac_authorization`,
   `soft_delete_retention_days`, `purge_protection_enabled`), Bicep `Microsoft.KeyVault/vaults`, or
   `az keyvault create`.
2. **Configure** — choose **RBAC** authorization, add **objects** (`azurerm_key_vault_secret` / `_key` /
   `_certificate`), set **rotation policies**, and wire **managed identities** + Key Vault references / CSI for
   apps.
3. **Secure** — assign **Key Vault RBAC** roles least-privilege, enable **purge protection**, restrict network
   with **private endpoints + firewall (deny public)**, and turn on **diagnostic logging** to Sentinel/Log
   Analytics.
4. **Verify** — apply [[verify-by-running]]: confirm the vault and its settings
   (`az keyvault show` — RBAC, soft-delete, purge protection), confirm an authorized identity can **read** an
   object and an unauthorized one is **denied** (`az keyvault secret show`), and confirm the **private endpoint**
   resolves privately. Capture state and result.

## Inputs
The vault's **SKU** (Standard/Premium/Managed HSM need), **authorization model** (RBAC vs access policies),
**data-protection** requirements (soft-delete retention, purge protection), **network** model (private
endpoint/firewall), the **objects** to store (secrets/keys/certs) and rotation policy, and which **managed
identities** need which access.

## Output
An Azure Key Vault setup: a vault with the right SKU, **Azure RBAC** authorization, soft-delete + purge
protection, private-endpoint/firewall network isolation, stored secrets/keys/certificates with rotation,
managed-identity app access, and diagnostic logging — plus verification that authorized access succeeds,
unauthorized access is denied, and the vault is private.

## Notes
- Gotchas: **purge protection is irreversible** (enable deliberately); soft-deleted **vault names are reserved**
  during retention (recover or wait); **transaction throttling** means apps must **cache** secrets, not read per
  request; prefer **Azure RBAC** over access policies; certificate auto-rotation needs a configured **issuer**;
  enabling private endpoint without DNS leaves apps unable to resolve. Broad posture review is the role team's
  call. 2nd consumer: the Azure role team (azure-security-reviewer / azure-cloud-architect / azure-iac-engineer).
  Cross-cloud peers: AWS KMS + Secrets Manager + ACM, GCP Cloud KMS + Secret Manager.
- IaC/CLI: Terraform `azurerm_key_vault`, `azurerm_key_vault_secret` / `_key` / `_certificate`,
  `azurerm_key_vault_access_policy`, `azurerm_role_assignment` (for RBAC), `azurerm_private_endpoint`;
  Bicep/ARM `Microsoft.KeyVault/vaults`. CLI `az keyvault create` / `az keyvault secret set`.
