---
name: gcp-cloud-tpu
description: Use when designing, provisioning, securing, or operating Cloud TPU — Google Cloud's custom ML accelerators: TPU generations (v5e, v5p, and their predecessors), single TPU VMs vs multi-host Pods and slices, topologies and chips/cores, the runtime (JAX, PyTorch/XLA, TensorFlow), TPU VM vs queued resources, Multislice training, the TPU runtime image, plus regions/zones, preemptible/spot and reservations, IAM, networking, and cost (Cloud TPU). Loads the Cloud TPU knowledge: choose the generation and slice topology, provision a TPU VM or queued resource, run a JAX/PyTorch/TF workload, secure the identity, and verify the accelerator runs a step. Consumed by the Cloud TPU specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add accelerators.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-tpu, ai-ml, accelerators, jax, pytorch, training]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud TPU

Google's custom-built ML accelerators (Tensor Processing Units) for high-throughput training and
inference. You provision a TPU VM or a multi-host slice, run a JAX / PyTorch / TensorFlow workload on
the XLA compiler, and scale from a single chip to a full Pod.

## Core concepts and components
- **Generations** — current **v5e** (cost/efficiency-optimized inference + training) and **v5p**
  (largest-scale training), each as predecessors (v4, v3). Each chip exposes cores/HBM; pick the
  generation by throughput and memory needs.
- **Topology and slices** — a **TPU Pod** is the full interconnected fabric; a **slice** is a
  contiguous subset described by a **topology** (e.g. `2x2x1`, `4x4x4`). Slices are single-host or
  **multi-host**.
- **TPU VM** — you SSH directly into the host(s) attached to the accelerator (no separate user VM);
  workloads run on the TPU runtime image.
- **Queued resources** — request capacity that is fulfilled when available (vs. on-demand create);
  the recommended provisioning path for large/multi-host slices.
- **Multislice** — train across multiple slices/Pods over the data-center network for very large jobs.
- **Runtimes** — **JAX** (native), **PyTorch/XLA**, and **TensorFlow**; the XLA compiler targets the
  TPU.

## Configuration and sizing
- Choose the **generation** (v5e for inference/cost, v5p for largest training), then the **slice
  topology** (number of chips/hosts) to fit the model and global batch size. Single-host for small
  jobs, multi-host slices/Multislice for large. Pick the **runtime version** matching the framework.
  Use **queued resources** for scarce large slices; use **spot/preemptible** or **reservations** for
  cost vs. availability.

## Security and IAM
- Run TPUs with a dedicated **service account** scoped least-privilege (`roles/tpu.admin` only for
  managers; runtime SA scoped to the Cloud Storage data/checkpoint buckets) — avoid broad project
  roles. Place TPU VMs in the intended **VPC/subnet**, restrict SSH/firewall, CMEK-encrypt checkpoint
  buckets, enable VPC-SC where required, and audit via Cloud Audit Logs.

## Cost levers
- Biggest levers: generation + slice size and wall-clock time — TPUs bill per chip-hour while
  provisioned. Use **spot/preemptible** for fault-tolerant training (checkpoint frequently),
  **reservations/committed use** for steady workloads, **queued resources** to avoid idle waiting,
  and delete slices the moment a job ends (idle slices bill). Right-size the topology to the model.

## Scaling and limits
- Scale by topology within a Pod and across Pods with **Multislice**. Capacity is region/zone- and
  generation-specific and often the real blocker — use queued resources/reservations. Per-project
  accelerator quotas govern chip counts; raise via the quotas page.

## Operating procedure
1. **Provision** — enable the TPU API (`gcloud services enable tpu.googleapis.com`; Terraform
   `google_tpu_v2_vm` / `google_tpu_node`), create the runtime **service account** + Cloud Storage
   data/checkpoint buckets, and create a **TPU VM** or **queued resource** with the chosen
   generation, topology, and runtime version in an available zone.
2. **Configure** — install/select the framework runtime (JAX / PyTorch-XLA / TF), wire data +
   checkpoint Cloud Storage paths, and for large jobs configure multi-host slices / **Multislice**.
3. **Secure** — scope the service account least-privilege, place the TPU in the correct VPC/subnet,
   restrict SSH/firewall, CMEK-encrypt checkpoints, and enable VPC-SC where required.
4. **Verify** — apply [[verify-by-running]]: confirm the resource is `READY`
   (`gcloud compute tpus tpu-vm describe` / `queued-resources describe`), then run a representative
   training/inference step on the TPU and confirm it executes (a step completes, loss decreases, or a
   sample prediction returns) — capture the actual output.

## Inputs
Framework (JAX / PyTorch / TF), model + global batch size, generation + topology need, single- vs
multi-host, provisioning mode (on-demand / queued / spot / reservation), data + checkpoint locations,
region/zone, VPC/IAM scope, and cost constraints.

## Output
A Cloud TPU setup (service account + data/checkpoint buckets, TPU VM or queued resource at the chosen
generation/topology/runtime, VPC placement, CMEK) plus verification that the accelerator is READY and
runs a representative step, with the cost levers applied (spot/reservation, right-sized topology).

## Notes
- Gotchas: capacity for large slices is the real constraint — use queued resources/reservations and
  expect zone-specific availability; idle slices bill per chip-hour (delete immediately); runtime
  version must match the framework (mismatched JAX/PyTorch-XLA/TF runtimes fail); spot TPUs are
  preempted (checkpoint frequently); topology strings must be valid for the generation; TPU VM means
  you run on the host itself. Cloud TPU is the ACCELERATOR — training orchestration, model registry,
  and endpoints belong to Vertex AI. The AWS equivalent is AWS Trainium/Inferentia.
- IaC/CLI: Terraform `google_tpu_v2_vm` (TPU VM) / `google_tpu_node`, plus `google_project_service`,
  `google_service_account`, `google_storage_bucket`; queued resources are typically created via CLI.
  CLI `gcloud compute tpus tpu-vm create / describe / ssh`,
  `gcloud compute tpus queued-resources create / describe`; JAX / PyTorch-XLA / TensorFlow run on the
  TPU runtime image.
