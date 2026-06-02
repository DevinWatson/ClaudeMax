---
name: rest-api-design
description: Use when designing or reviewing an HTTP/REST API contract — how to model resources and URLs, choose methods and status codes precisely, standardize a machine-readable error shape (RFC 9457 Problem Details), design pagination/filtering/sorting, plan versioning and idempotency, and express it as an OpenAPI 3.1 spec. TRIGGER before implementing or while reviewing an endpoint contract. Language- and framework-agnostic — shapes the interface, not handler internals. Any agent that designs or reviews an HTTP interface (an API designer, a backend reviewer, a client-SDK author) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [api, rest, http, openapi, versioning]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# REST API Design

The substantive HTTP/REST capability: produce a contract that is consistent, evolvable, and
correct against the HTTP spec — independent of the language or framework that implements it.

## When to use this skill
When designing a new endpoint or reviewing an existing API surface for contract quality:
resource modeling, methods, status codes, error shapes, pagination, versioning, idempotency,
and the OpenAPI spec. Not for implementing route handlers or framework wiring. Pairs with
[[match-project-conventions]] (match the existing API's house style) and [[verify-by-running]]
(lint the OpenAPI spec).

## Instructions
1. **Model resources, not actions.** Nouns and hierarchy: `/orders/{id}/items`. Plural
   collections; stable, opaque identifiers. Map verbs to methods — `GET` (safe, cacheable),
   `POST` (create / non-idempotent), `PUT` (full replace, idempotent), `PATCH` (partial
   update), `DELETE` (idempotent). For genuine non-CRUD operations, model an explicit action
   sub-resource rather than overloading a verb in the path.
2. **Use status codes precisely.** `200/201/202/204` for success (201 + `Location` on create,
   204 for empty success); `400` (malformed), `401` (unauthenticated), `403` (unauthorized),
   `404`, `409` (conflict), `422` (semantic validation), `429` (rate limit, with `Retry-After`).
   Reserve `5xx` for server faults; never return `200` with an error body.
3. **Standardize the error shape.** One machine-readable envelope for every error — prefer
   RFC 9457 Problem Details (`type`, `title`, `status`, `detail`, `instance`) plus a stable
   application `code` and per-field validation errors. Never leak stack traces or internals.
4. **Design collections deliberately.** Prefer **cursor-based** pagination for large/changing
   sets (stable, no skipped/duplicated rows) over offset/limit; document the page-size cap.
   Define filtering, sorting, and sparse fieldsets as query params with a consistent grammar,
   and apply one response envelope (`data` + `meta`/`links`) uniformly.
5. **Plan for change and safety.** Pick one versioning strategy (URL `/v1/` vs. media-type/
   header) and justify it; treat additive changes as non-breaking and document the deprecation
   policy. Require **idempotency keys** for unsafe-but-retryable creates (`POST` +
   `Idempotency-Key`). Specify caching (`ETag`/`If-None-Match`, `Cache-Control`), rate-limit
   headers, and auth (bearer/OAuth scopes) per endpoint.
6. **Specify the contract as OpenAPI 3.1.** Author or extend the spec; provide concrete
   request/response examples including the error case, and confirm examples match the schemas.
   Validate the spec via [[verify-by-running]] (e.g. `npx @redocly/cli lint openapi.yaml` or
   `npx @stoplight/spectral-cli lint`).

## Inputs
- The existing API surface (route definitions, OpenAPI/Swagger spec, current endpoints) to
  match house conventions, plus the consumers (public/partner/internal), auth model, and
  whether backward compatibility is required.

## Output
- A concise contract: resource model, endpoint table (method, path, status codes, auth), the
  shared error envelope, and pagination/versioning/idempotency decisions — each with a
  one-line rationale.
- An OpenAPI 3.1 snippet (or full spec) for the new/changed endpoints, with examples.
- The spec-lint result via [[verify-by-running]]; any breaking change called out with its
  migration path.

## Notes
- Consistency with the existing API beats personal preference; flag a divergence, don't smuggle it.
- Never return error semantics in a `2xx`; never invent a status code outside its defined meaning.
- Stay at the contract layer — handler implementation, ORM/query, and framework wiring belong to
  the relevant language/framework capability.
