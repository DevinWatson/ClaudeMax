---
name: aws-codeguru
description: Use when designing, provisioning, securing, or operating Amazon CodeGuru — the developer tool that uses ML to find code-quality and security issues in pull requests (CodeGuru Reviewer) and to find the most expensive lines of running code (CodeGuru Profiler) (Amazon CodeGuru). Loads the CodeGuru knowledge: CodeGuru Reviewer (repository associations, full and incremental code reviews, recommendations, security detectors / CodeGuru Security, suppression), CodeGuru Profiler (profiling groups, the agent, flame graphs, heap summary, anomaly detection and recommendations, latency/CPU/cost insight), supported languages/repos (GitHub/CodeCommit/Bitbucket/S3), IAM roles, KMS, cost/pricing, limits, and verification by running a review on a PR and profiling a running app. The 2nd consumer is the AWS role team (aws-cloud-architect / observability roles) wiring automated review and runtime profiling. Consumed by the CodeGuru specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, codeguru, developer-tools, code-review, profiling, devtools]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon CodeGuru

An ML-powered developer tool with two halves: **CodeGuru Reviewer** automatically reviews code (pull
requests + full repo scans) for quality and **security** issues, and **CodeGuru Profiler** profiles a
**running application** to find the most CPU/latency/cost-expensive code paths and recommend fixes.
Reviewer acts at code-review time; Profiler acts in production — together they cover static review and
runtime performance.

## Core concepts and components
- **Reviewer — repository associations** — connect a repo (**GitHub, CodeCommit, Bitbucket, S3**); after
  association, PRs get **incremental** reviews and you can run **full** repository scans.
- **Reviewer — recommendations** — flagged issues (resource leaks, concurrency, AWS best practices,
  input validation) plus **security detectors** (now **CodeGuru Security**) for vulnerabilities; supports
  **suppression** of false positives.
- **Profiler — profiling group** — a target for a running app; the **agent** (library or sidecar) samples
  the runtime and ships profiles.
- **Profiler — visualizations** — **flame graphs**, **heap summary**, and **latency/CPU** views;
  **anomaly detection** flags regressions and **recommendations** point at expensive frames (with an
  estimated **dollar cost** of inefficiency).
- **Languages** — Reviewer/Security support Java, Python, JS/TS, and others; Profiler supports Java/JVM
  and Python (and more) running on EC2/ECS/EKS/Lambda/on-prem.

## Configuration and sizing
- **Reviewer**: associate the repos you want reviewed and decide PR-incremental vs scheduled full scans;
  tune **suppression** to keep signal high. **Profiler**: create a **profiling group** per app/env, add
  the **agent** (low overhead, ~1% CPU), and let it sample continuously. No servers to size beyond the
  agent's negligible footprint.

## Security and IAM
- Reviewer needs a connection/role to read the repo; Profiler agents need IAM to
  **`codeguru-profiler:PostAgentProfile`** and the group's **`ConfigureAgent`** — grant least-privilege,
  not wildcards. Treat **security findings** as sensitive; control who can view/suppress them. Encrypt
  associations/profiling data with **KMS** (CMK for control). Don't let the profiler agent run with
  broad app credentials beyond what it needs to post profiles.

## Cost levers
- **Reviewer/Security**: billed per **lines of code scanned** per month (full scans cost more than
  incremental). **Profiler**: billed per **profiling-group sampling hour**. Levers: scope Reviewer to
  repos that matter and prefer **incremental** PR reviews over frequent full scans; run Profiler
  continuously only where perf/cost insight pays off and **delete idle profiling groups**; the agent's
  own overhead is ~1% so it rarely drives cost.

## Scaling and limits
- Per-account quotas on repository associations and profiling groups (raisable). Reviewer language/repo
  support is bounded; very large repos lengthen full scans. Profiler needs enough sampled traffic to
  build a representative profile (low-traffic apps yield sparse flame graphs). Findings retention and
  region availability vary.

## Operating procedure
1. **Provision** — associate repositories for **Reviewer** and create **profiling groups** for
   **Profiler** via Terraform `aws_codegurureviewer_repository_association` /
   `aws_codeguruprofiler_profiling_group`, or `aws codeguru-reviewer associate-repository` /
   `aws codeguruprofiler create-profiling-group`.
2. **Configure** — enable PR-incremental + scheduled full scans (Reviewer), set suppression; add the
   **Profiler agent** to the app (EC2/ECS/EKS/Lambda) and confirm it posts profiles.
3. **Secure** — least-privilege repo connection and `codeguru-profiler` agent permissions, KMS
   encryption, restricted access to security findings.
4. **Verify** — apply [[verify-by-running]]: open/scan a PR and confirm **Reviewer recommendations**
   appear (`aws codeguru-reviewer list-recommendations`), and after the **Profiler agent** runs under
   load confirm a **flame graph / profile** populates (`aws codeguruprofiler get-profile`) with frames —
   capture the recommendations and profile observed.

## Inputs
Repos to review + provider, languages, PR-incremental vs full-scan cadence, suppression policy; apps to
profile + runtime (EC2/ECS/EKS/Lambda), profiling-group layout, IAM/KMS requirements, security-finding
access control, cost constraints.

## Output
A CodeGuru setup — Reviewer repository associations with PR/full-scan + security detectors and
suppression, Profiler profiling groups with the agent deployed, least-privilege IAM and KMS — plus
verification that a PR yields review recommendations and a running app produces a populated profile/flame
graph.

## Notes
- Gotchas: Reviewer **incremental** reviews only cover changed lines — run a **full scan** for legacy
  code; tune **suppression** or false positives erode trust; **security findings** are sensitive, gate
  access; Profiler needs **representative load** to produce useful flame graphs — idle/low-traffic apps
  look empty; the **agent** must be wired with `PostAgentProfile`/`ConfigureAgent` permissions or no data
  arrives; full scans bill per LoC so scope them; delete idle profiling groups to stop sampling-hour
  charges; Reviewer is static/PR-time while Profiler is runtime — they answer different questions.
- IaC/CLI: Terraform `aws_codegurureviewer_repository_association`,
  `aws_codeguruprofiler_profiling_group`. CLI `aws codeguru-reviewer associate-repository`,
  `list-recommendations`, `create-code-review`; `aws codeguruprofiler create-profiling-group`,
  `configure-agent`, `get-profile`, `list-profile-times`; `aws codeguru-security` for security scans.
  CloudFormation `AWS::CodeGuruReviewer::RepositoryAssociation`,
  `AWS::CodeGuruProfiler::ProfilingGroup`.
