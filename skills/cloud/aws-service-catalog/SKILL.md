---
name: aws-service-catalog
description: Use when designing, provisioning, securing, or operating AWS Service Catalog — portfolios and products (CloudFormation/Terraform-backed provisioned products), product versions, launch constraints (the assumed role at launch), template/stack-set/notification/tag-update constraints, TagOptions for standardized tagging, access control via IAM principals and portfolio sharing (including org/Organizations sharing), provisioning parameters and provisioned-product lifecycle, and the AppRegistry application association (AWS Service Catalog). Loads the Service Catalog knowledge: how to curate approved products, set launch/governance constraints, share portfolios, let users self-serve, and verify a product provisions under the launch role. Consumed by the Service Catalog specialist and by the AWS role team (aws-cloud-architect / aws-security-reviewer) for curated, governed provisioning.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, service-catalog, governance, self-service, portfolios, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Service Catalog

AWS's service for curating approved, self-service infrastructure: administrators publish
vetted **products** in **portfolios**, and end users launch them within guardrails without
needing the underlying provisioning permissions. It is the **curated-provisioning storefront**
on top of CloudFormation/Terraform — distinct from raw IaC authoring.

## Core concepts and components
- **Products** — a deployable artifact backed by a CloudFormation template (or external/Terraform
  via the Terraform reference engine), with one or more **versions**.
- **Portfolios** — collections of products with access granted to IAM principals; shared with
  other accounts or org-wide via Organizations.
- **Launch constraints** — the IAM **role Service Catalog assumes at launch**, so users
  provision resources they could not create directly (least-privilege self-service).
- **Other constraints** — **template constraints** (restrict parameter values), **stack-set
  constraints** (multi-account/region launch), **notification constraints** (SNS on stack
  events), and **tag-update constraints**.
- **TagOptions** — a library of allowed tag key/values enforced on provisioned products for
  consistent tagging/allocation.
- **Provisioned products** — the running instances users launch; lifecycle (provision,
  update to a new version, terminate) is tracked per user.
- **AppRegistry** — associate products/resources with an application definition for inventory.

## Configuration and sizing
- Group products into portfolios by team/domain; version products instead of editing in
  place. Always attach a **launch constraint** so users need only Service Catalog
  permissions. Enforce **TagOptions** for cost allocation. Share portfolios org-wide via the
  delegated administrator rather than per-account copies.

## Security and IAM
- Grant end users `servicecatalog:*` self-service actions only; the **launch role** holds the
  real provisioning permissions (scope it least-privilege to exactly what the product
  creates). Template constraints prevent users from choosing unsafe parameter values.
  Portfolio sharing is controlled by the administrator/management or delegated-admin account.

## Cost levers
- Service Catalog itself is free; you pay for the resources products provision. The
  governance lever is **TagOptions** for cost allocation and template constraints to prevent
  oversized launches. (Cost optimization itself is owned by the aws-cost-governor role.)

## Scaling and limits
- Limits on products/portfolios per account and versions per product (mostly soft);
  org-sharing scales to many accounts via Organizations; provisioned-product operations are
  asynchronous CloudFormation stack operations under the hood.

## Operating procedure
1. **Provision** — create a portfolio and add products (upload the CloudFormation template,
   create a version).
2. **Configure** — attach a least-privilege launch constraint, add template/stack-set/
   notification constraints and TagOptions, and grant access to IAM principals.
3. **Secure** — give users only Service Catalog self-service permissions, scope the launch
   role, and share the portfolio org-wide via the delegated admin.
4. **Verify** — apply [[verify-by-running]]: as an end-user principal,
   `aws servicecatalog provision-product` and confirm the provisioned product reaches
   `AVAILABLE` via `describe-provisioned-product` (proving the launch role works without the
   user having direct permissions); confirm required TagOptions were applied; terminate the
   test product — capture the output.

## Inputs
Products/templates to publish and their versions, portfolio/team structure, the launch role
and its required permissions, parameter/value restrictions (template constraints), required
tags (TagOptions), end-user principals, and account/org sharing scope.

## Output
The Service Catalog configuration (portfolios, products + versions, launch and other
constraints, TagOptions, access grants, sharing) as code, plus verification that an end user
without direct provisioning rights can launch a product via the launch role, required tags
apply, and the product reaches AVAILABLE.

## Notes
- Gotchas: without a **launch constraint**, the end user needs full underlying provisioning
  permissions (defeating the purpose); template constraints only restrict what the template
  exposes as parameters; updating a product creates a new **version** — existing provisioned
  products are not auto-updated; org sharing requires Organizations all-features and a
  delegated admin; the launch role must trust `servicecatalog.amazonaws.com`. Service Catalog
  governs **who can launch what**; the IaC author (CloudFormation/Terraform) owns the template
  content.
- IaC/CLI: Terraform `aws_servicecatalog_portfolio`, `aws_servicecatalog_product`,
  `aws_servicecatalog_constraint`, `aws_servicecatalog_tag_option`,
  `aws_servicecatalog_principal_portfolio_association`. CLI
  `aws servicecatalog create-portfolio`, `create-product`, `create-constraint`,
  `create-tag-option`, `provision-product`, `describe-provisioned-product`,
  `terminate-provisioned-product`. CloudFormation `AWS::ServiceCatalog::Portfolio`,
  `AWS::ServiceCatalog::CloudFormationProduct`, `AWS::ServiceCatalog::LaunchRoleConstraint`,
  `AWS::ServiceCatalog::TagOption`.
