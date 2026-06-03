---
name: aws-systems-manager
description: Use when designing, provisioning, securing, or operating AWS Systems Manager (SSM) — Parameter Store (string/secure-string parameters, hierarchies, versions), Session Manager (browser/CLI shell without SSH/bastions), Patch Manager (patch baselines, maintenance windows, compliance), Run Command (ad-hoc command execution at fleet scale), State Manager (associations enforcing desired config), Automation (runbooks/documents for operational workflows and remediation), Inventory (software/config collection), Fleet Manager, and SSM documents (AWS Systems Manager). Loads the SSM knowledge: how to manage parameters, get keyless shell access, patch and configure fleets, automate operations, and verify commands/patches/sessions succeed. Consumed by the Systems Manager specialist and by the AWS role team (aws-cloud-architect / aws-security-reviewer) for operational management.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, systems-manager, ssm, operations, patching, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Systems Manager

AWS's operational management hub for fleets of EC2/on-prem/edge nodes: parameters, keyless
shell access, patching, command execution, desired-state enforcement, and automation
runbooks. SSM owns **day-2 operations** of compute — distinct from CloudFormation/Terraform
(provisioning) and from Config (compliance recording).

## Core concepts and components
- **Parameter Store** — hierarchical config/secrets: `String`, `StringList`, and
  `SecureString` (KMS-encrypted) parameters with versions, labels, and policies; `Standard`
  vs `Advanced` tiers. A free/cheap alternative to Secrets Manager for non-rotated values.
- **Session Manager** — browser/CLI shell to instances with **no SSH, no open ports, no
  bastion**; sessions are auditable (CloudTrail) and loggable to S3/CloudWatch.
- **Patch Manager** — **patch baselines** define approved patches; **maintenance windows**
  schedule patching; reports patch **compliance** per instance.
- **Run Command** — run a document (e.g., `AWS-RunShellScript`) across a targeted fleet
  ad hoc, with rate control and output capture.
- **State Manager** — **associations** continuously enforce a desired configuration
  (agents installed, config applied) on a schedule.
- **Automation** — **runbooks** (SSM documents) orchestrate multi-step operational workflows
  and remediations (also invoked by Config remediation, EventBridge, maintenance windows).
- **Inventory / Fleet Manager** — collect software/config inventory and manage nodes from a
  console. Nodes need the **SSM Agent** + an instance profile (or hybrid activation).

## Configuration and sizing
- Organize parameters by hierarchy (`/app/env/key`) for path-based IAM. Use Standard tier
  unless you need >4 KB values, higher throughput, or parameter policies. Target Run
  Command/State Manager by tags/resource groups. Schedule patching in maintenance windows
  with concurrency/error thresholds.

## Security and IAM
- Instances need an instance profile with `AmazonSSMManagedInstanceCore`. Scope parameter
  access by path and KMS key; SecureString parameters require `kms:Decrypt` on the key.
  Prefer Session Manager over SSH (no inbound ports) and log sessions for audit. Scope
  Automation assume roles least-privilege. Avoid plaintext secrets — use SecureString or
  Secrets Manager.

## Cost levers
- Parameter Store Standard params + Standard throughput are free; **Advanced** parameters
  and higher API throughput are billed; Session Manager and Run Command are free (you pay
  for logging/data). Watch Advanced-tier parameter counts and Automation step volume.

## Scaling and limits
- Run Command/State Manager target large fleets with rate/concurrency controls. Parameter
  Store: 10k Standard params (free tier), 100k Advanced; value size 4 KB (Standard) / 8 KB
  (Advanced); API throughput limits (raise with higher-throughput setting). Maintenance
  window task concurrency is configurable.

## Operating procedure
1. **Provision** — ensure target nodes run the SSM Agent with the managed-instance instance
   profile; create the KMS key for SecureString parameters.
2. **Configure** — define parameters (hierarchy/tiers), patch baselines + maintenance
   windows, State Manager associations, Run Command/Automation documents, and Session
   Manager logging.
3. **Secure** — path/KMS-scoped parameter IAM, least-privilege Automation roles, Session
   Manager session logging, no open SSH ports.
4. **Verify** — apply [[verify-by-running]]: `aws ssm send-command` a no-op and confirm
   `Status: Success` via `get-command-invocation`; `aws ssm get-parameter --with-decryption`
   returns the expected value; start a Session Manager session and confirm shell access;
   run a patch scan and confirm `describe-instance-patch-states` reports compliance —
   capture the output.

## Inputs
Fleet to manage (tags/accounts/regions), parameters/secrets to store, patch policy and
maintenance windows, desired-state associations, operational runbooks needed, session-access
and logging requirements, KMS keys, and tagging conventions.

## Output
The SSM configuration (parameters, patch baselines + maintenance windows, State Manager
associations, Run Command/Automation documents, Session Manager logging) as code, plus
verification that a command succeeds, a parameter resolves, a session connects, and patch
compliance reports.

## Notes
- Gotchas: a node is unmanaged until the **SSM Agent + instance profile + network path to
  the SSM endpoints** (or VPC endpoints in private subnets) all exist — the most common
  failure; SecureString reads silently fail without `kms:Decrypt`; Run Command needs the
  document to exist in the region; State Manager associations re-run on schedule and can
  fight manual changes; Parameter Store is not a rotating-secrets store (use Secrets Manager
  for rotation). For provisioning use CloudFormation/Terraform, for compliance recording use
  Config — SSM is day-2 ops.
- IaC/CLI: Terraform `aws_ssm_parameter`, `aws_ssm_document`, `aws_ssm_association`,
  `aws_ssm_patch_baseline`, `aws_ssm_maintenance_window`. CLI `aws ssm put-parameter`,
  `get-parameter`, `send-command`, `start-session`, `create-association`,
  `start-automation-execution`, `describe-instance-patch-states`. CloudFormation
  `AWS::SSM::Parameter`, `AWS::SSM::Document`, `AWS::SSM::Association`,
  `AWS::SSM::PatchBaseline`, `AWS::SSM::MaintenanceWindow`.
