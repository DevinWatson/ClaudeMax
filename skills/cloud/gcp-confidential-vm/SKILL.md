---
name: gcp-confidential-vm
description: Use when designing, provisioning, securing, or operating Confidential VM — Google Cloud Compute Engine instances whose memory is encrypted in use by the CPU, providing confidential computing for data-in-use protection (Confidential VM). Covers the confidential computing technologies (AMD SEV, SEV-SNP, and Intel TDX), supported machine families and images, the confidentialInstanceConfig setting, hardware-rooted attestation and the vTPM/Shielded VM integration, GKE Confidential Nodes, performance/compatibility tradeoffs, and how it composes with CMEK and Shielded VM, plus IAM, cost, and limits. Loads the Confidential VM knowledge: enable the right confidential type on a supported machine/image, attest, and verify. Consumed by the Confidential VM specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when protecting data in use (Confidential VM).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, confidential-vm, security, confidential-computing, memory-encryption, attestation, sev-tdx]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Confidential VM

Google Cloud Compute Engine instances that provide **confidential computing**: the VM's **memory is
encrypted while in use** by the CPU, so data is protected not just at rest and in transit but **in
use** — even the hypervisor/host operator cannot read guest memory in cleartext.

## Core concepts and components
- **Memory encryption technologies** — **AMD SEV** (Secure Encrypted Virtualization), **AMD SEV-SNP**
  (adds integrity + stronger attestation), and **Intel TDX** (Trust Domain Extensions). Each pins the
  instance to a supported **machine family** (e.g. N2D/C2D/C3 for AMD, C3 for TDX) and **image**.
- **confidentialInstanceConfig** — the instance setting that enables confidential computing and selects
  the **confidential instance type** (`SEV`, `SEV_SNP`, `TDX`). Set at creation; not all combos exist
  in every region/machine type.
- **Attestation** — hardware-rooted **attestation reports** prove the VM is genuinely a Confidential VM
  on trusted firmware before releasing secrets to it; integrates with the **vTPM** and measured boot.
- **Shielded VM integration** — Confidential VM builds on Shielded VM (secure/measured boot, vTPM,
  integrity monitoring); typically enabled together.
- **GKE Confidential Nodes** — node pools running on Confidential VMs to bring memory encryption to
  containerized workloads.
- **CMEK + confidential** — disks can still use **CMEK**; confidential computing protects **memory in
  use**, complementing at-rest disk encryption.

## Configuration and sizing
- Pick a **machine family + region** that supports the chosen confidential type (**SEV** widest, **TDX**
  newest/narrowest). Use a **confidential-compatible OS image**. Enable **Shielded VM** options
  alongside. Expect a modest **performance overhead** and some feature constraints (e.g. limited
  live-migration support depending on type) — size and design for occasional host events.

## Security and IAM
- Confidential VM raises the bar against host/hypervisor-level threats; combine with **least-privilege
  IAM** on the instance, **CMEK** disks, **OS Login**, and **attestation-gated** secret release (only
  hand secrets to an attested VM). Standard `compute.instanceAdmin` family roles govern creation; lock
  down who can disable confidential settings or read serial console.

## Cost levers
- You pay the normal **Compute Engine** rate plus a **confidential computing premium** and are limited
  to supported (sometimes pricier) machine families. Lever: right-size machine type, use it **only for
  workloads that need data-in-use protection**, and prefer SEV unless SEV-SNP/TDX attestation is needed.

## Scaling and limits
- Availability is **region/zone- and machine-family-specific** — confirm the confidential type is
  offered where you deploy. Some confidential types **restrict live migration** (host maintenance may
  terminate/reschedule); not all GPU/feature combos are supported. Plan capacity and maintenance policy.

## Operating procedure
1. **Provision** — enable Compute Engine; choose a **supported machine family + region + image** for the
   target confidential type (SEV / SEV-SNP / TDX); ensure quota in that family.
2. **Configure** — create the instance with **confidentialInstanceConfig** enabled and the right type,
   **Shielded VM** options on, and **CMEK** disks if required, via Terraform
   `google_compute_instance` `confidential_instance_config` (and `shielded_instance_config`); for GKE,
   enable **Confidential Nodes** on the node pool.
3. **Secure** — apply least-privilege IAM, OS Login, CMEK; restrict who can disable confidential
   settings; wire **attestation-gated** secret release where secrets must only reach an attested VM.
4. **Verify** — apply [[verify-by-running]]: confirm the instance reports confidential computing
   **enabled** (`gcloud compute instances describe` shows `confidentialInstanceConfig`), check inside
   the guest that **memory encryption is active** (e.g. SEV/TDX status in `dmesg`/`/sys`), and validate
   an **attestation report** is produced. Capture the describe output and the in-guest confidential
   status.

## Inputs
The workload needing data-in-use protection, the required confidential type (SEV/SEV-SNP/TDX) and its
attestation needs, target region/machine family, OS image, disk CMEK requirements, and whether it is a
plain VM or a GKE node pool.

## Output
A Confidential VM (or GKE Confidential node pool) on a supported machine/image with the chosen
confidential type and Shielded VM enabled, CMEK disks if required, least-privilege IAM, plus
verification that confidential computing is active and attestation succeeds.

## Notes
- Gotchas: **type availability is region/machine-specific** — TDX is narrowest, SEV widest; some types
  **constrain live migration** (host maintenance can terminate the VM — set the right maintenance
  policy); you need a **confidential-compatible image**; there is a **performance premium**; confidential
  protects **memory in use**, not by itself disk-at-rest (still use CMEK). 2nd consumer: the GCP role
  team uses this for data-in-use posture, not just the specialist. Cross-cloud peer concept: AWS Nitro
  Enclaves / Azure confidential VMs.
- IaC/CLI: Terraform `google_compute_instance` with `confidential_instance_config { enable_confidential_compute, confidential_instance_type }`
  and `shielded_instance_config`, plus `google_kms_crypto_key` for CMEK disks; GKE node pool
  `confidential_nodes`. CLI `gcloud compute instances create --confidential-compute` /
  `--confidential-compute-type`, `gcloud compute instances describe`, and in-guest checks to verify.
