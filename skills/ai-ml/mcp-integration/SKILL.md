---
name: mcp-integration
description: Use when building or integrating a Model Context Protocol (MCP) server or client — designing the tools/resources/prompts a server exposes, choosing and wiring a transport (stdio or streamable HTTP), handling initialization and capability negotiation, designing clear tool input/output schemas, adding auth, and testing the surface against a client. TRIGGER on "build an MCP server", "expose our system as MCP tools", or "connect a client to an MCP server". Language- and framework-agnostic — the protocol design and integration; the specific MCP SDK comes from a separate language capability the agent also composes. Any agent that builds MCP surfaces (an MCP server author, a platform integrator, a reviewer of tool schemas) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: ai-ml
tags: [mcp, model-context-protocol, tools, transport, jsonrpc, integration]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# MCP Integration

The substantive capability for building Model Context Protocol servers and clients: design the
tools/resources/prompts surface, wire the transport and the JSON-RPC initialization/capability
handshake, write schemas a model can actually use, and secure and test the result — independent of the
language. The concrete MCP SDK comes from the composed language capability.

## When to use this skill
When building an MCP server, exposing a system as MCP tools/resources, or connecting a client to one.
Not for general LLM tool-calling inside one app (that is llm-application-engineering) and not for a
generic REST contract (that is rest-api-design). Pairs with [[rest-api-design]] (schema discipline for
the HTTP transport) and [[appsec-review]] (a tool surface is an attack surface).

## Instructions
1. **Decide the surface: tools, resources, prompts.** Map what the server should offer to the three MCP
   primitives — **tools** (model-invoked actions/functions), **resources** (readable context the client
   can fetch, addressed by URI), and **prompts** (reusable prompt templates the user/client can select).
   Put each capability in the right primitive; don't force a read into a tool or an action into a
   resource.
2. **Choose the transport.** Pick **stdio** for a local subprocess server (simplest, common for local
   tooling) or **streamable HTTP** for a remote/networked server. Wire the JSON-RPC 2.0 message handling
   the protocol requires; defer the exact SDK wiring to the composed language capability.
3. **Implement initialization and capability negotiation.** Handle the `initialize` handshake: exchange
   protocol version and declare the server's capabilities (which of tools/resources/prompts, and
   features like list-changed notifications) so the client only uses what is offered. Fail clearly on
   version mismatch.
4. **Design tool schemas for a model consumer.** Each tool needs a clear name, a description the model
   reads to decide when to call it, and a precise JSON-Schema input (typed params, required vs.
   optional, enums, constraints) — and a defined, structured output/result shape. Ambiguous names or
   loose schemas cause wrong or failed calls; treat the schema as the contract. Validate incoming
   arguments before acting and return structured errors, not stack traces.
5. **Add auth and protect the surface.** For HTTP transport, require authentication/authorization and
   scope what each caller can invoke. Treat every tool as an attack surface: validate inputs, guard
   destructive operations, prevent a tool from being abused for SSRF/path-traversal/injection (see
   [[appsec-review]]), and never expose secrets through a resource.
6. **Test against a real client.** Exercise the server with the MCP inspector/a client: list tools/
   resources/prompts, call each tool with valid and invalid inputs, confirm schema validation and error
   handling, and confirm capability negotiation. Run via [[verify-by-running]] and report results.

## Inputs
- The system to expose (or the server to connect to), the desired capabilities, the transport
  constraint (local vs. remote), the MCP SDK for the language, and the auth requirements.

## Output
- The surface design: each capability mapped to a tool/resource/prompt, with the tool input/output
  schemas.
- The transport + initialization wiring (transport choice with rationale, capability negotiation) and
  the auth/guardrails applied.
- The test result against a client/inspector via [[verify-by-running]] (tools list, valid + invalid
  calls, error handling) and the outcome.

## Notes
- The tool schema and description are the contract the model uses — invest in them; vague ones produce
  wrong calls.
- An MCP tool surface is an attack surface: authenticate, validate, and guard destructive tools.
- Stay language-agnostic; the specific MCP SDK and server scaffolding belong to the composed language
  capability.
