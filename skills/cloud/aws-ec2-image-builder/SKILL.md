---
name: aws-ec2-image-builder
description: Use when designing, provisioning, securing, or operating EC2 Image Builder — image recipes, components (build/test/validate), image pipelines, infrastructure configuration, distribution configuration, golden AMI/container image factories, and automated patch/rebake schedules (EC2 Image Builder). Loads the Image Builder knowledge: how to compose recipes from components, run a build/test pipeline, distribute hardened AMIs across regions/accounts, and verify an image actually built and passed tests. Consumed by the EC2 Image Builder specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they automate golden images.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ec2-image-builder, golden-ami, image-pipeline, hardening, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# EC2 Image Builder

A managed image factory that automates building, testing, and distributing hardened, patched
AMIs and container images on a schedule. Use it to replace hand-built golden images and manual
rebakes with a repeatable, auditable pipeline; reach for a raw `packer` flow only when you need
a multi-cloud tool or features Image Builder lacks.

## Core concepts and components
- **Component** — a YAML document of build/test/validate steps (install, configure, harden,
  reboot, run tests). AWS-managed components (e.g. CIS/STIG hardening, update-linux) or custom.
- **Image recipe** (AMI) / **container recipe** — a base image + an ordered list of components +
  storage config (block device mappings).
- **Image pipeline** — recipe + infrastructure config + distribution config + a schedule/trigger.
- **Infrastructure configuration** — the build EC2 (instance type, subnet, SG, instance profile,
  key, logging to S3, SNS).
- **Distribution configuration** — target regions/accounts, AMI name, tags, launch permissions,
  and (for containers) target ECR repos.

## Configuration and sizing
- Pick a small build instance type unless a component needs more (compilation/large packages).
- Pin a known base image ARN/SSM parameter; version recipes — recipes are immutable once created.
- Layer hardening (CIS/STIG) and `update-linux`/`update-windows` components early; run tests last.

## Security and IAM
- Build instance profile needs `EC2InstanceProfileForImageBuilder` (+ SSM); scope custom S3/ECR
  access tightly. Image Builder itself uses a service-linked role.
- Encrypt output AMIs/snapshots with KMS; share via launch permissions, not public AMIs.
- Place the build instance in a private subnet with egress via NAT/endpoints; lock its SG.

## Cost levers
- You pay only for the underlying build/test EC2 + EBS + storage; terminate is automatic. Keep
  build instances small and schedules sane (e.g. weekly, not hourly). Prune old AMIs/snapshots.

## Scaling and limits
- One pipeline builds one image per run; parallelize with multiple pipelines. Distribution to
  many regions/accounts increases run time. Quotas on components/recipes/pipelines per region.

## Operating procedure
1. **Provision** — define components, an image recipe (base + components + storage), an
   infrastructure config, and a distribution config via Terraform `aws_imagebuilder_*` or
   `aws imagebuilder create-image-recipe` / `create-image-pipeline`.
2. **Configure** — set the schedule/trigger, S3/SNS logging, and target regions/accounts/tags.
3. **Secure** — least-privilege build instance profile, KMS-encrypted output, private subnet,
   launch permissions (not public).
4. **Verify** — apply [[verify-by-running]]: trigger a build with
   `aws imagebuilder start-image-pipeline-execution`, poll `get-image` until state is `AVAILABLE`,
   confirm the test phase passed, and confirm the new AMI appears in `describe-images`.

## Inputs
Base image, required packages/agents/hardening baseline, target OS, regions/accounts to
distribute to, build cadence, logging/notification targets.

## Output
A recipe + component set, infrastructure and distribution configs, the pipeline + schedule, and
the build verification (image state `AVAILABLE`, tests passed, AMI id distributed).

## Notes
- Gotchas: recipes/components are immutable — bump the version to change them; a failed test
  fails the whole image (no AMI produced); the build instance must be able to reach SSM and
  package repos or builds hang; container recipes need a Dockerfile and a target ECR repo.
- IaC/CLI: Terraform `aws_imagebuilder_component`, `aws_imagebuilder_image_recipe`,
  `aws_imagebuilder_container_recipe`, `aws_imagebuilder_image_pipeline`,
  `aws_imagebuilder_infrastructure_configuration`, `aws_imagebuilder_distribution_configuration`.
  CLI `aws imagebuilder create-image-recipe`, `create-image-pipeline`,
  `start-image-pipeline-execution`, `get-image`. CloudFormation `AWS::ImageBuilder::*`.
