---
name: azure-attestation
description: Use when designing, provisioning, configuring, or operating Microsoft Azure Attestation — the unified remote-attestation service that verifies a platform and the integrity of the code running inside a Trusted Execution Environment before secrets are released (Azure Attestation). Covers remote attestation of TEEs — Intel SGX enclaves, AMD SEV-SNP confidential VMs, TPM boot/runtime measurements, and Trusted Launch guest attestation — attestation providers/endpoints, policies (the claims/rules deciding pass/fail), the signed JWT token a relying party consumes, policy signing, and integration with confidential computing + secret release. Loads the knowledge: create a provider, author and sign policies, wire relying parties, secure access, and verify a token validates. Consumed by the azure-attestation specialist and by the Azure role team (azure-security-reviewer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Attestation).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-attestation, security, remote-attestation, confidential-computing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Attestation

**Microsoft Azure Attestation (MAA)** is the unified **remote attestation** service. It cryptographically
verifies that a workload is running on a genuine, trustworthy platform — inside a **Trusted Execution
Environment (TEE)** with the expected code — and issues a signed token a **relying party** uses to decide
whether to release secrets or grant trust. This skill owns the **single-service attestation layer** —
providers, policies, relying-party wiring, and token verification.

## Core concepts and components
- **Remote attestation** — the flow where a TEE produces an **evidence/quote**, MAA validates it against a
  **policy**, and returns a signed **attestation token (JWT)**; a relying party validates the token before
  trusting the workload or releasing secrets.
- **Supported TEEs / scenarios** — **Intel SGX** enclaves (open enclave / Open Enclave SDK), **AMD SEV-SNP**
  **confidential VMs**, **TPM**-based attestation (platform/boot/runtime measurements), and **Trusted Launch**
  VM **guest attestation**.
- **Attestation provider** — the regional MAA instance with its own **endpoint**; there's also a **shared**
  default provider per region. You create a provider to host **custom policies**.
- **Attestation policy** — rules in the **attestation policy language** that inspect claims (MRENCLAVE,
  MRSIGNER, ISV SVN, TCB, boot measurements, etc.) and decide **allow/deny** plus which claims to emit. Policies
  are **per attestation type** (SGX, SEV-SNP, TPM).
- **Policy signing / management** — policies can be **unsigned** or **signed** (signing keys/certs enforce that
  only authorized policies apply); provider config can require signed policies.
- **Token & relying party** — the output is a **signed JWT**; the relying party (e.g. Key Vault secure key
  release, an app, or a confidential workload) **validates the signature and claims** before trusting.

## Configuration and sizing
- Create an **attestation provider** in the workload's region (or use the shared one), set whether policies
  must be **signed**, author a **policy per attestation type** that enforces the right measurements (MRENCLAVE/
  MRSIGNER/TCB or boot measurements), and point **relying parties** at the provider endpoint and signing keys.

## Security and IAM
- Control-plane (create provider, manage policy) via **Entra ID + Azure RBAC** (**Attestation Contributor /
  Reader**, and policy-specific roles). Enforce **signed policies** so only authorized rules apply, restrict who
  can edit policy, isolate the provider with **private endpoints** where supported, and have relying parties
  **validate the JWT signature + issuer + claims** strictly. MAA itself holds **no workload secrets** — it only
  issues trust assertions; secret release is the relying party's (e.g. Key Vault SKR) job.

## Cost levers
- Billed per **attestation operation** (token issuance). Levers: use the **shared regional provider** when you
  don't need custom policy, **cache/reuse** tokens within their validity rather than attesting every request,
  and consolidate providers per region instead of per workload.

## Scaling and limits
- MAA is a regional managed service that scales with request volume; tokens have a **validity window** so
  relying parties should cache within it. Limits: policies are **per attestation type**; signed-policy
  management adds key-rotation overhead; provider availability is **region-scoped**; relying parties must
  **pin/validate** the correct signing certificate and issuer, or attestation provides no real security.

## Operating procedure
1. **Provision** — create an **attestation provider** via Terraform `azurerm_attestation_provider`, Bicep
   `Microsoft.Attestation/attestationProviders`, or `az attestation create`.
2. **Configure** — author and apply the **policy per attestation type** (SGX/SEV-SNP/TPM) with the required
   measurement checks (`az attestation policy set` / `azurerm_attestation_provider` policy), set **policy
   signing** if required, and configure **relying parties** (e.g. Key Vault **secure key release**) with the
   provider endpoint + signing certs.
3. **Secure** — scope **RBAC** (Attestation Contributor/Reader), enforce **signed policies**, restrict policy
   editing, and ensure relying parties **strictly validate** the token (signature, issuer, claims).
4. **Verify** — apply [[verify-by-running]]: confirm the provider and policy
   (`az attestation show` / `az attestation policy show`), then run an **attestation** from the TEE and confirm
   it returns a **signed token** whose claims a relying party **validates and accepts** (and that a bad
   measurement is **rejected**). Capture state and result.

## Inputs
The **TEE type(s)** to attest (SGX / SEV-SNP confidential VM / TPM / Trusted Launch), the **measurements/claims**
the policy must enforce, whether **policy signing** is required, the **relying party** (Key Vault SKR, app,
confidential workload) and its validation config, the **region**, and the RBAC model.

## Output
An Azure Attestation setup: an attestation provider with per-type policies enforcing the right measurements,
optional policy signing, relying parties wired to validate the issued JWT, scoped RBAC — plus verification
that a genuine TEE attests successfully and a non-conforming measurement is rejected.

## Notes
- Gotchas: attestation is only as strong as the **policy** and the relying party's **strict JWT validation**
  (signature + issuer + claims) — a permissive policy gives false trust; policies are **per attestation type**;
  **signed policies** add key rotation overhead; MAA **holds no secrets** (secret release is Key Vault SKR /
  the relying party); token **validity windows** mean cache, don't re-attest every call; provider is
  region-scoped. Broad posture review is the role team's call. 2nd consumer: the Azure role team
  (azure-security-reviewer / azure-cloud-architect / azure-iac-engineer). Confidential-computing peers: AWS
  Nitro Enclaves attestation, GCP Confidential Space attestation.
- IaC/CLI: Terraform `azurerm_attestation_provider`; Bicep/ARM `Microsoft.Attestation/attestationProviders`.
  CLI `az attestation create` / `az attestation policy set` / `az attestation policy show`.
