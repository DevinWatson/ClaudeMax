---
name: terraform-iac
description: Use when writing or refactoring Terraform / OpenTofu — designing reusable modules, managing remote state and backends, enforcing safe plan/apply hygiene, pinning providers, using moved/import blocks, and running tflint/tfsec. TRIGGER on structuring IaC, reviewing a risky plan, or untangling state/drift. Any agent that authors, reviews, or audits Terraform (an architect, a plan reviewer, a cloud-security auditor) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: devops
tags: [terraform, opentofu, iac, state, providers]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Terraform IaC

The substantive capability for treating Terraform/OpenTofu as production change management:
clean modular structure, sacred state, and every `apply` driven by a reviewed saved plan.

## When to use this skill
When authoring or refactoring Terraform, reviewing a plan for destructive changes, or
resolving state issues (drift, renames, imports). Not for live `kubectl` operations or Helm
packaging.

## Instructions
1. **Read the constraints first.** Inspect `versions.tf`/`providers.tf` for required
   Terraform and provider versions, the backend config, and the module layout. Run
   `terraform fmt -check` and `terraform validate` for the baseline.
2. **Understand desired vs. current state.** `terraform init` (correct backend), then
   `terraform plan -out=plan.tfbin`. Read the plan: distinguish create / update-in-place /
   **replace (destroy+create)** / destroy. Call out replacements and destroys explicitly —
   they are the high-risk lines.
3. **Design for reuse.** Factor repeated resources into a module with a typed, validated,
   documented `variables.tf`, an `outputs.tf`, and pinned `required_providers`. Prefer
   `for_each` with stable keys over `count` (index churn forces destroy/recreate on list
   reorder). Use data sources over hardcoded IDs.
4. **Keep state safe.** Use a remote backend with locking (S3+DynamoDB, GCS, Terraform
   Cloud). For pure address renames use `moved {}` blocks (or `terraform state mv`) so
   resources are not destroyed and recreated; use `import` blocks to adopt existing infra.
   Never hand-edit `terraform.tfstate`. Commit `.terraform.lock.hcl`.
5. **Review for safety and security.** No secrets in `.tf` or committed `.tfvars`; use
   variables/secret managers and mark sensitive outputs `sensitive = true`. Check IAM/SGs for
   least-privilege (no `0.0.0.0/0` to admin ports, no wildcard `*` actions unless justified).
   Run `tflint` and `tfsec`/`checkov` and report findings.
6. **Apply deliberately.** Only `terraform apply plan.tfbin` (the saved plan), never a bare
   `apply`. Confirm resource counts match the reviewed plan. After apply, run `plan` again to
   prove a clean (no-diff) state and detect drift.

## Inputs
- The Terraform configuration, `versions.tf`/`providers.tf`, the backend config, and the
  current `plan` output for any change being reviewed.

## Output
- A plan summary leading with N to add / N to change / **N to destroy or replace**, naming
  destructive lines.
- Module/resource changes as `path:line` diffs with a rationale for any `moved` block,
  `for_each`, or lifecycle setting; `tflint`/`tfsec` findings.
- The commands run (`init`/`validate`/`plan`/`apply`) and the post-apply clean-plan result.

## Notes
- Treat any `destroy`/`replace` of stateful resources (databases, volumes, buckets) as
  requiring explicit confirmation — surface it loudly, never bury it. Never `-auto-approve`
  against shared state without being told to.
- Fit the repo with [[match-project-conventions]] (module layout, naming, provider choices).
- Confirm convergence with [[verify-by-running]]: run `fmt -check`/`validate`/`plan`, report
  the exact commands and output, and never claim infrastructure converged unless the
  follow-up `plan` shows no changes.
