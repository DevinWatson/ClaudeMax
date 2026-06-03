---
name: aws-api-gateway
description: Use when designing, provisioning, securing, or operating Amazon API Gateway — the AWS managed front door for HTTP, REST, and WebSocket APIs. Loads the API Gateway knowledge: REST vs HTTP vs WebSocket API types, resources/methods/routes and integrations (Lambda proxy, HTTP proxy, AWS service, VPC link to private ALB/NLB), stages and stage variables, deployments and canary releases, authorizers (IAM, Cognito, Lambda/JWT), API keys + usage plans + throttling/quotas, request/response mapping and validation, custom domains + ACM + base-path mapping, WAF, mutual TLS, CORS, caching, and access/execution logging. Covers how to define an API and integrations, attach an authorizer, throttle with usage plans, map a custom domain, and verify routing and auth. Consumed by the API Gateway specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology via network-design — this owns the API Gateway service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, api-gateway, rest-api, http-api, websocket, authorizer, usage-plan]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon API Gateway

AWS's fully managed **API front door** that publishes, secures, throttles, and monitors HTTP, REST,
and WebSocket APIs in front of Lambda, containers, HTTP backends, and AWS services. It terminates
TLS, authenticates callers, and shapes/validates requests so backends stay simple.

## Core concepts and components
- **API types** — **HTTP API** (low-latency, low-cost, JWT/Lambda auth, best default for
  Lambda/HTTP proxies); **REST API** (richer: request validation, API keys/usage plans, edge/regional/
  private endpoints, caching, WAF, mapping templates); **WebSocket API** (stateful bidirectional via
  `$connect`/`$disconnect`/route-key messages).
- **Resources/methods (REST) or routes (HTTP)** mapped to **integrations**: Lambda proxy, HTTP proxy,
  AWS-service integration, or **VPC link** to a private ALB/NLB.
- **Stages** — named deployments (`prod`, `dev`) with stage variables, throttling, caching, and
  **canary** release support; a **deployment** snapshots the API into a stage.
- **Authorizers** — **IAM** (SigV4), **Cognito** user pools, **Lambda** authorizers (token/request),
  or **JWT** (HTTP APIs). Plus **API keys + usage plans** for per-client throttling and quotas.
- **Custom domain** — ACM cert + base-path mapping; **mutual TLS** for client-cert auth.
- **Request/response** — validation, mapping templates (REST), CORS, and method/integration timeouts.
- **Caching + logging** — REST stage cache; access logs + execution logs to CloudWatch, X-Ray.

## Configuration and sizing
- Default to **HTTP API** unless you need REST-only features (API keys/usage plans, request
  validation, edge caching, WAF, private endpoints). Use **Lambda proxy** for serverless backends and
  a **VPC link** to reach private ALB/NLB. Set per-stage and per-route throttling; enable caching for
  read-heavy REST endpoints. Use stages + canary for safe rollouts.

## Security and IAM
- Attach an **authorizer** to every non-public route (Cognito/JWT/Lambda/IAM); never ship an
  unauthenticated mutating route by accident. Use **usage plans + API keys** to throttle/quota
  clients (note: API keys are not authn). Front REST APIs with **WAF**; require TLS 1.2+, optional
  **mutual TLS**. Scope the integration's execution role and `apigateway:*` IAM least-privilege. Use a
  **private** REST endpoint (interface VPC endpoint) for internal-only APIs. Enable access logs +
  CloudTrail.

## Cost levers
- HTTP APIs are markedly cheaper per request than REST APIs — prefer them. Priced per request (+ data
  transfer, + cache GB-hours for REST cache). Enable caching to cut backend calls; right-size
  throttles to avoid runaway invocations; drop the REST cache if hit ratio is low.

## Scaling and limits
- Scales automatically; protect backends with **throttling** (account/stage/route rate + burst) and
  usage-plan quotas. Watch default account throttle limits, integration timeout (29s max for
  REST/HTTP), payload size limits, and WebSocket connection/message limits.

## Operating procedure
1. **Provision** — create the API (HTTP/REST/WebSocket) with routes/methods and integrations via
   Terraform `aws_apigatewayv2_api` (HTTP/WS) or `aws_api_gateway_rest_api` (REST), or
   `aws apigatewayv2 create-api` / `aws apigateway create-rest-api`.
2. **Configure** — integrations (Lambda proxy / VPC link), stages + stage variables, throttling,
   caching, request validation, CORS, and a deployment.
3. **Secure** — authorizer on protected routes, usage plans + API keys, WAF (REST), TLS/mTLS, custom
   domain + ACM, private endpoint if internal, least-privilege roles, access logs.
4. **Verify** — apply [[verify-by-running]]: `get-stages`/`get-api` shows the stage, throttles, and
   authorizer; `curl` the invoke/custom-domain URL returns the expected response over HTTPS; a call
   **without** a valid token is `401/403`; exceeding the usage-plan rate returns `429`; the custom
   domain resolves and the integration latency is acceptable.

## Inputs
API type (HTTP/REST/WS), routes + backends (Lambda/HTTP/VPC link), auth model (Cognito/JWT/Lambda/
IAM), client throttling/quota needs, custom domain + cert, caching/validation/CORS needs, logging.

## Output
An API definition (routes/methods, integrations), stages with throttling + canary, authorizer +
usage plans, custom domain + TLS/WAF, and verification of routing, enforced auth, throttling, and
the custom domain.

## Notes
- Gotchas: API keys are NOT authentication (use an authorizer); HTTP vs REST feature gaps (no usage
  plans/request validation/WAF on HTTP APIs the same way); integration timeout caps at 29s; mapping
  templates are REST-only; a stage serves the last **deployment** — forgetting to redeploy ships
  stale config; private REST APIs need a resource policy + interface endpoint; CORS misconfig is the
  top breakage.
- IaC/CLI: Terraform `aws_apigatewayv2_api`/`_stage`/`_integration`/`_route`/`_authorizer` (HTTP/WS);
  `aws_api_gateway_rest_api`/`_resource`/`_method`/`_integration`/`_deployment`/`_stage`/`_usage_plan`/
  `_authorizer` (REST); `aws_api_gateway_domain_name`. CLI `aws apigatewayv2 create-api`,
  `aws apigateway create-rest-api`, `create-deployment`, `create-usage-plan`. CloudFormation
  `AWS::ApiGatewayV2::Api`/`Stage`/`Route`/`Integration`, `AWS::ApiGateway::RestApi`/`Method`/`Stage`.
