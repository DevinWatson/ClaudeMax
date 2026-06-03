---
name: gcp-shielded-vms
description: Use when hardening Compute Engine instances with Shielded VM — Google Cloud's set of VM boot-integrity protections against rootkits/bootkits and tampering: secure boot (only signed bootloaders/kernels run), the virtual Trusted Platform Module (vTPM) for measured boot + cryptographic identity, integrity monitoring (baseline vs measured boot policies, late-binding) surfaced in Cloud Monitoring/Logging, requiring a Shielded-VM-compatible (UEFI) image, enabling it on instances / instance templates / MIGs, and enforcing it org-wide via the constraints/compute.requireShieldedVm Org Policy. Loads the Shielded VM knowledge: confirm a UEFI image, enable secure boot + vTPM + integrity monitoring, enforce via Org Policy, and verify integrity reports are healthy. Consumed by the Shielded VMs specialist and by the GCP role team (gcp-security-reviewer / gcp-iac-engineer) when they harden VM boot integrity (Shielded VMs).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, shielded-vms, security, secure-boot, vtpm, integrity-monitoring, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Shielded VMs

Google Cloud's set of **boot-integrity protections** for Compute Engine instances. Shielded VM defends
against **rootkits and bootkits** and detects boot-level tampering using **secure boot**, a **virtual TPM
(vTPM)**, and **integrity monitoring** — verifiable, hardened VMs you can enforce fleet-wide.

## Core concepts and components
- **Secure boot** — only **signed** bootloaders/kernel modules run; unsigned/tampered boot components are
  blocked. Custom unsigned drivers/kernels can break boot — validate first.
- **vTPM** — a virtual **Trusted Platform Module** that performs **measured boot** (records hashes of each
  boot stage) and provides a hardware-rooted **cryptographic identity** for the VM (attestation, key
  sealing).
- **Integrity monitoring** — compares each boot's **measured boot** sequence against a trusted **baseline**;
  drift (early/late boot policy) is reported as integrity events in **Cloud Monitoring / Logging**. Supports
  **auto-learn / late-binding** to update the baseline after intended changes (e.g. kernel updates).
- **Compatible images** — requires a **UEFI-enabled, Shielded-VM image** (most Google public images
  qualify; custom images must be UEFI/signed-compatible).
- **Scope of enablement** — toggled per-instance, in **instance templates**, and thus across **MIGs**;
  enforced organization-wide via the `constraints/compute.requireShieldedVm` **Org Policy**.

## Configuration and sizing
- Confirm the boot **image is Shielded-VM compatible (UEFI)**, then enable the three options:
  **secure boot** (only if drivers/kernel are signed), **vTPM** (enables measured boot + identity), and
  **integrity monitoring** (on by default with vTPM). For fleets, bake it into the **instance template**
  and enforce via **Org Policy**. No sizing cost — it's a security posture, not a resource tier.

## Security and IAM
- Enabling/updating shielded options needs `roles/compute.instanceAdmin.v1`; the Org Policy needs
  `roles/orgpolicy.policyAdmin`. Shielded VM is itself a security control — pair it with least-privilege VM
  SAs, OS Login, firewall rules, and CMEK. Integrity events should feed alerting; treat an integrity
  **failure** as a potential compromise.

## Cost levers
- Shielded VM features carry **no additional charge** — you pay only for the underlying Compute Engine VM.
  The cost lever is operational: avoid breaking secure boot with unsigned drivers (which forces toggling it
  off and weakening posture). Confidential VM is a separate, paid hardening tier — not the same as Shielded.

## Scaling and limits
- Applies per VM; enforced at scale via **instance templates + MIGs + Org Policy**. Limits: **secure boot
  requires signed** bootloader/kernel/modules (unsigned custom kernels won't boot); the image must be
  **UEFI/Shielded-compatible**; toggling shielded options on a running VM requires a stop/start; integrity
  baselines must be **re-learned** after intended boot changes (kernel/driver updates) or you get false
  positives.

## Operating procedure
1. **Provision / select** — confirm the boot **image is Shielded-VM (UEFI) compatible**
   (`gcloud compute images describe --format='value(shieldedInstanceInitialState)'` / image family docs);
   pick a compatible image if not.
2. **Configure** — enable **secure boot** (drivers signed), **vTPM**, and **integrity monitoring** on the
   instance / instance template (`gcloud compute instances create --shielded-secure-boot --shielded-vtpm
   --shielded-integrity-monitoring`; Terraform `shielded_instance_config { enable_secure_boot,
   enable_vtpm, enable_integrity_monitoring }`), and roll it into MIG templates.
3. **Secure / enforce** — enforce fleet-wide with the **`constraints/compute.requireShieldedVm`** Org
   Policy (`gcloud resource-manager org-policies enable-enforce ...` / Terraform
   `google_org_policy_policy`), and wire integrity-event alerting in Cloud Monitoring.
4. **Verify** — apply [[verify-by-running]]: confirm shielded options are enabled
   (`gcloud compute instances describe --format='value(shieldedInstanceConfig)'`), the VM **boots cleanly**
   with secure boot, and **integrity monitoring reports PASS** (early/late boot match the baseline) in
   Cloud Monitoring/Logging — and that the Org Policy **blocks** creating a non-shielded VM. Capture the
   shielded config and the latest integrity report.

## Inputs
The target instances / templates / MIGs, the boot image (must be UEFI/Shielded-compatible), whether custom
drivers/kernels are signed (gates secure boot), the integrity-baseline/late-binding strategy, the Org
Policy enforcement scope, and IAM scope.

## Output
Shielded Compute Engine VMs (secure boot + vTPM + integrity monitoring enabled on instances/templates,
enforced via Org Policy where applicable, integrity alerting wired) plus verification that the config is
enabled, the VM boots cleanly, integrity reports PASS, and the policy blocks non-shielded VMs.

## Notes
- Gotchas: **secure boot needs signed** bootloader/kernel/modules — unsigned custom kernels won't boot
  (test before enforcing); the **image must be UEFI/Shielded-compatible**; re-learn the **integrity
  baseline** after intended kernel/driver updates to avoid false integrity failures; toggling options needs
  a **stop/start**; treat an integrity **failure** as possible compromise. This is **boot-integrity
  hardening for Compute Engine** — the VM lifecycle/sizing/MIG mechanics belong to **gcp-compute-engine**;
  org-wide policy/posture belongs to **gcp-security-reviewer**. Don't confuse with **Confidential VM**
  (memory encryption, separate paid feature). No AWS/Azure 1:1 (closest: AWS NitroTPM / Azure Trusted
  Launch).
- IaC/CLI: Terraform `google_compute_instance.shielded_instance_config`,
  `google_compute_instance_template.shielded_instance_config`, `google_org_policy_policy`
  (`compute.requireShieldedVm`), `google_project_service`. CLI `gcloud compute instances create / update
  --shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring`, `gcloud compute images
  describe`, `gcloud resource-manager org-policies`.
