---
name: aws-ecr
description: Use when designing, provisioning, securing, or operating Amazon ECR — private and public container/OCI registries, repositories, image tags and immutability, lifecycle policies, repository/registry permissions, image scanning (basic/enhanced via Inspector), cross-account/cross-region replication, pull-through cache, and push/pull auth (Amazon ECR). Loads the ECR knowledge: how to create a repo, lock down access, scan and prune images, replicate, and verify a push/pull works. Consumed by the ECR specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they manage container images.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ecr, container-registry, oci, image-scanning, containers]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon ECR

A managed Docker/OCI container registry. ECR stores, scans, and serves the images that ECS, EKS,
Lambda (container images), and App Runner pull. It is the registry layer — not the orchestrator;
ECS/EKS/Fargate run the images that ECR holds.

## Core concepts and components
- **Repository** — a named image store (private or public). **Image** — tags + an immutable digest.
- **Tag immutability** — when enabled, a tag cannot be overwritten (forces new tags, prevents
  silent drift). **Lifecycle policy** — automatic pruning rules (e.g. keep last N, expire untagged).
- **Repository policy** (resource-based) + **registry permissions** — who may pull/push, incl.
  cross-account. **Registry** — the per-account/region container for repos.
- **Scanning** — **basic** (CVE scan on push) or **enhanced** (continuous, via Amazon Inspector).
- **Replication** — cross-region/cross-account; **pull-through cache** for upstream registries
  (Docker Hub, Quay, etc.).

## Configuration and sizing
- Enable **tag immutability** and **scan-on-push** at repo creation. Add a lifecycle policy from
  day one so untagged/old images are pruned automatically.
- Use a sane repo naming convention (`team/app`) and per-repo, not one giant repo.

## Security and IAM
- Prefer least-privilege repository policies; for cross-account pulls grant only `ecr:GetDownload*`
  + `BatchGetImage` to specific principals. Pullers also need `ecr:GetAuthorizationToken`.
- Encrypt repos with KMS (CMK for sensitive images). Enable enhanced scanning and gate deploys on
  no critical CVEs. Avoid public repos unless intentionally distributing publicly.

## Cost levers
- Billed for storage (GB-month) + data transfer. Lifecycle policies to prune untagged/old images
  are the main lever; use VPC endpoints / replication wisely to control cross-region transfer.

## Scaling and limits
- Scales transparently; per-region quotas on repos and images per repo. Pull-through cache
  reduces upstream rate-limit pain (e.g. Docker Hub). Replication lag is async.

## Operating procedure
1. **Provision** — create the repository with tag immutability, KMS encryption, and scan-on-push
   via Terraform `aws_ecr_repository` or `aws ecr create-repository`.
2. **Configure** — attach a lifecycle policy, a repository policy (and replication / pull-through
   cache if needed), and image-scanning configuration.
3. **Secure** — least-privilege repo/registry policy, KMS encryption, enhanced scanning, private
   by default, VPC endpoints for in-VPC pulls.
4. **Verify** — apply [[verify-by-running]]: authenticate with
   `aws ecr get-login-password | docker login`, `docker push` a test image, confirm it appears via
   `aws ecr describe-images`, confirm `describe-image-scan-findings` returns results, and `docker
   pull` it back to prove pull access.

## Inputs
Repos needed and naming, who pushes/pulls (incl. cross-account), tag policy, retention/pruning
rules, scanning level, encryption requirements, replication/cache needs.

## Output
A repository definition with immutability + KMS + scan-on-push, a lifecycle policy, repo/registry
permissions, replication/cache config, and verification of a successful push, scan, and pull.

## Notes
- Gotchas: `ecr:GetAuthorizationToken` is account-level (not in the repo policy) — easy to miss
  on cross-account pulls; tag immutability blocks overwriting (intended); lifecycle policies act
  asynchronously; the auth token expires (~12h); public ECR is a separate API surface.
- IaC/CLI: Terraform `aws_ecr_repository`, `aws_ecr_lifecycle_policy`, `aws_ecr_repository_policy`,
  `aws_ecr_registry_policy`, `aws_ecr_replication_configuration`, `aws_ecr_pull_through_cache_rule`.
  CLI `aws ecr create-repository`, `get-login-password`, `describe-images`,
  `describe-image-scan-findings`, `put-lifecycle-policy`. CloudFormation `AWS::ECR::*`.
