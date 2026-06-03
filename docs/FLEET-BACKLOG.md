# Fleet Expansion Backlog (autonomous loop)

Autonomous overnight expansion. Each item = a new role team on the thin-agent + skill-layer
pattern. Process per item: create the capability skill(s) → build the team (mirror the
template) → self-audit invariants (read-only reviewers, every Bash agent invokes
`[[verify-by-running]]`, no leaked refs) → `validate` → promote to stable → commit → push →
check the box here. Resume by reading this file and doing the next unchecked item.

Templates: language team = mirror `agents/languages/java/` (21 roles) composing `<lang>-idioms`.
Web framework team = mirror `agents/web/nextjs/` (9 roles). Backend-framework / cloud teams =
tailor a sensible role set. Conventions: security/compliance/qa-analyst/accessibility reviewers
are read-only; architect on opus; new agents experimental→promote to stable after audit.

## Languages (21-role teams under agents/languages/<lang>/, new <lang>-idioms skill each)
- [x] kotlin
- [x] swift
- [x] php
- [x] scala
- [x] elixir
- [x] cpp
- [x] c
- [x] dart
- [x] clojure
- [x] haskell
- [x] lua
- [x] r
- [x] julia
- [x] zig
- [x] perl
- [x] groovy
- [x] ocaml
- [x] erlang
- [x] solidity

## Web/app frameworks (tailored teams; web category unless noted; new framework skill each)
- [x] vue
- [x] svelte
- [x] angular
- [x] astro
- [x] remix
- [x] django (python web)
- [x] rails (ruby web)
- [x] spring-boot (java web)
- [x] fastapi (python web)
- [x] express (node web)
- [x] nestjs (node web)
- [x] laravel (php web)
- [x] phoenix (elixir web)
- [ ] dotnet-aspnet (csharp web)

## Cloud platforms (NEW taxonomy category `cloud`; per-platform teams + new capability skills)
- [ ] aws
- [ ] gcp
- [ ] azure
- [ ] cloudflare
- [ ] kubernetes-platform
- [ ] supabase

## Data platforms / databases (data category; tailored teams + skills)
- [ ] postgres
- [ ] mongodb
- [ ] redis
- [ ] snowflake
- [ ] kafka
