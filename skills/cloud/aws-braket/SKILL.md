---
name: aws-braket
description: Use when designing, provisioning, securing, or operating Amazon Braket — quantum computing as a service, on-demand QPU devices (IonQ/IQM/Rigetti) and managed simulators (SV1/DM1/TN1, local), quantum tasks (circuits/AHS programs) with shots, hybrid jobs (classical+quantum on managed compute), the Braket SDK/PennyLane, S3 result storage, and device availability windows (Amazon Braket). Loads the Braket knowledge: pick a device/simulator, submit a quantum task or hybrid job, secure result storage + IAM, and verify results returned. Consumed by the Braket specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle quantum workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, braket, quantum-computing, simulators, specialized]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Braket

A managed quantum computing service. You design quantum circuits (or analog Hamiltonian simulation
programs), then run them on real **QPUs** or on managed **simulators**, paying per task/shot or per
device-minute. It abstracts vendor access, scheduling, and result handling so you focus on the
algorithm.

## Core concepts and components
- **Devices** — on-demand **QPUs** from hardware providers (IonQ, IQM, Rigetti) and managed
  **simulators**: **SV1** (state vector), **DM1** (density matrix, noise), **TN1** (tensor network),
  plus a **local simulator** in the SDK. Each QPU has gateset, qubit count, and **availability
  windows**.
- **Quantum task** — one execution of a circuit (or AHS program) with a number of **shots**; results
  land in S3.
- **Hybrid jobs** — managed runs combining classical compute (a container) with quantum tasks, with
  priority access to the target device — for variational/iterative algorithms.
- **SDK** — the **Amazon Braket SDK** (Python) and **PennyLane** plugin for building circuits and
  jobs.

## Configuration and sizing
- Prototype on the local/managed simulator; move to a QPU only when validated. Choose the simulator
  by need: SV1 for ideal state vector, DM1 for noise, TN1 for large low-entanglement circuits. Set
  shots to balance statistical accuracy vs cost. Hybrid jobs pick a classical instance type.

## Security and IAM
- Braket needs an IAM role/policy to write results to your **S3** bucket and to access devices;
  scope `braket:*` actions and the S3 result bucket least-privilege. Enable the service-linked role.
- KMS-encrypt the result S3 bucket; restrict who can submit to expensive QPUs (cost guardrail via
  IAM/SCPs).

## Cost levers
- Biggest levers: simulator-vs-QPU choice (QPU per-shot + per-task fees dominate), shot count, and
  TN1/SV1 simulation-minute pricing. Validate on local/cheaper simulators first; cap QPU access via
  IAM; right-size hybrid-job classical instances.

## Scaling and limits
- Device availability is windowed per provider (QPUs are not always online) and Region-bound;
  per-account concurrent task/job quotas apply. Simulators scale with managed capacity. Raise quotas
  via Service Quotas.

## Operating procedure
1. **Provision** — enable Braket (the service-linked role + an IAM execution role), create the
   **S3 result bucket**, and confirm the target **device** is available with `aws braket
   get-device`. Terraform coverage is partial — IAM/S3 are Terraform-managed; tasks/jobs are
   submitted via the SDK/CLI, not declared as Terraform resources.
2. **Configure** — build the circuit/AHS program with the **Braket SDK**, choose device + shots, and
   for iterative algorithms define a **hybrid job** (container + algorithm).
3. **Secure** — scope the execution role to the result bucket + chosen devices, KMS-encrypt results,
   and gate expensive QPU submission via IAM/SCPs.
4. **Verify** — apply [[verify-by-running]]: `aws braket get-device` shows the device `ONLINE`,
   submit on a simulator with `aws braket create-quantum-task` (or the SDK), `get-quantum-task`
   reaches `COMPLETED`, and the measurement results are retrievable from the S3 result bucket.

## Inputs
Algorithm/circuit, simulator-vs-QPU target + provider, shot count, hybrid-job needs + classical
instance type, S3 result location, IAM/cost guardrails, Region/device-availability constraints,
encryption requirements.

## Output
A Braket setup (execution role + KMS-encrypted S3 result bucket), a submitted quantum task or hybrid
job on the chosen device/simulator with shots, and verification of an `ONLINE` device plus a
`COMPLETED` task with retrievable results.

## Notes
- Gotchas: QPUs have limited availability windows and queueing — tasks may wait; validate on
  simulators first to avoid QPU fees; results are asynchronous (poll task status); Terraform models
  IAM/S3 but not quantum tasks/jobs (submit via SDK/CLI); device gatesets/qubit counts differ, so a
  circuit valid on one QPU may not compile on another.
- IaC/CLI: Terraform for the supporting `aws_iam_role`/policy and `aws_s3_bucket` (no first-class
  task/job resource). CLI `aws braket get-device`, `search-devices`, `create-quantum-task`,
  `get-quantum-task`, `create-job`, `get-job`. Braket SDK (`braket.aws`) / PennyLane for circuit and
  hybrid-job authoring. CloudFormation has no native Braket task/job type.
