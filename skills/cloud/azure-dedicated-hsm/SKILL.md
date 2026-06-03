---
name: azure-dedicated-hsm
description: Use when designing, provisioning, securing, or operating Azure Dedicated HSM — single-tenant, bare-metal FIPS 140-2 Level 3 hardware security modules you fully own and administer inside your VNet (Azure Dedicated HSM). Covers the Thales Luna 7 (and Payment HSM / Thales payShield 10K for PIN/EFTPOS/PCI workloads) appliances, the single-tenant ownership model (Microsoft has no key access), VNet/private-IP deployment with subnet delegation, high-availability pairing and cross-region replication, client/partition setup, NTLS/STC client connections, and the migration boundary between Dedicated HSM, Managed HSM, and Key Vault. Loads the knowledge: provision the HSM appliance into a delegated subnet, configure HA, set up partitions and clients, secure access, and verify connectivity. Consumed by the azure-dedicated-hsm specialist and by the Azure role team (azure-security-reviewer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Dedicated HSM).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-dedicated-hsm, security, hsm, fips-140-2-level-3]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Dedicated HSM

**Azure Dedicated HSM** provides **single-tenant, bare-metal hardware security modules** certified to **FIPS
140-2 Level 3**, provisioned directly into your **virtual network**. Unlike multi-tenant Key Vault, you have
**full administrative ownership** of the device and its keys — Microsoft has **no access**. This skill owns the
**single-appliance managed-service layer** — provisioning into a delegated subnet, HA, partitions/clients, and
network access. It suits strict compliance and lift-and-shift of on-prem HSM-bound apps.

## Core concepts and components
- **Appliance** — **Thales Luna 7** network HSM (general-purpose crypto: key storage, PKI, code signing, TLS
  offload). For payments, **Azure Payment HSM** uses the **Thales payShield 10K** (PIN, EFTPOS, 3-D Secure,
  P2PE; PCI PTS HSM / PCI DSS / PCI 3DS aligned). Both are **FIPS 140-2 Level 3**.
- **Single-tenant ownership** — the device is dedicated to you; **you** administer it (admins, partitions,
  policies), and **Microsoft cannot access** the keys. You are responsible for HA, backup, and patch posture
  of the HSM software you run on clients.
- **VNet deployment** — the HSM is provisioned with a **private IP** into a **delegated subnet** of your VNet
  (`Microsoft.HardwareSecurityModules/dedicatedHSMs`); clients reach it over the network (NTLS/STC).
- **High availability** — deploy **pairs** in the **same region (different availability zones via stamps)** and
  optionally a second region for DR; HA and load balancing are handled by the **Luna HA group** on the client.
- **Partitions & clients** — you create **partitions** on the appliance and register **clients** (your VMs)
  with **NTLS** (or **STC** for secure trusted channel); apps use the **Luna/PKCS#11/JCE/CNG** client libraries.

## Configuration and sizing
- Choose **Luna 7** (general) vs **Payment HSM (payShield 10K)** for payments, deploy a **minimum of two**
  appliances for HA (different zones), allocate a **delegated subnet** sized for the HSMs + clients, and plan
  **cross-region** units for DR. Sizing is per-appliance (a fixed performance tier), not auto-scaling.

## Security and IAM
- The Azure **control plane** (provision/deprovision the appliance) uses **Entra ID + RBAC**, but **all
  cryptographic administration is on the device** — HSM admins, **partition** crypto-officers/users, roles, and
  policies live inside the HSM, not in Azure RBAC. Secure with **network isolation** (delegated subnet, NSGs,
  no public exposure), **STC** for client channels, strict **HSM admin** separation of duties, and your own
  **backup/cloning** of partitions. Microsoft has **no key access**.

## Cost levers
- Billed **per appliance per hour** (a premium fixed rate) plus the VNet/egress around it — there is **no
  consumption/per-operation** pricing and no scale-to-zero. Levers: deploy the **minimum HA count** that meets
  your SLA, right-size **client VMs**, and use **Managed HSM or Key Vault** instead when you don't need full
  single-tenant device ownership (Dedicated HSM is the most expensive option — justify it by compliance/lift).

## Scaling and limits
- You scale by **adding appliances** (manual) and load-balancing via the **client HA group** — there is no
  elastic autoscale. Limits: appliance availability is **region-limited**; the subnet must be **delegated** to
  the HSM resource; you own **patching/HA/backup** of the crypto stack; **no Microsoft access** means key loss
  is **unrecoverable** without your own backup; Payment HSM is a distinct SKU/onboarding.

## Operating procedure
1. **Provision** — create a **delegated subnet**, then provision the appliance(s) via ARM/Bicep
   `Microsoft.HardwareSecurityModules/dedicatedHSMs` (or the documented `az`/REST flow) — Terraform support is
   limited, so ARM/Bicep is typically the IaC path. Deploy **two** for HA.
2. **Configure** — initialize the HSM, create **partitions**, register **clients** (NTLS/STC), build the
   **Luna HA group** on clients, install the **PKCS#11/JCE/CNG** libraries, and set DR replication.
3. **Secure** — isolate with **delegated subnet + NSGs (no public exposure)**, use **STC**, enforce **HSM admin
   separation of duties**, and take **partition backups/clones** you own.
4. **Verify** — apply [[verify-by-running]]: confirm the appliance is provisioned with its private IP
   (`az resource show` on the dedicatedHSM / portal), then from a client run **`lunacm`** to confirm the HA
   group sees the partitions and a **test key operation** succeeds over NTLS/STC. Capture state and result.

## Inputs
The appliance type (**Luna 7** vs **Payment HSM**), the **region(s)** and HA/DR topology, the **VNet +
delegated subnet** plan, the **partition/client** layout, the **HSM admin** model and backup strategy, and the
compliance driver (FIPS 140-2 L3 / PCI) that justifies Dedicated HSM over Managed HSM/Key Vault.

## Output
An Azure Dedicated HSM setup: one or more single-tenant FIPS 140-2 Level 3 appliances in a delegated subnet,
an HA (and optional DR) topology, configured partitions and registered clients over NTLS/STC, network
isolation and HSM-side admin separation, owned partition backups — plus verification that the appliance is
reachable and a client crypto operation succeeds.

## Notes
- Gotchas: **most expensive** crypto option with **no scale-to-zero** — justify vs **Managed HSM/Key Vault**;
  **Microsoft has no key access**, so **you own backup** and key loss is unrecoverable; the subnet must be
  **delegated**; **region availability is limited**; you own **patching/HA**; Terraform coverage is thin (use
  **ARM/Bicep**); Payment HSM is a separate SKU. Broad posture review is the role team's call. 2nd consumer:
  the Azure role team (azure-security-reviewer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peer:
  AWS CloudHSM.
- IaC/CLI: ARM/Bicep `Microsoft.HardwareSecurityModules/dedicatedHSMs` (and `cloudHsmClusters` for the newer
  Cloud HSM); deploy with `az deployment group create`; subnet delegation via `azurerm_subnet` delegation /
  Bicep. Device admin via the **Thales Luna** client (`lunacm`, `vtl`) — not Azure CLI.
