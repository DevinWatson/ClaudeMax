---
name: aws-amplify
description: Use when designing, provisioning, securing, or operating AWS Amplify — fullstack web/mobile hosting and CI/CD with Git-based branch deploys, the Amplify Gen 2 code-first backend (auth via Cognito, data via AppSync/DynamoDB, storage via S3, functions via Lambda), build settings, custom domains/CDN, SSR/SSG hosting for Next.js/Nuxt and SPA frameworks, preview environments, and environment variables/secrets (AWS Amplify). Loads the Amplify knowledge: stand up a hosted app, define a Gen 2 backend, wire branch-based environments, secure access, and verify a deploy. Consumed by the AWS Amplify specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle fullstack hosting.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, amplify, fullstack, hosting, ci-cd, ssr, specialized]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Amplify

A managed fullstack platform for building, hosting, and deploying web and mobile apps. It pairs a
Git-connected hosting/CI-CD pipeline with a code-first cloud backend (Amplify Gen 2), so a single
TypeScript backend definition provisions auth, data, storage, and functions, and every branch ships
through an automated build.

## Core concepts and components
- **Hosting + CI/CD** — connect a Git repo (GitHub/GitLab/Bitbucket/CodeCommit); each connected
  **branch** becomes an environment with automatic build → deploy on push, atomic deploys, rollbacks,
  custom domains, managed TLS, and a CloudFront-backed CDN.
- **Amplify Gen 2 backend** — code-first TypeScript backend (`amplify/backend.ts`) defining
  **auth** (Amazon Cognito user pools), **data** (a typed GraphQL API on AWS AppSync backed by
  DynamoDB), **storage** (Amazon S3), and **functions** (AWS Lambda). Each branch gets an isolated
  backend; per-developer sandbox environments for local iteration.
- **Build settings** — `amplify.yml` defines backend + frontend build phases; environment variables
  and secrets feed builds and runtime.
- **Rendering** — SSR/SSG hosting for Next.js, Nuxt, Astro, SvelteKit (server compute) plus static
  SPA hosting (React, Vue, Angular) with SPA redirects.
- **Preview environments** — per-pull-request ephemeral deploys with their own backend.
- **Gen 1 (legacy)** — the older CLI/Studio + CloudFormation category stacks; new work uses Gen 2.

## Configuration and sizing
- Map Git branches to environments (e.g. `main` → production, `develop` → staging, feature branches →
  PR previews). Set the framework/build image and Node version in `amplify.yml`; cache `node_modules`
  to speed builds. Pick SSR vs SSG/SPA per app; SSR adds managed server compute (cost + cold-start
  considerations). Keep build environment variables per-branch; store secrets as Amplify secrets, not
  plaintext env vars.

## Security and IAM
- Amplify uses a **service role** to provision backend resources — scope it least-privilege rather
  than granting `AdministratorAccess`. Gen 2 auth is Cognito; protect data with AppSync authorization
  modes (Cognito user pools, IAM, API key only for public/dev). Restrict access to the connected repo
  and build logs; store API keys/tokens as **Amplify secrets** (encrypted), never in `amplify.yml` or
  committed env files. Use custom headers (CSP, HSTS) on hosting; enable basic-auth on non-prod
  branches to prevent indexing.

## Cost levers
- Costs come from build minutes, hosting (data served/stored), SSR server compute, and the underlying
  backend resources (Cognito MAU, AppSync requests, DynamoDB, S3, Lambda). Levers: cache dependencies
  and prune branch builds to cut build minutes, prefer SSG/SPA over SSR when dynamic rendering isn't
  needed, clean up stale preview/branch backends, and right-size DynamoDB/Lambda. Watch CDN egress.

## Scaling and limits
- Hosting/CDN scales automatically; the backend scales with its services (AppSync/DynamoDB/Lambda
  concurrency, Cognito limits). Per-account quotas exist on apps, branches, and concurrent builds —
  raise via Service Quotas. SSR compute and Lambda concurrency are the typical scaling ceilings.

## Operating procedure
1. **Provision** — create the Amplify app and connect the Git repo + branch (Terraform
   `aws_amplify_app` / `aws_amplify_branch`, or `aws amplify create-app` / `create-branch`), and set
   the service role, framework, and build image.
2. **Configure** — define the Gen 2 backend (`amplify/backend.ts`: auth/data/storage/functions),
   author `amplify.yml` build phases, set per-branch environment variables, map custom domains, and
   enable PR previews.
3. **Secure** — scope the service role least-privilege, set AppSync authorization modes, store
   secrets as Amplify secrets, add security headers, and gate non-prod branches with basic auth.
4. **Verify** — apply [[verify-by-running]]: confirm the latest job is `SUCCEED`
   (`aws amplify get-job` / `list-jobs`), the branch domain serves the app over HTTPS (`curl -I`
   returns 200 and expected headers), an authenticated data/auth round-trip works against the
   deployed backend, and the custom domain resolves — capture the actual output.

## Inputs
App framework + rendering mode (SSR/SSG/SPA), Git repo + branch-to-environment mapping, backend
needs (auth/data/storage/functions), custom domain(s), environment variables/secrets, access
restrictions, expected traffic, and cost constraints.

## Output
An Amplify app + connected branches, a Gen 2 backend definition (auth/data/storage/functions),
`amplify.yml` build config, domain + security-header setup, secret handling, and verification of a
successful deploy serving over HTTPS with a working authenticated backend round-trip.

## Notes
- Gotchas: Amplify hosts the app and provisions its backend — it does NOT write the application code
  (the framework team does); deleting a branch tears down its backend resources/data; Gen 1 and Gen 2
  are different stacks (don't mix); SSR needs a supported framework adapter and adds server compute;
  the service role is easy to over-grant; secrets in `amplify.yml` env vars are visible in build logs
  (use Amplify secrets); custom-domain SSL validation can take time (DNS propagation).
- IaC/CLI: Terraform `aws_amplify_app`, `aws_amplify_branch`, `aws_amplify_domain_association`,
  `aws_amplify_webhook` (note: Gen 2 backend itself is defined in TypeScript and deployed by the
  Amplify pipeline, not as Terraform resources). CLI `aws amplify create-app`, `create-branch`,
  `start-job`, `get-job`, `list-jobs`, `create-domain-association`; the Amplify CLI/`ampx` for Gen 2
  backend + sandbox. CloudFormation `AWS::Amplify::App` / `Branch` / `Domain`.
