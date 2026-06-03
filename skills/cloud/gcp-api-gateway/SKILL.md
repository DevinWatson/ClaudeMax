---
name: gcp-api-gateway
description: Use when designing, provisioning, securing, or operating API Gateway — Google Cloud's lightweight, fully managed gateway that fronts serverless and HTTP backends from an OpenAPI 2.0 (Swagger) config: the API, API Config, and Gateway resources, routing to Cloud Functions / Cloud Run / App Engine / HTTP backends, authentication (API keys, JWT/Firebase/Auth0/Google ID tokens via security definitions), CORS, quotas, and monitoring, plus regions, IAM, and cost (API Gateway). Loads the API Gateway knowledge: author the OpenAPI config, deploy an API Config + Gateway, wire backends and auth, secure the identity, and verify a routed request. Consumed by the API Gateway specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they front an API.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, api-gateway, application-development, openapi, serverless, api-keys]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# API Gateway

A lightweight, fully managed API gateway that sits in front of serverless and HTTP backends. You
declare routes, backends, and authentication in an **OpenAPI 2.0 (Swagger)** document, deploy it as an
immutable config, and clients call a single managed endpoint — no infrastructure to run.

## Core concepts and components
- **API** — the top-level logical container for a managed API.
- **API Config** — an **immutable** deployment artifact created from an **OpenAPI 2.0 (Swagger)**
  spec; to change routing/auth you deploy a *new* config (you don't edit one in place).
- **Gateway** — a regional, managed deployment that serves a specific API Config at a hostname; it's
  what clients actually hit.
- **Backends** — routes forward to **Cloud Functions**, **Cloud Run**, **App Engine**, or any HTTP(S)
  backend via the `x-google-backend` extension (address + path translation).
- **Authentication** — declared via OpenAPI `securityDefinitions`: **API keys**, and JWT issuers such
  as **Firebase**, **Auth0**, **Google ID tokens**, or a custom issuer (with `x-google-issuer`,
  `x-google-jwks_uri`, `x-google-audiences`).
- **Traffic controls** — per-method **quotas**, **CORS**, and Cloud Monitoring/Logging integration.

## Configuration and sizing
- Author the **OpenAPI 2.0** spec: paths, methods, `x-google-backend` per route, and
  `securityDefinitions` for keys/JWT. Choose the **region** for the Gateway (match your backends).
  Set per-method **quotas** and enable the **managed service** so API keys can be issued. There is no
  capacity to size — it autoscales as a managed service.

## Security and IAM
- Give the Gateway a dedicated **service account** so it can invoke private backends (e.g.
  `roles/run.invoker` on a private Cloud Run service, `roles/cloudfunctions.invoker`) — keep backends
  private and require the Gateway identity. Enforce **API keys** and/or **JWT** auth in the spec,
  restrict API keys to the managed service, enable VPC-SC where required, and audit via Cloud Audit
  Logs. Don't expose backends publicly when the Gateway is meant to be the front door.

## Cost levers
- Cost is per **API call** (request volume) plus the cost of the backends and any egress. Levers:
  cache at the client/CDN where possible, set quotas to cap abuse, consolidate APIs, and right-size
  the backends (Cloud Run/Functions) the Gateway fronts.

## Scaling and limits
- The Gateway autoscales with traffic (no provisioning). Backends are the real scaling boundary —
  size Cloud Run/Functions concurrency/instances accordingly. Per-project quotas govern APIs,
  configs, and gateways; raise via the quotas page. Remember configs are immutable (redeploy to
  change).

## Operating procedure
1. **Provision** — enable the API Gateway, Service Management, and Service Control APIs
   (`gcloud services enable apigateway.googleapis.com servicemanagement.googleapis.com servicecontrol.googleapis.com`;
   Terraform `google_project_service`), and create the Gateway **service account** with invoker roles
   on the backends.
2. **Configure** — author the **OpenAPI 2.0** spec (routes + `x-google-backend` + `securityDefinitions`),
   create the **API**, deploy an **API Config** from the spec, and create a regional **Gateway** that
   serves it (Terraform `google_api_gateway_api`, `_api_config`, `_gateway`).
3. **Secure** — keep backends private and require the Gateway service-account identity, enforce API
   keys / JWT in the spec, set per-method quotas, enable VPC-SC where required.
4. **Verify** — apply [[verify-by-running]]: confirm the Gateway is `ACTIVE`
   (`gcloud api-gateway gateways describe`), then call its hostname for an authenticated route
   (with/without a valid API key or JWT) with `curl` and confirm it routes to the backend and that
   auth is enforced (401/403 without credentials, 200 with) — capture the actual output.

## Inputs
The OpenAPI 2.0 spec (routes + backends), backend types (Cloud Functions / Cloud Run / App Engine /
HTTP), auth model (API keys / JWT issuer + audiences), region, quota requirements, and IAM scope.

## Output
An API Gateway setup (API + immutable API Config from the OpenAPI spec + regional Gateway, backend
routing via `x-google-backend`, API-key/JWT auth, per-method quotas, a scoped Gateway service account)
plus verification that an authenticated request routes to the backend and auth is enforced.

## Notes
- Gotchas: API Configs are **immutable** — change routing/auth by deploying a NEW config and pointing
  the Gateway at it; only **OpenAPI 2.0 (Swagger)** is supported (not 3.0); backends should stay
  private and trust the Gateway's service-account identity (don't double-expose); the managed service
  must be enabled for API keys; `x-google-backend` path translation surprises are common. API Gateway
  is the LIGHTWEIGHT managed gateway — for full lifecycle API management (proxies, rich policies,
  developer portal, monetization) use Apigee. The AWS equivalent is Amazon API Gateway; Azure is API
  Management.
- IaC/CLI: Terraform `google_api_gateway_api`, `google_api_gateway_api_config`,
  `google_api_gateway_gateway`, plus `google_project_service` and `google_service_account`/IAM bindings
  on backends. CLI `gcloud api-gateway apis create`, `... api-configs create --openapi-spec=`,
  `... gateways create / describe`.
