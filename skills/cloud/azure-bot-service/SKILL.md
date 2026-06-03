---
name: azure-bot-service
description: Use when designing, provisioning, securing, or operating Azure Bot Service — Microsoft Azure's managed platform for building and connecting conversational bots across channels (Azure Bot Service). Covers the Azure Bot resource (registration) and its messaging endpoint, the Bot Framework SDK/Composer, channels (Web Chat / Direct Line, Microsoft Teams, telephony, email, SMS), Direct Line / Direct Line App Service Extension, authentication via Entra ID app registration / managed identity and OAuth connection settings, integration with Azure AI Language CLU and Azure OpenAI for NLU/LLM bots, hosting on App Service/Functions, tiers and channel billing, and cost. Loads the knowledge: provision a bot resource + channels, wire the messaging endpoint, secure it, and verify a conversation. Consumed by the azure-bot-service specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Bot Service).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-bot-service, ai-ml, bot-framework, conversational-ai, channels]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Bot Service

Microsoft Azure's **managed platform for conversational bots**: register a bot, connect it to many
**channels** (Teams, Web Chat, Direct Line, telephony, SMS, etc.), and integrate NLU/LLM — the
connectivity and identity layer around a **Bot Framework** bot.

## Core concepts and components
- **Azure Bot resource** — the **registration** that holds the bot's identity, its **messaging
  endpoint** (the URL of your hosted bot), and the channel configuration; the unit of RBAC, channels,
  and billing. It does **not** host your code — your bot runs on **App Service/Functions** (or anywhere
  reachable).
- **Bot Framework SDK / Composer** — build the bot logic with the **Bot Framework SDK** (C#/JS/Python)
  or low-code **Composer**; the bot exchanges **Activities** with the Bot Connector.
- **Channels** — connectors to surfaces: **Web Chat** and **Direct Line** (embed/custom apps),
  **Microsoft Teams**, **Telephony**, **email/SMS**, social, etc.; each channel is enabled and
  configured on the bot resource.
- **Direct Line** — programmatic channel (REST/streaming) for custom clients, with **Direct Line App
  Service Extension** for in-region/network-isolated traffic.
- **Authentication** — an **Entra ID app registration** (single/multi-tenant or user-assigned managed
  identity) authenticates the bot to the Connector; **OAuth connection settings** enable user sign-in for
  bot-to-API access.
- **NLU/LLM integration** — wire **Azure AI Language CLU** for intent/entity understanding or **Azure
  OpenAI** for LLM-powered conversation.

## Configuration and sizing
- Set the **messaging endpoint** to your hosted bot (`/api/messages`). Choose the **app type** (single-
  tenant / multi-tenant / **user-assigned managed identity** — managed identity preferred). Enable only
  the **channels** you need. Pick **tier** (`F0` free vs `S1` standard). Size the **hosting** (App
  Service plan / Functions) for your traffic, not the bot resource.

## Security and IAM
- Prefer a **user-assigned managed identity** app type (no client secret) over an app-registration
  **client secret**; if a secret is required, store it in **Key Vault** and rotate it. Use **Entra ID +
  RBAC** on the bot resource. Validate the **JWT from the Bot Connector** in your bot. Secure the
  **hosting** (HTTPS-only, restrict ingress to Bot Service / use **Direct Line App Service Extension**
  for isolation). Use **OAuth connection settings** for user auth rather than handling tokens yourself.

## Cost levers
- The **Standard channels** (most, incl. Teams/Web Chat) are free of channel charges on **S1**;
  **Premium channels** (e.g. Direct Line, some telephony) bill per message. Real cost is the **hosting**
  (App Service/Functions) plus any **Azure OpenAI/CLU/Speech** the bot calls. Levers: right-size hosting
  (Consumption Functions for spiky traffic), use F0 for dev, and watch downstream AI-service token/usage
  costs.

## Scaling and limits
- Bot **throughput scales with the hosting tier** (App Service plan / Functions), not the bot resource.
  **Direct Line** has connection/throughput limits; channels have their own message-size and rate limits
  (e.g. Teams). The bot resource **name and endpoint** are configuration; channel availability varies by
  region/tenant.

## Operating procedure
1. **Provision** — create the **Azure Bot resource** (with a **user-assigned managed identity** app
   type) via Terraform `azurerm_bot_service_azure_bot` (or Bicep/`az bot create`) and host the bot code
   on **App Service/Functions**; set the **messaging endpoint** to the hosted `/api/messages`.
2. **Configure** — enable the needed **channels** (`azurerm_bot_channel_*` / `az bot ... channel`), wire
   **OAuth connection settings**, and integrate **CLU / Azure OpenAI** for NLU/LLM as needed.
3. **Secure** — use the **managed-identity** app type (avoid secrets; else Key Vault), validate the
   **Connector JWT**, lock down hosting ingress (HTTPS-only / Direct Line App Service Extension).
4. **Verify** — apply [[verify-by-running]]: confirm the bot resource and endpoint are set, then **send
   a test message** via Web Chat / the **Direct Line** API (or `az bot ... ` test) and confirm the bot
   **replies** correctly end-to-end (including any CLU/OpenAI response). Capture the conversation
   exchange.

## Inputs
The bot's purpose and NLU/LLM approach (CLU vs Azure OpenAI), the channels needed (Teams/Web Chat/Direct
Line/telephony), the hosting platform (App Service/Functions), the identity model (managed identity
preferred), expected volume, and the networking/identity security requirements.

## Output
An Azure Bot Service setup: an Azure Bot resource (managed-identity app type) with its messaging endpoint
wired to hosted bot code, the required channels enabled, OAuth/NLU/LLM integrations configured — secured
with managed identity, Connector-JWT validation, and locked-down hosting — plus verification of a working
end-to-end conversation.

## Notes
- Gotchas: the bot resource **does not host code** — your bot runs on App Service/Functions and the
  **messaging endpoint** must point at it; prefer the **managed-identity app type** (no client secret);
  **Premium channels** (e.g. Direct Line) bill per message; **scale is the hosting tier**, not the bot
  resource; channel availability/limits (Teams, telephony) vary. This owns the **managed Azure Bot
  Service** (bot resource, channels, identity, endpoint wiring, scaling) — not the app-side dialog/LLM
  logic or eval code (that's the bot code + the language ai-engineer roles). Pairs with
  **azure-ai-language** (CLU) and **azure-openai** (LLM bots). 2nd consumer: the Azure role team
  (azure-iac-engineer / azure-cloud-architect). Cross-cloud peer: AWS Lex.
- IaC/CLI: Terraform `azurerm_bot_service_azure_bot` (+ `azurerm_bot_channel_ms_teams` /
  `azurerm_bot_channel_directline` / `azurerm_bot_channel_web_chat`); Bicep/ARM `Microsoft.BotService/
  botServices` (+ `/channels`). CLI `az bot create` / `az bot <channel> create`; verify by sending a
  message via **Web Chat** or the **Direct Line** REST API and confirming the bot's reply.
