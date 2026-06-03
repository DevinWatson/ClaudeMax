---
name: aws-verified-permissions
description: Use when designing, provisioning, securing, or operating Amazon Verified Permissions — Cedar policy stores, schemas, static policies and policy templates, template-linked policies, identity sources (Cognito/OIDC), and IsAuthorized / IsAuthorizedWithToken / BatchIsAuthorized authorization decisions for fine-grained application-level access control (Amazon Verified Permissions). Loads the AVP knowledge: how to model principals/actions/resources/context in a Cedar schema, write and validate Cedar policies, externalize app authorization, and verify allow/deny decisions. Consumed by the Verified Permissions specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they wire application authorization.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, verified-permissions, cedar, authorization, fine-grained-access, policy-store]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Verified Permissions

A managed authorization service for fine-grained, application-level access control using the
**Cedar** policy language. AVP answers "can this principal perform this action on this resource in
this context?" so your application logic does not hard-code permissions. It is application authZ
(end-user/customer permissions), distinct from IAM (which authorizes AWS principals).

## Core concepts and components
- **Policy store** — the top-level container for schema + policies; one per application (or per
  tenant boundary). Validation mode can be strict (recommended) or off.
- **Schema** — declares the entity types (principals, resources), actions, their applies-to
  shapes, and context attributes. Strict validation rejects policies that reference undeclared
  entities/attributes.
- **Cedar policies** — `permit`/`forbid` statements with `principal`, `action`, `resource` scopes
  and a `when`/`unless` condition block over entity attributes and `context`. `forbid` always wins.
- **Policy templates** — parameterized policies (`?principal`, `?resource`) instantiated as
  **template-linked policies** — the pattern for per-user/per-resource grants at scale.
- **Identity source** — links a Cognito user pool or OIDC provider so tokens map to principals;
  enables `IsAuthorizedWithToken`.
- **Authorization APIs** — `IsAuthorized` (you pass entities + request), `IsAuthorizedWithToken`
  (pass a JWT), `BatchIsAuthorized` (many requests, one call). Decisions return ALLOW/DENY plus
  determining policy IDs and errors.

## Configuration and sizing
- One policy store per application/security domain; use template-linked policies for the
  high-cardinality grants rather than thousands of distinct static policies.
- Enable **strict schema validation** so authoring catches typos against the schema. Keep the
  schema in version control and treat it as the contract between app and policies.
- Pass entity attributes and parent groups in the authorization request (or via identity source)
  so condition logic has the data it needs; keep entity payloads minimal for latency.

## Security and IAM
- Callers need IAM permissions for `verifiedpermissions:IsAuthorized*`; restrict who can call
  `CreatePolicy`/`PutSchema`/`CreatePolicyTemplate` (policy authorship is privileged).
- Prefer `forbid` policies for hard guardrails (they cannot be overridden by `permit`). Scope
  identity sources to the exact user pool/issuer and validate token `aud`/`iss`.
- Do not embed secrets in context; treat the schema and policies as security-sensitive code.

## Cost levers
- Billed per authorization request; collapse N checks into `BatchIsAuthorized`, cache stable
  decisions briefly at the app edge, and avoid redundant per-render checks.

## Scaling and limits
- Per-store limits on policy count and request rate (raise via quotas). Template-linked policies
  scale grants far better than distinct static policies. Decisions are low-latency but add a
  network hop — batch and co-locate the policy store Region with the app.

## Operating procedure
1. **Provision** — create a policy store with strict validation via Terraform
   `aws_verifiedpermissions_policy_store` or `aws verifiedpermissions create-policy-store`.
2. **Configure** — `put-schema` with entity types/actions/context; add static policies and policy
   templates (`create-policy`, `create-policy-template`); link an identity source if using tokens.
3. **Secure** — least-privilege IAM on authorship vs. query APIs, `forbid` guardrails, scoped
   identity source, schema in version control.
4. **Verify** — apply [[verify-by-running]]: call `aws verifiedpermissions is-authorized` (or
   `is-authorized-with-token`) for a principal/action/resource that must be ALLOWED and one that
   must be DENIED, and confirm the returned `decision` and `determiningPolicies` match intent.

## Inputs
The entities (principal/resource types + attributes), actions and their applies-to, context
attributes, the authorization rules, identity provider (Cognito/OIDC) if token-based, tenancy
model, and which app code paths call AVP.

## Output
A policy store (strict validation) with a Cedar schema, static + template-linked policies, an
identity source if needed, scoped IAM, and verification showing the intended ALLOW and DENY
decisions with the determining policy IDs.

## Notes
- Gotchas: `forbid` overrides `permit` (use it for guardrails); strict validation rejects
  policies referencing undeclared schema elements; the request must supply all entities/parents
  referenced by conditions or evaluation errors; `IsAuthorizedWithToken` requires the identity
  source token mapping to be correct (`aud`/`iss`); AVP is app authZ, not a replacement for IAM
  on AWS API calls.
- IaC/CLI: Terraform `aws_verifiedpermissions_policy_store`, `_schema`, `_policy`,
  `_policy_template`, `_identity_source`. CLI `aws verifiedpermissions create-policy-store`,
  `put-schema`, `create-policy`, `create-policy-template`, `create-identity-source`,
  `is-authorized`, `is-authorized-with-token`, `batch-is-authorized`. CloudFormation
  `AWS::VerifiedPermissions::PolicyStore`, `::Policy`, `::PolicyTemplate`, `::IdentitySource`.
