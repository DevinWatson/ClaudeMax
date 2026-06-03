---
name: aws-mainframe-modernization
description: Use when designing, provisioning, securing, or operating AWS Mainframe Modernization — the managed runtime environments and application deployments for the two patterns: automated refactor (AWS Blu Age, COBOL/PL-I to modern Java) and replatform (Rocket/Micro Focus, recompile and run COBOL as-is), plus the analyzer/assessment tooling, batch + online transaction workloads, and data-set / file migration for moving legacy mainframe applications to AWS (AWS Mainframe Modernization). Loads the mainframe-modernization knowledge: how to assess a legacy estate, choose refactor vs replatform, provision a managed runtime, deploy an application, and verify it runs. Consumed by the Mainframe Modernization specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they modernize legacy workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, mainframe-modernization, refactor, replatform, blu-age, cobol]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Mainframe Modernization

A managed platform to migrate and run **legacy mainframe** (COBOL, PL/I, batch + online/CICS-style)
workloads on AWS. It offers two modernization patterns plus assessment tooling, and provides
managed **runtime environments** where you deploy the resulting applications. It modernizes whole
mainframe applications; database-only moves still go through DMS and program tracking through
Migration Hub.

## Core concepts and components
- **Refactor (AWS Blu Age)** — automated code transformation of COBOL/PL-I (and data) into modern
  **Java** + web stack, removing the legacy language dependency.
- **Replatform (Rocket / Micro Focus engine)** — recompile and run the existing COBOL largely
  **as-is** on a managed runtime, preserving the source for lower-risk lift.
- **Runtime environment** — the managed compute (single/HA) that hosts deployed applications;
  sized by capacity and high-availability needs.
- **Application** — a versioned deployable (program + JCL/batch + configuration) deployed into a
  runtime environment; supports **batch** jobs and **online transaction** workloads.
- **Analyzer / assessment** — tooling to inventory the estate, measure complexity, and recommend
  refactor vs. replatform. **Data-set/file migration** moves VSAM/sequential files and DB data.

## Configuration and sizing
- Choose the pattern from assessment: refactor for long-term elimination of the legacy stack,
  replatform for speed and lower change risk. Size the runtime environment to transaction +
  batch throughput; use HA for production.
- Migrate data sets/files and validate them alongside the application; keep deployment artifacts
  versioned.

## Security and IAM
- Runtime environments run in your VPC — use private subnets, security groups, and KMS encryption
  for storage and data sets. Scope IAM to `m2:*` for the modernization team and integrate with
  Secrets Manager for application credentials.
- Protect source/transformed code (intellectual property) and audit deployments via CloudTrail.

## Cost levers
- Pay for runtime-environment compute hours + storage; stop/scale down non-production
  environments, right-size capacity, and consolidate applications per environment where the
  isolation model allows.

## Scaling and limits
- Scale via runtime-environment capacity and HA configuration; batch windows and online TPS drive
  sizing. Engine/language feature support depends on the chosen pattern's compatibility — confirm
  during assessment.

## Operating procedure
1. **Provision** — create a runtime environment (engine = Blu Age or Micro Focus, capacity, HA,
   VPC) via Terraform `aws_m2_environment` or `aws m2 create-environment`.
2. **Configure** — package the application (transformed/recompiled code + JCL/config), create it
   with `create-application`, migrate data sets/files, and deploy the application version.
3. **Secure** — private VPC placement + SGs, KMS encryption, least-privilege `m2` IAM, Secrets
   Manager for app creds, CloudTrail auditing.
4. **Verify** — apply [[verify-by-running]]: `aws m2 get-environment` shows the runtime AVAILABLE,
   `aws m2 get-application` / `list-deployments` shows the app deployed and RUNNING, then run a
   representative batch job or online transaction and confirm it completes with the expected output.

## Inputs
Legacy estate inventory (languages, batch/online mix, data sets), assessment results, chosen
pattern (refactor vs replatform), throughput/HA targets, VPC/security constraints, and data
migration requirements.

## Output
A managed runtime environment (correct engine + sizing), a deployed application version, migrated
data sets, secured VPC/IAM/encryption, and verification that the environment is AVAILABLE, the app
is RUNNING, and a representative workload completes correctly.

## Notes
- Gotchas: pick the pattern deliberately — refactor (Blu Age) removes the legacy language but is a
  bigger change; replatform (Micro Focus) is faster but keeps COBOL; engine/feature support is
  pattern-specific (validate in assessment); runtime environments incur ongoing compute cost (stop
  non-prod); data-set migration + validation is a distinct workstream; this service modernizes
  applications, not standalone databases (DMS) and does not track the program (Migration Hub).
- IaC/CLI: Terraform `aws_m2_environment`, `aws_m2_application`, `aws_m2_deployment`. CLI
  `aws m2 create-environment`, `create-application`, `create-deployment`, `start-application`,
  `start-batch-job`, `get-environment`, `list-deployments`. CloudFormation
  `AWS::M2::Environment`, `AWS::M2::Application`.
