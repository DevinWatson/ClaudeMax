---
name: aws-nitro-enclaves
description: Use when designing, provisioning, securing, or operating AWS Nitro Enclaves — isolated VMs carved from a parent EC2 instance, the vsock channel, enclave images (EIF), cryptographic attestation (PCRs), KMS attestation-based key release, and confidential-computing workloads that process sensitive data with no persistent storage or network (AWS Nitro Enclaves). Loads the Nitro Enclaves knowledge: how to allocate enclave resources, build an EIF, attest it, gate KMS decrypt on attestation, and verify the enclave runs. Consumed by the Nitro Enclaves specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) for confidential computing.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, nitro-enclaves, confidential-computing, attestation, kms, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Nitro Enclaves

Isolated, hardened virtual machines carved from a parent EC2 instance's CPU and memory, with no
persistent storage, no interactive access, and no external network — only a local `vsock` channel
to the parent. Use it to process highly sensitive data (keys, PII, PHI, secrets) with
cryptographic attestation so that even the parent instance's operators cannot see plaintext.

## Core concepts and components
- **Parent instance** — a Nitro-based EC2 with enclave support enabled; it donates dedicated
  vCPUs and memory to the enclave at launch.
- **Enclave** — the isolated VM; no SSH, no disk, no network — only `vsock`.
- **Enclave Image File (EIF)** — the built enclave image (from a container image via the Nitro
  CLI); measured into **PCRs** (platform configuration registers / hashes).
- **Attestation document** — signed evidence (PCRs, public key) the enclave produces to prove its
  identity and integrity to a relying party.
- **KMS attestation** — a KMS key policy condition (`kms:RecipientAttestation:PCRn`) that releases
  plaintext data keys only to an enclave whose PCRs match.

## Configuration and sizing
- Allocate enclave vCPUs/memory in the parent's allocator config; they are subtracted from the
  parent. Size memory for the workload — the enclave has no swap/disk.
- Build the EIF reproducibly so PCR0 is stable; pin base images and dependencies.

## Security and IAM
- The whole point is isolation + attestation: gate KMS `Decrypt`/`GenerateDataKey` on
  `kms:RecipientAttestation:PCR0` (and PCR8 for signing key) so only the exact enclave can decrypt.
- The parent's instance profile mediates AWS calls on the enclave's behalf over vsock (KMS proxy).
- No secrets in the EIF; secrets arrive encrypted and are only opened inside the enclave.

## Cost levers
- No extra charge for the enclave itself — you pay for the parent EC2. Right-size the parent;
  donate only the vCPUs/memory the enclave needs so the parent isn't oversized.

## Scaling and limits
- One or more enclaves per parent within donated capacity; scale by scaling the parent fleet
  (Auto Scaling). Not all instance types support enclaves; macOS/bare-metal/some types excluded.

## Operating procedure
1. **Provision** — launch a Nitro parent with `EnclaveOptions` enabled, install the Nitro CLI,
   and set the enclave allocator (CPUs/memory) via user data; Terraform `aws_instance` with
   `enclave_options { enabled = true }`.
2. **Configure** — build the EIF (`nitro-cli build-enclave` from a container image), record PCRs,
   run it (`nitro-cli run-enclave`), and wire the vsock KMS proxy.
3. **Secure** — KMS key policy with `kms:RecipientAttestation:PCR0` conditions; least-privilege
   parent instance profile; no plaintext secrets at rest.
4. **Verify** — apply [[verify-by-running]]: `nitro-cli describe-enclaves` shows the enclave
   `RUNNING` with expected PCRs, perform an attested `kms decrypt` and confirm it succeeds inside
   the enclave but fails (AccessDenied) from the parent, and check the enclave console logs.

## Inputs
Sensitive workload and data flow, required PCRs/attestation policy, parent instance type, enclave
vCPU/memory needs, KMS keys involved, the container image to convert to an EIF.

## Output
A parent-instance + allocator config, the EIF build and recorded PCRs, the attestation-gated KMS
key policy, and verification that the enclave runs and only it can decrypt.

## Notes
- Gotchas: PCRs change if the EIF changes — rebuild breaks the KMS condition unless updated; no
  disk/network means all I/O goes over vsock; the parent admin still cannot read enclave memory;
  enclave-capable instance types only; debug mode disables attestation (never use in prod).
- IaC/CLI: Terraform `aws_instance` (`enclave_options`), `aws_kms_key`/`aws_kms_key_policy` with
  attestation conditions. CLI `nitro-cli build-enclave`, `run-enclave`, `describe-enclaves`,
  `terminate-enclave`; `aws kms decrypt`. CloudFormation `AWS::EC2::Instance` `EnclaveOptions`.
