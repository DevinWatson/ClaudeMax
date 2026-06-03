---
name: azure-maps
description: Use when designing, provisioning, configuring, or operating Azure Maps — Azure's geospatial platform of REST APIs and web/mobile SDKs for maps, routing, search, and location intelligence (Azure Maps). Covers the Maps account + pricing tier, the render (map tiles/imagery), route (directions/matrix/traffic), search (geocoding/reverse-geocoding/POI), geolocation/timezone, and weather services, the Web/Android SDKs, Creator (private indoor maps + datasets/tilesets/feature states), and data registry. Loads the knowledge to provision the account, choose auth (Entra/SAS/subscription key), call the services, and verify a geocode/route returns. Consumed by the azure-maps specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-maps, web-mobile, geospatial, location]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Maps

**Azure Maps** is Azure's **geospatial platform**: **REST APIs** and **Web/Android SDKs** for maps, routing,
search, and location intelligence. This skill owns the **single-service Azure Maps layer** — the account, the
service families, the SDKs, Creator (private indoor maps), and the auth model.

## Core concepts and components
- **Maps account** — the regional resource that holds the **pricing tier** (Gen2) and is the auth boundary for all
  service calls.
- **Render** — map **tiles/imagery/static maps** (road, satellite, traffic overlays) consumed by the SDK or
  directly.
- **Route** — **directions, route matrix, range (isochrones), and real-time traffic** for cars/trucks/transit.
- **Search** — **geocoding, reverse geocoding, fuzzy/POI search, and address autocomplete**.
- **Geolocation / Timezone / Weather** — IP-to-country, timezone by coordinates, and weather (forecast/severe
  alerts) services.
- **Web/Android SDKs** — client libraries that render interactive maps and call the services with proper auth.
- **Creator** — author **private indoor maps**: upload drawings, build **datasets / tilesets / feature states /
  map configurations**, and a **data registry** to reference your geospatial data.

## Configuration and sizing
- Create the **Maps account** (Gen2 tier), choose the **auth model**, enable **Creator** only if you need indoor
  maps, and wire the **SDK/REST** clients with a region-appropriate endpoint. There is no instance to size —
  capacity is **transaction-based**; sizing means picking the tier and managing call volume.

## Security and IAM
- Three auth options: **Entra ID (recommended)** via RBAC roles (`Azure Maps Data Reader` / `Data Contributor`)
  using a **managed identity** or app registration; **Shared Access Signature (SAS)** tokens for scoped/temporary
  client access; and the legacy **subscription key**. Prefer **Entra + SAS** over distributing the subscription
  key; never embed the primary key in client-side code — use SAS or a token proxy.

## Cost levers
- Billed **per transaction** by API category (render tiles, route, search, etc.), with Creator priced separately.
  Levers: **cache** tiles/geocodes where licensing allows, batch with **route/search batch** APIs, debounce
  autocomplete calls, and avoid re-geocoding known addresses. Enable only the services you use.

## Scaling and limits
- Per-account QPS/transaction **rate limits** per service, batch-request size caps, and Creator dataset/tileset
  limits. Scale by request shaping (batching/caching) and respecting per-service throttling; multi-region apps pick
  the nearest endpoint.

## Operating procedure
1. **Provision** — create the **Maps account** via **azurerm** (`azurerm_maps_account`, Gen2 SKU) or
   `az maps account create`; attach a **managed identity** if using Entra/Creator.
2. **Configure** — choose the **auth model** (Entra/SAS/key), generate **SAS** if needed
   (`azurerm_maps_account` + token endpoint), wire the **Web/Android SDK** or REST clients, and set up **Creator**
   datasets/tilesets if doing indoor maps.
3. **Secure** — wire **Entra/RBAC** (Data Reader/Contributor), prefer **SAS** for clients, keep the subscription
   key server-side only, scope tokens tightly.
4. **Verify** — apply [[verify-by-running]]: call a **search/geocode** and a **route** REST endpoint with the
   chosen auth and confirm a 200 with expected coordinates/route geometry (`curl` the search/route API), confirm
   the **account** exists (`az maps account show`), and capture the responses.

## Inputs
The **Maps account** + tier, the **service families** in use (render/route/search/geolocation/weather), the **auth
model** (Entra/SAS/key), the **SDK** targets, and any **Creator** datasets/tilesets.

## Output
An Azure Maps setup: a Gen2 account with the chosen auth model (Entra + SAS preferred), wired SDK/REST clients,
optional Creator indoor maps, and least-privilege roles — plus verification that a geocode and a route request
return expected results and the account is reachable.

## Notes
- Gotchas: embedding the **subscription key** in client code (use **SAS/Entra**); ignoring per-service **rate
  limits** (batch + cache); re-geocoding known addresses wastes transactions; Creator has its own pricing + data
  lifecycle; choosing the wrong **region endpoint** adds latency; tile caching subject to licensing terms.
  2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peer: AWS
  Location Service.
- IaC/CLI: Terraform **azurerm** (`azurerm_maps_account`, `azurerm_maps_creator`); CLI `az maps account ...`; Bicep
  `Microsoft.Maps/accounts`. Services consumed via REST (`atlas.microsoft.com`) or the Web/Android SDKs.
