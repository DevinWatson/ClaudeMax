---
name: aws-codebuild
description: Use when designing, provisioning, securing, or operating AWS CodeBuild — the fully managed continuous-integration service that compiles source, runs tests, and produces deployable artifacts on managed or self-hosted compute without running your own build servers (AWS CodeBuild). Loads the CodeBuild knowledge: build projects, the buildspec (phases, env, artifacts, reports, batch builds), source providers, compute types and environment images (managed/custom/ARM/GPU/Lambda compute), local/S3 caching, environment variables and secrets, VPC builds, reserved-capacity fleets, build reports/test reporting, IAM service roles, cost levers, concurrency limits, and verification by running a build and inspecting logs/artifacts. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect) provisioning CI compute. Consumed by the CodeBuild specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, codebuild, developer-tools, ci, build, devtools]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS CodeBuild

A fully managed **continuous-integration / build** service. It pulls source, runs the **build, test, and
package** steps you define, and emits artifacts and test reports — all on managed (or reserved/self-hosted)
compute, billed per build-minute, with no build servers to maintain. It is the **build** stage in the
AWS-native CodePipeline → CodeDeploy chain.

## Core concepts and components
- **Build project** — the unit of configuration: source, environment (compute + image), buildspec,
  artifacts, cache, service role, and triggers.
- **buildspec** — `buildspec.yml`: ordered **phases** (`install`, `pre_build`, `build`, `post_build`),
  environment variables, `artifacts`, `reports`, `cache` paths, and **batch** build config.
- **Source providers** — CodeCommit, GitHub/GitHub Enterprise, Bitbucket, S3, or CodePipeline-supplied
  source; webhooks/filter groups trigger builds.
- **Compute and environments** — **compute types** (small→2xlarge, ARM/Graviton, GPU) on managed images
  (Amazon Linux/Ubuntu/Windows), **custom images** from ECR, or **Lambda compute** for fast lightweight
  builds; reserved-capacity **fleets** for low-latency/persistent runners.
- **Caching** — **local** (Docker layer/source/custom) and **S3** caches to speed repeat builds.
- **Reports** — test/coverage **report groups** surfaced in the console.

## Configuration and sizing
- Pick the smallest **compute type** that builds within time limits; use **ARM/Graviton** for
  cost/perf and **Lambda compute** for short builds. Choose the OS image matching your toolchain or a
  **custom ECR image** to avoid install time. Enable **caching** (Docker layers / dependency dirs) to
  cut minutes. Use **reserved fleets** only when cold-start/queue latency matters.

## Security and IAM
- Each project runs under a **service role** — scope it to the exact S3 artifact buckets, ECR repos,
  Secrets Manager/SSM parameters, and KMS keys it needs (avoid wildcards). Store secrets in **Secrets
  Manager / SSM Parameter Store**, never in plaintext env vars. Run builds **inside a VPC** when they
  reach private resources, and use a least-privilege security group. Encrypt artifacts and the build
  environment with **KMS**.

## Cost levers
- Billed per **build-minute** by compute type. Levers: right-size compute (don't default to large),
  use **ARM/Graviton** and **Lambda compute** for cheaper/faster builds, aggressive **caching** to cut
  minutes, **batch builds** to parallelize without idle waits, and avoid reserved fleets unless latency
  justifies the standing cost. Fail fast in early phases.

## Scaling and limits
- Concurrent-build quotas are per account/region (raisable via support); excess builds queue. Per-build
  **timeout** (default 60 min, up to 8 h) and per-phase limits apply. Reserved fleets have a fixed
  capacity you scale explicitly. Webhook filter groups bound trigger volume.

## Operating procedure
1. **Provision** — create the **build project** (source, environment/compute, service role, artifacts,
   cache) via Terraform `aws_codebuild_project` or `aws codebuild create-project`.
2. **Configure** — author `buildspec.yml` (phases, env from Secrets Manager/SSM, artifacts, reports,
   caching), set triggers/webhooks or wire as a CodePipeline build action.
3. **Secure** — least-privilege service role, secrets in Secrets Manager/SSM, VPC + security group for
   private access, KMS encryption.
4. **Verify** — apply [[verify-by-running]]: start a build (`aws codebuild start-build`), poll
   `batch-get-builds` until `SUCCEEDED`, then inspect the **CloudWatch logs**, produced **artifacts** in
   S3, and any **test reports** — confirm the artifact is real and capture the build status/output.

## Inputs
Source provider/repo, toolchain/runtime + build/test commands, artifact shape, compute/OS needs, caching
opportunities, secrets/env required, VPC/private-resource access, trigger model, concurrency and cost
constraints.

## Output
A CodeBuild setup — a build project with a buildspec, right-sized compute/image, caching, triggers or a
pipeline build action, least-privilege role, and KMS/VPC/secrets handling — plus verification that a
build SUCCEEDED and produced the expected artifact and reports.

## Notes
- Gotchas: service roles are routinely over-privileged; secrets leak via plaintext env vars — use
  Secrets Manager/SSM; missing caching makes every build re-download dependencies; builds needing
  private resources fail unless placed in a VPC; the default 60-min timeout can cut off slow builds;
  Docker-in-build needs privileged mode; reserved fleets bill while idle; artifact packaging must match
  what the deploy stage expects.
- IaC/CLI: Terraform `aws_codebuild_project`, `aws_codebuild_source_credential`,
  `aws_codebuild_webhook`, `aws_codebuild_report_group`, `aws_codebuild_fleet`. CLI
  `aws codebuild create-project`, `start-build`, `batch-get-builds`, `list-builds-for-project`.
  CloudFormation `AWS::CodeBuild::Project`, `AWS::CodeBuild::ReportGroup`, `AWS::CodeBuild::Fleet`.
