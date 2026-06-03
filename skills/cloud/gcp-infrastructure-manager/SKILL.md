---
name: gcp-infrastructure-manager
description: Use when designing, provisioning, securing, or operating Infrastructure Manager — Google Cloud's managed Terraform service that provisions and manages GCP infrastructure from Terraform configurations (Infrastructure Manager). Covers deployments (a managed Terraform stack), revisions and revision history, sourcing config from Cloud Storage or a Git repo (Developer Connect / Secure Source Manager), previews (plan), apply/lock/unlock, managed Terraform state in a Google-managed bucket, the service account that runs Terraform, input variables, deletion, plus IAM, quotas, and cost. Loads the Infrastructure Manager knowledge: create a deployment from config, preview, apply, inspect state/outputs, and verify. Consumed by the Infrastructure Manager specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when running managed Terraform deployments (Infrastructure Manager).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, infrastructure-manager, management, terraform, iac, deployments]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Infrastructure Manager

Google Cloud's **managed Terraform** service. It runs your **Terraform configurations** to provision and
manage GCP infrastructure without you operating Terraform runners or state backends — Google stores the
state, runs `plan`/`apply` under a service account, and tracks the history of changes as revisions.

## Core concepts and components
- **Deployment** — a managed Terraform stack: a named resource bound to a **Terraform configuration** and
  the GCP resources it manages. Has a **state** and a **lock**.
- **Revisions** — each apply creates a **revision** capturing the config, variables, and resulting state;
  revision history gives audit/rollback context.
- **Config source** — the Terraform config comes from a **Cloud Storage** object (zipped/blueprint) or a
  **Git repository** (via Developer Connect / Secure Source Manager), pinned to a ref.
- **Previews** — a **preview** runs `terraform plan` and surfaces the diff before any change is applied
  (create or delete previews).
- **Apply / lock / state** — `apply` reconciles the config; the deployment is **locked** during an
  operation; **state** is stored in a Google-managed bucket (or your own) — you don't manage a backend.
- **Service account** — Infra Manager runs Terraform **as a service account** you specify; that SA needs
  the IAM to create the target resources.
- **Input variables** — Terraform variables supplied to the deployment; **outputs** are exposed after apply.

## Configuration and sizing
- Choose the **config source** (GCS blueprint vs Git ref) and pin it. Define **input variables** and the
  **runner service account** with exactly the IAM the config needs. Decide **state location** (Google-
  managed vs your bucket). Use **previews** before apply for any meaningful change. Keep deployments
  **scoped** (one stack per logical concern) rather than one mega-deployment.

## Security and IAM
- Two IAM surfaces: **who can manage deployments** (`roles/config.admin`, `roles/config.viewer`,
  `roles/config.agent`) and the **runner service account's** permissions (the real blast radius — scope it
  to least privilege for the resources the config provisions, never `roles/owner`). Use **WIF/short-lived
  creds** for any external Git access, store secrets in **Secret Manager**, and restrict who can
  `apply`/`delete`. Treat the runner SA as privileged.

## Cost levers
- Infrastructure Manager itself has **no/low service charge**; you pay for the **resources the Terraform
  config provisions** and any state-bucket storage. Lever: the cost discipline lives in the Terraform
  config (right-sizing the resources it creates), plus avoiding orphaned deployments holding resources.

## Scaling and limits
- Limits on **deployments per project/region**, revision history retention, config size, and concurrent
  operations apply. A deployment is **locked** during an operation (no concurrent applies). Long
  Terraform runs are bounded by an operation **timeout**. Region availability is limited — pick a
  supported region.

## Operating procedure
1. **Provision** — enable `config.googleapis.com`; designate/create the **runner service account** with
   least-privilege IAM for the target resources; stage the **Terraform config** in **GCS** or a **Git**
   repo (via Developer Connect).
2. **Configure** — create the **deployment** pointing at the config source + ref, supply **input
   variables**, and set the **service account** and state location (Terraform
   `google_infra_manager_deployment` or `gcloud infra-manager deployments`).
3. **Secure** — scope the **runner SA** to least privilege (no `owner`), restrict **config.* IAM** on who
   can apply/delete, use WIF/short-lived creds and Secret Manager for any external/Git/secret access.
4. **Verify** — apply [[verify-by-running]]: run a **preview** and confirm the plan diff matches intent
   (`gcloud infra-manager previews create`), **apply** and confirm the deployment reaches the active/
   succeeded state with the expected **outputs** (`gcloud infra-manager deployments describe`), and
   confirm the **created resources** actually exist (e.g. `gcloud` describe the provisioned resource).
   Capture the preview diff, the successful apply/outputs, and the resource existence check.

## Inputs
The Terraform configuration and its source (GCS or Git ref), the input variables, the runner service
account and the IAM it needs, the state-location choice, and which deployments/scope to create.

## Output
A managed Terraform deployment created from the pinned config source with a least-privilege runner SA,
input variables, and managed state — applied with verified outputs — plus verification of the preview
diff, the successful apply, and the existence of the provisioned resources.

## Notes
- Gotchas: the **runner service account** is the real blast radius — scope it tightly, never `owner`; a
  deployment is **locked** during operations (no concurrent applies); **state is Google-managed** (don't
  hand-edit); always run a **preview** before apply; this is **managed Terraform as a service** — distinct
  from the **gcp-iac-engineer role** that authors the Terraform itself (this service *runs* it); region
  availability is limited. 2nd consumer: the GCP role team (gcp-iac-engineer / gcp-cloud-architect)
  running managed Terraform. Cross-cloud peer: AWS CloudFormation (managed provisioning service).
- IaC/CLI: Terraform `google_infra_manager_deployment` (`terraform_blueprint` with `gcs_source` or
  `git_source`, `input_values`, `service_account`). CLI `gcloud infra-manager deployments create/describe`,
  `gcloud infra-manager previews create`, `gcloud infra-manager revisions list`; verify outputs and then
  `gcloud` describe the actual provisioned resources.
