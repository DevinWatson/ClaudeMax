---
name: secret-detection
description: Use to find committed secrets/credentials in a repo or its git history — scan with gitleaks/trufflehog plus targeted high-signal grep, de-noise test fixtures from real secrets, treat any secret that reached a shared repo as compromised, and drive rotation-first remediation plus prevention (pre-commit hooks, CI scanning, push protection). TRIGGER on "check for leaked secrets / scan git history for credentials." Defensive and read-only; never echoes secret values; live verification only against systems the user is authorized to probe. Any agent that hunts exposed credentials (a secrets auditor, a pre-commit gate, a security reviewer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: security
tags: [security, secrets, credentials, gitleaks, trufflehog]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Secret Detection

The substantive capability for finding committed secrets and stopping the next leak in a
repository the user owns or is authorized to audit: detect exposed credentials, prioritize by
blast radius, and drive rotation + prevention — never general code review.

## When to use this skill
When scanning a working tree or git history for committed credentials (API keys, tokens, private
keys) and advising on rotation and prevention. Pairs with a ranking skill (e.g.
[[severity-triage]]) to order secrets by power and exposure. Not for general code review (that is
appsec-review).

## Instructions
1. **Scope and assume compromise.** Confirm working tree only vs. full git history, and the repo
   path. Treat **any secret that ever reached a remote/shared repo as already compromised** — the
   goal shifts from "remove it" to "rotate it and stop the next one."
2. **Scan with purpose-built detectors**, not just regex grep:
   - `gitleaks detect --source . --redact --report-format json --report-path -` (scans full
     history by default); `gitleaks dir .` for the working tree only.
   - `trufflehog git file://. --json` (TruffleHog adds live credential verification). Run live
     verification (`--only-verified`) **only** against secrets whose issuing accounts the user is
     authorized to probe — a live check uses the credential against its service. Skip verification
     when auditing on someone's behalf without that authorization.
   Supplement with targeted `Grep` for high-signal patterns: `AKIA`/`ASIA` (AWS),
   `-----BEGIN .* PRIVATE KEY-----`, `xox[baprs]-` (Slack), `ghp_`/`gho_` (GitHub), `sk_live_`
   (Stripe), JWTs, and tracked `.env`/`.pem`/`id_rsa` files. When Grep matches, record only the
   file/line — never copy the matched secret text into notes or output.
3. **Confirm and de-noise.** Distinguish real secrets from test fixtures, example/placeholder
   values, and public keys. Record per hit: secret type, file, commit(s) and first-introduced
   commit, and whether it is still in `HEAD` vs. only in history.
4. **Advise rotation first, then removal.** For each confirmed secret:
   - **Rotate/revoke at the provider immediately** — the only real fix; document the exact steps
     (which console/API, what to invalidate).
   - **Purge from history** only after rotation, with `git filter-repo` (preferred) or BFG, then
     force-push and have collaborators re-clone. Purging does NOT un-compromise the secret.
   - Move the value to a secrets manager / env var and `.gitignore` the source file.
5. **Set up prevention.** Provide config for: a `gitleaks` pre-commit hook
   (`.pre-commit-config.yaml`), CI secret scanning on every push/PR, host push-protection (e.g.
   GitHub secret scanning), and an `.gitleaks.toml` allowlist for known false positives.
6. **Rank for the consumer.** Hand each finding to a ranking skill ([[severity-triage]]): a live
   production cloud root key in a public repo is `critical`; a long-expired test token in a
   private repo is `low`. Confidence reflects verification.

## Inputs
- The repo path, the scope (tree vs. history), access to run gitleaks/trufflehog, and whether the
  user is authorized to live-verify discovered credentials.

## Output
- Scope (tree/history, repo, tools used).
- Findings, each with: secret type, file:line, commit SHA, present-in-HEAD flag, verified-live
  status, exact rotation steps, and history-purge command (post-rotation only) — with values
  redacted (type + prefix + location only), ready to be severity-ranked.
- A prevention block (pre-commit + CI + push protection) and a summary with the most urgent rotation.

## Notes
- Defensive only. Help the user find and kill their own leaked secrets; never exfiltrate values.
  Run live verification only on systems the user is authorized to test — otherwise treat any found
  secret as compromised without probing it.
- **Redact** secret values in all output. Read-only on the repo: provide rotation/purge/prevention
  commands for the user to run; never rewrite git history or edit files yourself.
- Rotation is the fix; history rewriting is cleanup. Always say so.
