---
name: contract-testing
description: Use when authoring consumer-driven contract tests (Pact or similar) at a service/API boundary to prevent integration breakage between independently-deployed services — capturing consumer expectations as a contract with matchers, verifying the provider against it with provider-state handlers, and wiring the broker + can-i-deploy deployment gate. TRIGGER on protecting an API boundary between services. Any agent that authors or reviews contract tests (a contract-test author, an API-compatibility reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: qa
tags: [testing, contract, pact, api, microservices]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Contract Testing

The substantive capability for protecting service boundaries with consumer-driven contract
tests: make the consumer's real expectations explicit and verify the provider honors them,
catching breaking API changes *before* they reach a shared environment.

## When to use this skill
When preventing integration breakage at a service/API boundary between independently-deployed
services. Not for general in-process API/integration tests in the app's own framework, not for
load testing, and not for browser-driven full-stack journeys.

## Instructions
1. **Identify the two sides and detect the setup.** Determine which service is the **consumer**
   (depends on the API) and which is the **provider** (serves it), and the interactions under
   test (HTTP request/response shapes, status codes, headers, messages). Detect the existing
   Pact binding (`@pact-foundation/pact`, `pact-python`, `pact-jvm`), a `pacts/` directory,
   broker config, or CI hooks, and match it — don't introduce a second contract framework.
   State which side you are authoring (consumer, provider, or both).
2. **Author the consumer test.** In the consumer's suite, stand up a Pact mock provider,
   declare each interaction (`given(<provider state>)`, `uponReceiving`, `withRequest`,
   `willRespondWith`), exercise the consumer's real client code against the mock, and assert.
   Use **matchers** (`like`, `eachLike`, `term`/regex) for values that vary so the contract
   checks shape and type, not brittle exact data. Running the test generates the pact file.
3. **Publish the contract.** Push the generated pact to the broker with version and tags:
   `pact-broker publish ./pacts --consumer-app-version <git-sha> --branch <branch>` (or the
   binding's publish API). The broker is the shared source of truth.
4. **Verify the provider.** In the provider's suite, run verification against the pacts from
   the broker: stand up the provider, implement **provider-state** handlers (set up the data
   each `given(...)` requires), run the verifier (`PactProviderVerifier` / `pact_verifier_cli`
   / `mvn pact:verify`), and publish verification results back to the broker.
5. **Gate deployment with can-i-deploy.** `pact-broker can-i-deploy --pacticipant <app>
   --version <sha> --to-environment <env>` so a consumer/provider mismatch fails the pipeline
   rather than breaking integration at runtime.
6. **Verify locally.** Run the consumer test (pact generated), then provider verification
   against that pact, and confirm both pass.

## Inputs
- The two services and the interactions under test, the existing Pact binding/broker config,
  and the data each provider state requires.

## Output
- The consumer contract test(s) with matchers, and/or the provider verification setup with
  provider-state handlers.
- The broker commands (publish, verify, `can-i-deploy`) and where they slot into CI.
- The run output proving the consumer test generated a pact and the provider verified it.
- Any interactions intentionally not covered, and why.

## Notes
- Contracts are consumer-driven: the consumer's actual usage defines the contract — do not
  invent provider capabilities the consumer never calls. Use matchers for variable data so
  contracts don't flap. A pact no provider verifies gives false confidence.
- This is not end-to-end testing — it verifies the boundary in isolation (consumer vs. mock,
  provider vs. recorded pact), not a live full-stack flow.
- Fit the repo with [[match-project-conventions]]; confirm with [[verify-by-running]] — run
  both sides and report the exact commands + results, never claiming both pass without the run.
