---
name: azure-artifacts
description: Use when designing, provisioning, configuring, or operating Azure Artifacts — Azure DevOps' managed package-management service for hosting and sharing npm, NuGet, Maven, Python, and Cargo packages plus Universal Packages (Azure Artifacts). Covers feeds, project- vs organization-scoped feeds, upstream sources (public registry proxying/caching), views (@local/@prerelease/@release for promotion gates), feed permissions (Reader/Contributor/Owner), retention policies, and CI/CD consumption. Loads the knowledge to stand up feeds, wire upstream sources, gate promotion via views, and verify a package publishes and restores. Consumed by the azure-artifacts specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-artifacts, devops, package-management, feeds]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Artifacts

**Azure Artifacts** is Azure DevOps' managed **package-management** service: it hosts and shares packages across
**npm, NuGet, Maven, Python (PyPI), and Cargo**, plus **Universal Packages**, behind authenticated **feeds**. This
skill owns the **single-service Azure Artifacts layer** — feeds, upstream sources, views, retention, and the
publish/restore flow for builds and developers.

## Core concepts and components
- **Feed** — the unit that stores packages; can be **project-scoped** (shares the project's permissions) or
  **organization-scoped** (cross-project sharing). A feed can hold **multiple package types** at once.
- **Package protocols** — **npm, NuGet, Maven, Python (PyPI), Cargo**, and **Universal Packages** (arbitrary
  versioned blobs) — each consumed with its native client (`npm`, `dotnet`/`nuget`, `mvn`, `pip`/`twine`, `cargo`).
- **Upstream sources** — proxy + cache packages from **public registries** (npmjs, nuget.org, Maven Central,
  PyPI, crates.io) and from **other feeds**; consumers get one authenticated endpoint and a cached copy.
- **Views** — `@local`, `@prerelease`, `@release` slices used as **promotion gates**: publish to `@local`, then
  promote a vetted version into a view so downstream consumers only see released packages.
- **Retention policies** — automatic cleanup by count/age, with the ability to **retain** packages referenced by a
  release pipeline; controls storage growth.

## Configuration and sizing
- Create a **feed** (project- or org-scoped), enable the needed **upstream sources**, define **views** for
  promotion, and set **retention** (max versions to keep, days). There is no instance to size — capacity is the
  **Artifacts storage** consumed; sizing means choosing scope, retention, and which upstreams to cache.

## Security and IAM
- Authenticate via **Entra ID**; authorize per-feed roles (**Reader / Contributor / Collaborator / Owner**) on
  users, teams, and the build identity (`Project Collection Build Service`). Prefer **Entra/OAuth + workload
  identity** for pipeline auth; treat **PATs** as scoped, short-lived secrets. Grant the build identity the minimum
  (Contributor to publish), and lock upstream-publish rights to prevent dependency confusion.

## Cost levers
- Free storage up to a tier, then billed by **stored artifact GB**. Levers: tighten **retention** (keep fewer
  versions), prune unused **upstream-cached** packages, scope feeds to avoid duplication, and avoid storing large
  Universal Packages where a registry/blob store fits better.

## Scaling and limits
- Per-feed package/version counts, total **storage**, upstream-source counts, and API **rate limits**. Heavy
  monorepos plan feed boundaries; retention keeps feeds from growing unbounded.

## Operating procedure
1. **Provision** — create the **feed** via the **azuredevops** Terraform provider (`azuredevops_feed`) or
   `az artifacts feed create`; choose project- vs org-scope.
2. **Configure** — enable **upstream sources** (`azuredevops_feed`, or `az artifacts universal`/feed settings),
   define **views** for promotion, set **retention**, and add the connection (`.npmrc` / `nuget.config` /
   `settings.xml` / `pip.conf` / Cargo config) for consumers.
3. **Secure** — wire **Entra** auth, assign per-feed **roles** (least privilege to the build identity), restrict
   upstream publish.
4. **Verify** — apply [[verify-by-running]]: publish a test package (`npm publish` / `dotnet nuget push` /
   `twine upload`) to the feed and restore it from a clean cache (`npm install` / `dotnet restore` / `pip install`),
   confirm the **view** shows the promoted version (`az artifacts universal download` or list), and capture output.

## Inputs
The **feeds** + their scope, the **package protocols** in use, **upstream sources** to proxy, **views** for
promotion, **retention** settings, and the **feed permissions** (identities + roles, build identity).

## Output
An Azure Artifacts setup: feed(s) with the right scope, enabled upstream sources, promotion views, retention
policy, and least-privilege feed roles — plus verification that a package publishes, restores from a clean cache,
and appears in the expected view.

## Notes
- Gotchas: **dependency confusion** if upstream publish is open — lock it down and prefer feed-first resolution;
  **retention** deleting in-use versions (retain pipeline-referenced packages); **PAT sprawl** (prefer Entra +
  workload identity); project- vs org-scope is awkward to change after the fact; Cargo/Universal support has
  protocol-specific quirks. 2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect).
  Cross-cloud peers: AWS CodeArtifact, GCP Artifact Registry.
- IaC/CLI: Terraform **azuredevops** provider (`azuredevops_feed`, `azuredevops_feed_permission`); CLI
  `az artifacts feed ...`, `az artifacts universal ...`; client config via `.npmrc`/`nuget.config`/`settings.xml`/
  `pip.conf`/Cargo config. No Bicep/azurerm resource — Azure Artifacts lives in the Azure DevOps control plane.
