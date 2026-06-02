---
name: dockerfile-authoring
description: Use when writing or improving a Dockerfile — produce small, secure, well-cached multi-stage images with pinned minimal bases, cache-friendly layer ordering (deps before source), a non-root final stage, a .dockerignore, and a HEALTHCHECK where meaningful. TRIGGER when containerizing an app or fixing a bloated/insecure/slow-building image. Any agent that authors, reviews, or hardens container images (a Dockerfile author, a CI engineer, a container-image security reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: devops
tags: [docker, containers, multi-stage, caching, security]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Dockerfile Authoring

The substantive capability for producing production-grade container images: choose a
pinned minimal base, structure multi-stage builds, order layers so the dependency cache
survives source changes, run as non-root, and ship only runtime artifacts.

## When to use this skill
When writing a new Dockerfile to containerize an application, or improving an existing
image that is too large, insecure, slow to rebuild, or runs as root. Not needed for the
CI workflow that *invokes* `docker build` (that is GitHub Actions / pipeline work) or for
the application code itself.

## Instructions
1. **Detect the stack.** Read the project files to learn the language, package manager,
   build/run commands, and exposed ports. Match the project's existing runtime versions
   rather than picking your own.
2. **Pick a pinned, minimal base.** Choose `-slim`, `-alpine`, or distroless where viable
   and pin to a specific tag or digest — never bare `latest`. Avoid `apt-get upgrade` of
   the whole image; install only the packages you need and clean apt lists in the same
   layer.
3. **Use multi-stage builds.** Separate the build stage (compilers, dev deps, toolchain)
   from the final runtime stage so the final image carries only runtime artifacts. Copy
   built artifacts forward with `COPY --from=<stage>`.
4. **Order layers for cache efficiency.** Copy dependency manifests (`package*.json`,
   `go.mod`/`go.sum`, `requirements.txt`, `Cargo.toml`/`Cargo.lock`, `pom.xml`) and install
   dependencies BEFORE copying the application source, so an edit to source code does not
   bust the dependency-install cache. Use `--mount=type=cache` (BuildKit) for package caches
   where appropriate.
5. **Harden the final stage.** Run as a non-root `USER`; set a sane `WORKDIR`; declare
   `EXPOSE`; set an explicit `ENTRYPOINT`/`CMD` (prefer exec form). Add a `HEALTHCHECK`
   when the container has a meaningful readiness signal.
6. **Add a `.dockerignore`.** Exclude VCS metadata, local dependency dirs (`node_modules`,
   `.venv`), build output, test fixtures, and any secrets — this shrinks the build context
   and prevents leaking files into layers.
7. **Keep secrets out of layers.** Never bake credentials into `ENV` or `RUN`; use BuildKit
   `--mount=type=secret` or runtime injection, and document how secrets are supplied.

## Inputs
- The application source tree, its dependency manifest and lockfile, and the run command /
  port. Any existing `Dockerfile` and `.dockerignore` to improve.

## Output
- The `Dockerfile` (multi-stage, pinned base, non-root, cache-ordered) and a `.dockerignore`.
- A note on the security choices (non-root, pinned base, no secrets in layers) and the
  caching strategy (what is cached and why).
- The final image size after a build.

## Notes
- Verify by actually building: pair with [[verify-by-running]] to run `docker build`,
  report the exact command and resulting image size, and confirm the container runs (and
  the `HEALTHCHECK` passes) rather than asserting it builds.
- Fit the project with [[match-project-conventions]]: match runtime versions, an existing
  base-image family, and any established Dockerfile layout instead of imposing a new one.
