---
name: aws-codeartifact
description: Use when designing, provisioning, securing, or operating AWS CodeArtifact — the managed software-artifact repository service for storing and sharing packages across npm, PyPI, Maven, NuGet, Cargo, Ruby, Swift, and generic formats with upstream proxying to public registries (AWS CodeArtifact). Loads the CodeArtifact knowledge: domains and repositories, package formats and namespaces, upstream repositories and external connections (npmjs/PyPI/Maven Central), package origin controls, repository/domain policies and resource permissions, authorization tokens and client configuration (npm/pip/twine/mvn/dotnet), KMS encryption, asset storage and deduplication, cost levers, quotas, and verification by publishing and resolving a package. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect) provisioning a private package registry. Consumed by the CodeArtifact specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, codeartifact, developer-tools, package-registry, artifacts, devtools]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS CodeArtifact

A managed **software package repository** for publishing, storing, and sharing dependencies across
**npm, PyPI, Maven, NuGet, Cargo, Ruby (gems), Swift, and generic** formats — with **upstream**
proxying/caching of public registries. It is the AWS-native **private package registry** that the
CodeBuild/CodePipeline chain publishes to and consumes from.

## Core concepts and components
- **Domain** — the top-level container that groups repositories, owns the **KMS key**, holds the asset
  store, and **deduplicates** assets across all its repositories (you pay once per asset).
- **Repository** — a per-format endpoint clients publish to and resolve from; multiple repos live in a
  domain.
- **Package formats** — npm, PyPI, Maven, NuGet, Cargo, Ruby, Swift, generic — each with its native
  client config.
- **Upstream repositories** — chain repos so a request falls through to an upstream and ultimately an
  **external connection** (npmjs.com, PyPI, Maven Central, etc.); fetched public packages are cached and
  **retained** in your domain.
- **Package origin controls** — govern whether a package can be published directly vs ingested from
  upstream (mitigates **dependency-confusion** attacks).
- **Authorization** — short-lived **auth tokens** (12 h default) from `get-authorization-token`, wired
  into npm/pip/twine/mvn/dotnet client config.

## Configuration and sizing
- Model **one domain** (shared KMS key + dedup) with **per-team or per-format repositories**; chain
  **upstreams** so an internal repo falls through to a public-mirror repo with an **external connection**.
  Set **origin controls** to block ingestion of internally-named packages. Size is data-driven — storage
  scales with retained assets; there is no compute to provision.

## Security and IAM
- Control access with **repository** and **domain policies** (resource-based) plus IAM identity
  policies — grant `ReadFromRepository`, `PublishPackageVersion`, etc. least-privilege per team. The
  domain encrypts assets with **KMS** (use a CMK for control). Use **auth tokens** (rotate; they expire),
  and enforce **origin controls** to prevent dependency-confusion. Cross-account sharing via domain
  policy + `AssociateExternalConnection` is restricted to approved principals.

## Cost levers
- Billed on **storage** (per GB-month, **deduplicated per domain**), **requests**, and **data transfer
  out** of region. Levers: one domain to maximize dedup, prune unused package versions / set retention,
  keep clients in-region to avoid transfer-out, and rely on upstream caching instead of re-importing
  public packages repeatedly. There are no idle compute charges.

## Scaling and limits
- Quotas on domains/repositories per account, package versions, asset size, and request rates
  (raisable). Auth tokens expire (default 12 h, max configurable) — long jobs must refresh. External
  connections are limited per repository. Upstream resolution adds latency on first fetch (then cached).

## Operating procedure
1. **Provision** — create the **domain** (with KMS key) and **repositories** with upstream chains and
   external connections via Terraform `aws_codeartifact_domain` / `aws_codeartifact_repository` (+
   `aws_codeartifact_domain_permissions_policy` / `aws_codeartifact_repository_permissions_policy`), or
   `aws codeartifact create-domain` / `create-repository` / `associate-external-connection`.
2. **Configure** — set **origin controls**, upstream order, and client config (`aws codeartifact
   login --tool npm|pip|twine|dotnet` or manual token wiring for Maven/Cargo).
3. **Secure** — least-privilege repo/domain policies, KMS CMK, short-lived rotated auth tokens, origin
   controls against dependency confusion.
4. **Verify** — apply [[verify-by-running]]: authenticate (`aws codeartifact get-authorization-token` /
   `login`), **publish** a test package version, then **resolve/install** it (npm/pip/mvn) from the repo
   and confirm an upstream public package also resolves and is cached — capture the published version and
   install output.

## Inputs
Package formats in use, repo/domain topology (per-team/per-format), upstream/public registries to proxy,
client toolchains, access model (teams, cross-account), KMS/encryption requirements, dependency-confusion
risk, retention/cost constraints.

## Output
A CodeArtifact setup — a domain (KMS) with repositories, upstream chains + external connections, origin
controls, least-privilege policies, and client configuration — plus verification that a package publishes,
resolves from the repo, and a public dependency proxies and caches through the upstream.

## Notes
- Gotchas: **auth tokens expire** (12 h default) so long-lived/CI jobs must refresh; **origin controls**
  are the dependency-confusion guardrail — set them or risk malicious public packages shadowing internal
  ones; assets dedup **per domain**, so split domains lose dedup savings and complicate sharing; external
  connections cache public packages into your domain (storage); client config (`.npmrc`/`pip.conf`/
  `settings.xml`) must point at the repo endpoint and token; cross-account access needs both domain and
  repo policy.
- IaC/CLI: Terraform `aws_codeartifact_domain`, `aws_codeartifact_repository`,
  `aws_codeartifact_domain_permissions_policy`, `aws_codeartifact_repository_permissions_policy`. CLI
  `aws codeartifact create-domain`, `create-repository`, `associate-external-connection`,
  `get-authorization-token`, `login`, `publish-package-version`. CloudFormation
  `AWS::CodeArtifact::Domain`, `AWS::CodeArtifact::Repository`.
