---
name: gcp-artifact-registry
description: Use when designing, provisioning, securing, or operating Artifact Registry — Google Cloud's managed registry for container images and language packages: repositories by format (Docker/OCI, Maven, npm, Python/PyPI, Go, apt, yum, plus Helm/Kubeflow), repository modes (standard, remote upstream-proxy/cache, and virtual aggregation), regional vs multi-region location, authentication (gcloud credential helper, keyless Workload Identity, service-account keys), IAM roles (reader/writer/admin), cleanup policies + immutable tags, container vulnerability scanning + Artifact Analysis, CMEK, and VPC-SC. Loads the Artifact Registry knowledge: create a repo of the right format/mode, authenticate + push/pull, secure access, enable scanning + cleanup, and verify an artifact resolves. Consumed by the Artifact Registry specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they stand up image/package storage (Artifact Registry).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, artifact-registry, application-development, container-registry, packages, vulnerability-scanning]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Artifact Registry

Google Cloud's managed registry for **container images** and **language packages**. It stores
artifacts in **repositories** scoped by **format** and **location**, with IAM-controlled access,
vulnerability scanning, remote/virtual repos, and cleanup policies — the successor to Container
Registry (GCR) and the standard push target for GCP CI/CD.

## Core concepts and components
- **Repository** — the container, scoped to one **format** and a **location**. Modes:
  - **Standard** — you push/pull your own artifacts.
  - **Remote** — a pull-through **proxy/cache** of an upstream (Docker Hub, Maven Central, PyPI, npm)
    for reliability + reduced egress.
  - **Virtual** — a single endpoint that **aggregates** multiple upstream repos (standard + remote)
    with priority order.
- **Formats** — **Docker/OCI**, **Maven**, **npm**, **Python (PyPI)**, **Go**, **apt**, **yum**, plus
  **Helm** and others; one format per repo.
- **Location** — **regional** (lowest latency/egress next to workloads) or **multi-region**.
- **Authentication** — Docker/tool clients authenticate via the **gcloud credential helper**, **keyless
  Workload Identity** (in-cluster / from CI), or (discouraged) service-account keys.
- **Scanning** — **Artifact Analysis** scans container images for OS + language-package
  vulnerabilities (on-push and continuous).
- **Cleanup policies + immutable tags** — auto-delete old/untagged versions; **immutable tags** prevent
  overwriting a published tag.

## Configuration and sizing
- Create one **repo per format** in the **region** closest to the consuming workloads (and to Cloud
  Build). Use **remote** repos to cache public upstreams and **virtual** repos to give clients one URL.
  Enable **cleanup policies** to bound storage and **immutable tags** for reproducibility. Enable
  **scanning**. No capacity to provision — storage scales automatically.

## Security and IAM
- Grant `roles/artifactregistry.reader` (pull), `writer` (push), `admin` (manage) at the repo level,
  least-privilege. Prefer **keyless Workload Identity** over downloaded SA keys. Use **CMEK** for
  sensitive artifacts and **VPC-SC** to bound exfiltration. Keep **scanning** on and gate
  deploys/admission on results. Audit via Cloud Audit Logs.

## Cost levers
- Billed for **storage** (GB-month) plus **network egress** (cross-region / internet); scanning has its
  own charge. Levers: keep repos in the **same region** as workloads to avoid egress, use **remote/
  cache** repos to cut repeated upstream pulls, and apply **cleanup policies** to delete stale
  versions/untagged images.

## Scaling and limits
- Storage and pull throughput scale automatically; per-project/location quotas apply (raise via
  quotas). Watch upstream rate limits when proxying via remote repos, and image/version count growth
  without cleanup policies. GCR is deprecated — migrate `gcr.io` to Artifact Registry.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable artifactregistry.googleapis.com`; Terraform
   `google_project_service`), and create the **repository** (`gcloud artifacts repositories create
   --repository-format=docker|maven|... --location=REGION` or Terraform
   `google_artifact_registry_repository`) in the right format/mode/location.
2. **Configure** — set up client **auth** (`gcloud auth configure-docker REGION-docker.pkg.dev` or
   Workload Identity), set **cleanup policies** + **immutable tags**, and (for remote/virtual) wire
   upstreams.
3. **Secure** — repo-level reader/writer/admin IAM least-privilege, prefer keyless WIF, enable
   **scanning** + CMEK/VPC-SC for sensitive repos, gate deploys on scan results.
4. **Verify** — apply [[verify-by-running]]: **push** a test artifact (`docker push REGION-docker.pkg.dev/PROJECT/REPO/IMAGE:TAG`
   or `mvn deploy` / `pip publish` equiv) and confirm it **lists/pulls back**
   (`gcloud artifacts docker images list ...` / pull from a clean client), and that **scanning** ran —
   capture the pushed artifact and a successful pull + scan result.

## Inputs
The artifact format(s), where consumers live (region), standard vs remote/virtual needs, the auth model
(WIF vs keys), retention/cleanup + immutability policy, scanning/CMEK/VPC-SC requirements, and IAM scope.

## Output
An Artifact Registry setup (repo(s) of the right format/mode/location, client auth, cleanup policies +
immutable tags, scanning, repo-level IAM) plus verification that an artifact pushed, pulled back from a
clean client, and was scanned.

## Notes
- Gotchas: a repo is **one format** — don't mix; **region mismatch** with workloads costs egress + latency;
  prefer **keyless Workload Identity** over downloaded SA keys (a leak risk); without **cleanup
  policies** storage grows unbounded; **immutable tags** are needed for reproducible deploys; GCR
  (`gcr.io`) is **deprecated** — migrate. Artifact Registry stores artifacts; **Cloud Build** produces
  and pushes them, **Cloud Deploy** consumes them. AWS equivalents are ECR (images) + CodeArtifact
  (packages); Azure is Azure Container Registry / Artifacts.
- IaC/CLI: Terraform `google_artifact_registry_repository`, `_repository_iam_*`,
  `google_project_service`. CLI `gcloud artifacts repositories create / list / describe`,
  `gcloud artifacts docker images list / describe`, `gcloud auth configure-docker`.
