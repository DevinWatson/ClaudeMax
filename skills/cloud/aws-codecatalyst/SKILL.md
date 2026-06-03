---
name: aws-codecatalyst
description: Use when designing, provisioning, securing, or operating Amazon CodeCatalyst — the unified software-development service that brings projects, source repositories, CI/CD workflows, cloud development environments, and issue tracking together with blueprints (Amazon CodeCatalyst). Loads the CodeCatalyst knowledge: spaces and projects, blueprints (project and custom), source repositories (native or linked GitHub), workflows (actions, compute/fleets, environments, source/build/test/deploy), Dev Environments (cloud IDEs, devfiles), environments and AWS account connections via IAM roles, issues/planning, packages, the personal access token and identity model, billing tiers, limits, and verification by running a workflow and launching a dev environment. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect) standing up a unified dev platform. Consumed by the CodeCatalyst specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, codecatalyst, developer-tools, devops, unified-dev, devtools]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon CodeCatalyst

A **unified software-development service** that combines **source repositories, CI/CD workflows, cloud
development environments, issue tracking, and packages** under one roof, bootstrapped by **blueprints**.
Where CodeBuild/CodeDeploy/CodePipeline are discrete building blocks, CodeCatalyst is the **integrated
end-to-end developer platform** spanning plan → code → build → deploy.

## Core concepts and components
- **Space** — the top-level org/billing boundary; contains projects, members, and **AWS account
  connections**.
- **Project** — a unit of work grouping source repos, workflows, dev environments, issues, and
  packages.
- **Blueprints** — parameterized templates that scaffold a whole project (repos + workflows + IaC);
  **custom blueprints** standardize how teams start projects, with lifecycle updates pushed to existing
  projects.
- **Source repositories** — native Git repos or **linked GitHub** repositories.
- **Workflows** — YAML CI/CD: **actions** (build/test/deploy, GitHub Actions, CDK/CFN deploy) running on
  on-demand or **provisioned fleets**, gated by **environments** that map to AWS accounts via IAM roles.
- **Dev Environments** — managed **cloud IDEs** (VS Code, JetBrains, Cloud9) defined by a **devfile**,
  pre-cloning the repo and pre-installing the toolchain.
- **Issues / packages** — built-in planning boards and package publishing.

## Configuration and sizing
- Model a **space per org**, **projects per product/team**, and standardize startup with **custom
  blueprints**. Choose workflow **compute**: on-demand for bursty CI, **provisioned fleets** for
  low-latency/persistent runs; pick **environments** to bind workflows to dev/prod AWS accounts. Size
  **Dev Environment** instance type via the devfile to the workload.

## Security and IAM
- Identity is via **AWS Builder ID / IAM Identity Center**; tokens are **personal access tokens** (PATs)
  scoped per user. Workflows and dev environments reach AWS through **account connections** + **IAM
  roles** assigned to **environments** — scope those roles least-privilege to what the workflow deploys.
  Manage **space/project membership** carefully and gate production environments. Linked GitHub repos use
  a controlled connection.

## Cost levers
- Billed by tier (**Free / Standard / Enterprise**) plus metered **compute minutes** (workflows) and
  **Dev Environment** runtime/storage. Levers: stop idle **Dev Environments** (they bill while running),
  right-size their instance type, prefer on-demand workflow compute unless fleets are justified, keep
  most users on the included tier, and clean up unused projects/storage.

## Scaling and limits
- Quotas on spaces/projects/members, concurrent workflow runs, fleet capacity, and Dev Environment
  count/idle-timeout. PATs expire and must be rotated. Account connections are per-space and must be
  approved. Blueprint updates propagate to projects but require review.

## Operating procedure
1. **Provision** — create the **space**, connect **AWS accounts** (IAM roles), and create a **project**
   from a **blueprint** (or a custom blueprint); add **source repositories**.
2. **Configure** — author **workflows** (actions, compute/fleet, environments) and **devfiles** for Dev
   Environments; set up issues/packages and environment-to-account role mappings.
3. **Secure** — least-privilege environment IAM roles, scoped PATs, controlled space/project membership,
   gated production environments, reviewed account connections.
4. **Verify** — apply [[verify-by-running]]: run a **workflow** and confirm every action **Succeeded**
   and it deployed into the bound environment/account, then **launch a Dev Environment** and confirm the
   repo clones and the toolchain is ready — capture the workflow run status/output.

## Inputs
Team/org structure (space/projects), startup standardization needs (blueprints), source location (native
vs GitHub), CI/CD flow + compute model, target AWS accounts/environments and roles, Dev Environment
toolchain (devfile), identity model, billing tier, cost constraints.

## Output
A CodeCatalyst setup — a space with AWS account connections, blueprint-scaffolded projects with source
repos, workflows bound to environments via least-privilege roles, and devfile-defined Dev Environments —
plus verification that a workflow ran to success and a Dev Environment launches ready to code.

## Notes
- Gotchas: **Dev Environments bill while running** — set idle timeouts and stop them; workflow
  **environment roles** must be scoped to what's deployed, not broad admin; **PATs expire** and break CI
  if not rotated; **custom blueprint** updates propagate but need review to avoid breaking projects;
  account connections must be approved before workflows can deploy; linked-GitHub vs native-repo choices
  affect available actions; the **on-demand vs fleet** compute choice drives both latency and cost.
- IaC/CLI: Terraform coverage is **partial/absent** — there is no first-class CodeCatalyst provider
  resource; provision the AWS **account connection roles** with `aws_iam_role`/`aws_iam_policy` and
  manage spaces/projects/workflows/blueprints through the console or the **`aws codecatalyst`** CLI
  (`list-spaces`, `create-project`, `list-workflow-runs`, `start-workflow-run`,
  `create-dev-environment`). Workflows themselves are YAML committed to the repo, not CloudFormation.
