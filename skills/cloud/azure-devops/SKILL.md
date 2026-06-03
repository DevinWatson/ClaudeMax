---
name: azure-devops
description: Use when designing, provisioning, configuring, or operating Azure DevOps — Microsoft's hosted ALM suite spanning Boards, Repos, Pipelines, Artifacts, and Test Plans (Azure DevOps). Covers organization/project structure, Boards (work items/backlogs/sprints/queries), Repos (Git repos, branch policies, PRs), Pipelines (build/release CI/CD), Artifacts (package feeds + upstream sources), Test Plans, service connections, agent/deployment pools, security groups + permissions, and PATs vs Entra. Loads the knowledge to stand up an org/project, wire repos/boards/feeds/service connections, and verify the ALM flow. Consumed by the azure-devops specialist and by the github-actions team and Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service (Azure DevOps).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-devops, devops, alm, ci-cd]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure DevOps

**Azure DevOps** is Microsoft's hosted **application-lifecycle (ALM)** suite: **Boards**, **Repos**, **Pipelines**,
**Artifacts**, and **Test Plans** under an **organization → project** hierarchy. This skill owns the
**single-service Azure DevOps layer** — org/project structure, the five services, security, and service
connections. (The CI/CD pipeline mechanics themselves are owned with Azure Pipelines.)

## Core concepts and components
- **Organization & project** — an **organization** (backed by an Entra tenant) contains **projects**; a project
  scopes Boards/Repos/Pipelines/Artifacts/Test Plans and its **security groups/teams**.
- **Boards** — **work items** (epics/features/user stories/bugs/tasks) on **backlogs/boards/sprints**, with
  **queries**, area/iteration paths, and process templates (Agile/Scrum/CMMI/Basic).
- **Repos** — **Git** repositories with **branch policies** (required reviewers, build validation, status checks)
  and **pull requests**.
- **Pipelines** — **build + release** CI/CD (YAML and classic); see the Azure Pipelines skill for stages/jobs/
  agents/environments/approvals.
- **Artifacts** — **package feeds** (NuGet/npm/Maven/Python/Universal) with **upstream sources** and views.
- **Test Plans** — manual/exploratory test suites and results.
- **Service connections** — credentials to Azure/registries/external services used by pipelines (prefer
  **workload identity federation** over secrets).

## Configuration and sizing
- Create the **organization** (Entra-backed) and **projects**, choose the **process template**, set up **teams +
  area/iteration paths**, create **repos + branch policies**, **feeds**, and **service connections**, and define
  **security groups/permissions**. Scale is by parallelism (agent jobs) + storage (artifacts/repos), not instances.

## Security and IAM
- Authentication via **Entra ID**; authorize with **security groups**, **project/collection-level permissions**,
  and **branch/feed** permissions. Prefer **Entra/OAuth + workload identity federation** for service connections;
  treat **PATs** as scoped, short-lived secrets (or disable them via policy). Enforce **branch policies** and
  least-privilege project access; audit via the org audit log.

## Cost levers
- Billed by **user licenses** (Basic / Basic+Test Plans; Stakeholder is free), **parallel jobs** (Microsoft-hosted
  vs self-hosted), and **Artifacts storage**. Levers: right-size license tiers, use **self-hosted agents** for
  heavy throughput, prune old artifacts/retention, and grant **Stakeholder** where full access isn't needed.

## Scaling and limits
- Org/project counts, **parallel job** limits (purchased), repo/artifact storage and retention, work-item and API
  **rate limits**, and agent-pool capacity. Self-hosted agents scale throughput; large orgs plan **project
  boundaries** + permissions carefully.

## Operating procedure
1. **Provision** — create org/project via the **azuredevops** Terraform provider (`azuredevops_project`) or
   `az devops project create`; set the **process template**.
2. **Configure** — create **repos** + **branch policies** (`azuredevops_git_repository`,
   `azuredevops_branch_policy_*`), **teams/area paths**, **feeds** (`azuredevops_feed`), **service connections**
   (`azuredevops_serviceendpoint_*`, prefer workload identity), and Boards process.
3. **Secure** — wire **Entra** auth, assign **security groups/permissions**, prefer **workload identity
   federation** over PATs, enforce branch policies.
4. **Verify** — apply [[verify-by-running]]: confirm the project + repo exist (`az devops project show`,
   `az repos list`), confirm a **branch policy** is enforced (`az repos policy list`), and confirm a **service
   connection/feed** resolves. Capture state and result.

## Inputs
The **org/project** structure + process template, the **repos + branch policies**, the **feeds**, the **service
connections** (identity model), the **teams + permissions**, and any Boards/Test Plans setup.

## Output
An Azure DevOps setup: org/projects with the chosen process, repos with enforced branch policies, package feeds,
service connections (workload identity), teams + scoped security groups, license model — plus verification that the
project/repos/policies exist and a service connection/feed resolves.

## Notes
- Gotchas: **PAT sprawl** (prefer Entra + workload identity federation, scope/expire PATs); **parallel-job** limits
  surprise CI throughput; license-tier mistakes cost money (use Stakeholder); **process template** is hard to
  change after the fact; org is bound to an **Entra tenant**. The CI/CD pipeline internals are **Azure Pipelines'**.
  2nd consumers: the github-actions team (cross-platform CI/CD) and the Azure role team
  (azure-platform-engineer / azure-cloud-architect). Cross-platform peer: GitHub (Actions/Repos/Projects/Packages).
- IaC/CLI: Terraform **azuredevops** provider (`azuredevops_project`, `azuredevops_git_repository`,
  `azuredevops_branch_policy_*`, `azuredevops_feed`, `azuredevops_serviceendpoint_*`, `azuredevops_build_definition`);
  CLI `az devops ...`, `az repos ...`, `az pipelines ...`, `az artifacts ...`.