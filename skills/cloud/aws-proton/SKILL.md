---
name: aws-proton
description: Use when designing, provisioning, securing, or operating AWS Proton — environment templates and service templates (CloudFormation/Terraform), template versions and bundles, environments (provisioned by platform teams) and services + service instances (deployed by developers), template sync from Git, service pipelines, environment account connections, and component support — for self-service infrastructure provisioning by platform engineering teams (AWS Proton). Loads the Proton knowledge: author and publish templates, register environments, let developers deploy services from a curated catalog, and verify provisioning succeeds. Consumed by the Proton specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they stand up self-service platforms.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, proton, platform-engineering, templates, environments, iac, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Proton

AWS's managed service for platform teams to define, vend, and govern standardized
infrastructure. Platform engineers author **templates**; application developers deploy
**services** from a curated catalog without writing the underlying IaC themselves. Proton
provisions and keeps deployed stacks in sync with their template versions.

## Core concepts and components
- **Environment templates** — define shared infrastructure (VPC, cluster, shared DBs) that
  many services run inside. Rendered as **CloudFormation** or **Terraform** (Terraform via a
  self-managed provisioning model with your own CodeBuild-based pipeline).
- **Service templates** — define the per-service infrastructure (compute, roles, pipeline) and
  declare which environment template(s) they are **compatible** with.
- **Template bundles** — the schema (`schema.yaml` with OpenAPI-style input spec), `manifest`,
  and IaC files (`infrastructure/`, optional `pipeline/`) packaged in S3 or synced from Git.
- **Template versions** — semantic **major.minor**; publishing a version makes it deployable;
  recommended versions drive update prompts to deployed instances.
- **Environments** — instantiations of an environment template, provisioned in the management
  account or in a connected account via an **environment account connection**.
- **Services and service instances** — a service deploys one or more **service instances**
  (one per environment), optionally with a **service pipeline** (CI/CD) defined in the template.
- **Components** — developer-defined extra infrastructure attached to a service instance within
  platform-set guardrails. **Template sync** keeps templates registered from a Git repo.

## Configuration and sizing
- Choose a provisioning model per template: **AWS-managed CloudFormation** (Proton provisions
  directly) or **self-managed Terraform/CodeBuild** (Proton triggers your pipeline). Keep input
  `schema.yaml` minimal and well-typed so developer choices are constrained. Pin compatible
  environment template versions per service template. Use template sync for GitOps authoring.

## Security and IAM
- Proton assumes a **service role** to provision; environment templates use an **environment
  role** scoped to exactly the resources that environment may create. Cross-account environments
  use environment account connections (an IAM role in the target account). Constrain developer
  permissions to `proton:CreateService`/`GetService` etc. so they vend from the catalog but
  cannot author or publish templates. Scope CodeBuild provisioning roles least-privilege.

## Cost levers
- Proton itself has no per-resource charge; cost is the **provisioned infrastructure** plus the
  CodeBuild minutes (Terraform/self-managed) and any service pipelines. Lever: keep template
  defaults right-sized and discourage over-provisioned developer inputs via the schema.

## Scaling and limits
- Quotas on environments, services, service instances, templates, and template versions per
  account/region (mostly soft/raisable). Provisioning is gated by the underlying CloudFormation
  or CodeBuild concurrency; large fan-out of service instances is serialized per service.

## Operating procedure
1. **Provision** — register an environment template + version (bundle in S3 or Git sync), then
   create an environment (set the environment/service roles and, for cross-account, the account
   connection) via Terraform `aws_proton_environment_template`/`aws_proton_environment` or
   `aws proton create-environment-template`.
2. **Configure** — register a service template + version compatible with the environment, define
   its input schema and (optionally) a pipeline; publish the versions you want deployable.
3. **Secure** — set least-privilege Proton service role, environment role, and account
   connections; restrict developer IAM to deploy-only from the catalog.
4. **Verify** — apply [[verify-by-running]]: create a service/service instance from the template
   and confirm `aws proton get-service`/`get-service-instance` shows status `SUCCEEDED`, the
   underlying CloudFormation/Terraform stack is `CREATE_COMPLETE`, and a template update
   recommendation propagates to instances as expected — capture the actual output.

## Inputs
The shared infrastructure to standardize, environment vs service split, IaC engine
(CloudFormation or Terraform), input schema for developer choices, target accounts/regions and
account connections, pipeline requirements, IAM/role boundaries, and update/versioning policy.

## Output
The Proton template bundles (environment + service, with `schema.yaml`, manifest, infrastructure,
optional pipeline), registered template versions, environments and account connections, and
service definitions as code, plus verification that a service instance provisions to SUCCEEDED
and template updates propagate.

## Notes
- Gotchas: a service template must declare **compatible environment template** major versions or
  services cannot deploy; Terraform/self-managed provisioning requires you to own the CodeBuild
  pipeline and an S3/DynamoDB Terraform backend (Proton does not manage state for you);
  publishing a version is separate from registering it; the `schema.yaml` input spec is strict
  (typos fail registration silently-ish at deploy); environment account connections must be
  accepted in the target account before use; updating a template version does not auto-update
  deployed instances unless you trigger an instance update with the new version.
- IaC/CLI: Terraform `aws_proton_environment_template`, `aws_proton_environment_template_version`,
  `aws_proton_service_template`, `aws_proton_service_template_version`, `aws_proton_environment`,
  `aws_proton_service`, `aws_proton_environment_account_connection`. CLI `aws proton
  create-environment-template`, `create-template-sync-config`, `create-service`,
  `create-service-instance`, `get-service`, `list-service-instances`. CloudFormation
  `AWS::Proton::EnvironmentTemplate`, `AWS::Proton::ServiceTemplate`, `AWS::Proton::Environment`.
