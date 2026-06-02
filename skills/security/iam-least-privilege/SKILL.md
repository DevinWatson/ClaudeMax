---
name: iam-least-privilege
description: Use to review cloud IAM policies/roles/bindings (AWS/GCP/Azure) for least-privilege violations — parse each statement into Effect/Principal/Action/Resource/Condition, hunt wildcards, privilege-escalation paths, over-broad trust, and missing conditions, account for Deny/SCP/permission-boundaries before declaring access effective, and give tightened least-privilege rewrites. TRIGGER on "review IAM policy / cloud permissions for over-privilege." Read-only — only get/list/describe IAM calls, never write/attach/create. Any agent that audits cloud authorization (an IAM reviewer, a cloud security checker, an IaC reviewer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: security
tags: [security, iam, cloud, least-privilege, aws, gcp, azure]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# IAM Least Privilege

The substantive cloud-authorization capability: review IAM policies, roles, and bindings the user
owns or is authorized to audit (AWS / GCP / Azure) and tighten them toward least privilege —
analyzing the *cloud authorization model*, not application authz logic.

## When to use this skill
When reviewing cloud IAM for wildcard grants, privilege-escalation paths, over-broad trust, and
missing conditions, and proposing tightened policies. Pairs with a ranking skill (e.g.
[[severity-triage]]) to rank grants by blast radius. Not for application-level authz, route
guards, or RBAC logic in first-party source (that is appsec-review).

## Instructions
1. **Locate and parse the policies.** Identify the provider and artifact: AWS IAM policy JSON /
   SCPs / trust policies, GCP IAM bindings / role definitions, Azure role assignments / custom role
   JSON — often in Terraform/CloudFormation/Bicep (`Grep`/`Glob` for `aws_iam_policy`/
   `PolicyDocument`/`google_project_iam`/`roleDefinition`) or exported via CLI. Parse each
   statement into **Effect / Principal / Action / Resource / Condition** and note the identity it
   attaches to and what it is *meant* to do.
2. **Hunt least-privilege violations and danger patterns:**
   - **Wildcards** — `Action: "*"`, service wildcards (`s3:*`), `Resource: "*"` on mutating
     actions; `*:*` on `*` is the classic admin-equivalent finding.
   - **Privilege escalation** — `iam:*`, `iam:PassRole` (especially `Resource:*`),
     `iam:CreatePolicyVersion`/`AttachUserPolicy`/`PutUserPolicy`, `iam:CreateAccessKey`,
     `sts:AssumeRole` into stronger roles, `lambda:*`+`iam:PassRole`, GCP
     `iam.serviceAccounts.actAs`/`setIamPolicy`/`*.admin`, Azure `Owner`/`User Access
     Administrator`/`Microsoft.Authorization/*/write`.
   - **Over-broad trust / public exposure** — `Principal: "*"` or wildcard accounts in resource and
     trust policies (assume-role, S3, KMS), missing external-ID/condition on cross-account trust.
   - **Confused-deputy & missing conditions** — no `aws:SourceArn`/`SourceAccount`, missing
     `aws:PrincipalOrgID`, absent MFA/`SecureTransport`/source-IP conditions where expected.
   - **Stale/unused breadth** — services granted that the workload does not use.
3. **Distinguish allow vs. effective access.** Account for `Deny` statements, SCPs, permission
   boundaries, and condition keys before declaring something exploitable — a broad `Allow` capped
   by a boundary or `Deny` is lower risk. Say when you cannot see the boundary.
4. **Remediate with tightened policy.** Per finding, give a concrete least-privilege rewrite: scope
   `Action` to the operations used, `Resource` to specific ARNs/projects, add the missing
   `Condition` keys, replace `PassRole: *` with a scoped role ARN. Provide corrected JSON/HCL.
5. **Rank for the consumer.** Hand each finding to a ranking skill ([[severity-triage]]): severity
   scales with how much the grant expands blast radius (admin/escalation/public = critical/high);
   confidence with how sure you are the access is effective (full path visible vs. boundary unknown).

## Inputs
- The IAM policies/roles/bindings (file or exported JSON), the provider, what each identity should
  do, and any visible Deny/SCP/permission-boundary context. CLI access is optional and read-only.

## Output
- Scope (identities/policies reviewed, provider, intended purpose).
- Findings, each with: policy/role name, pattern (wildcard/priv-esc/public-trust/missing-condition),
  the offending statement, why it matters (blast radius / escalation path), whether it is capped by
  a Deny/SCP/boundary (or "unknown"), and a tightened remediation snippet — ready to be ranked.
- A summary with counts by severity and the highest-priority tightening.

## Notes
- Defensive only. Identify over-privilege and escalation paths and how to close them; never use
  them to escalate, and never target accounts the user is not authorized for.
- Read-only: when fetching live config via CLI, run only get/list/describe operations
  (`get-account-authorization-details`, `get-iam-policy`) — never write/put/attach/create/delete.
  Provide corrected policies as snippets; do not apply IAM changes.
- Don't confuse a broad `Allow` with effective access; mark confidence lower when boundaries are
  not visible.
