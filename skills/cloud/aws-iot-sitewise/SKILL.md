---
name: aws-iot-sitewise
description: Use when modeling, ingesting, computing, or visualizing industrial/OT equipment telemetry with AWS IoT SiteWise — asset models and asset hierarchies, measurements/transforms/metrics properties, SiteWise Edge and the SiteWise gateway with OPC-UA/Modbus/EtherNet-IP source connectors, the time-series data store (hot/warm/cold tiers), and SiteWise Monitor portals/projects/dashboards (AWS IoT SiteWise). Loads the SiteWise knowledge: how to define asset models and properties, configure a gateway to collect from industrial protocols, compute metrics/transforms, store time-series, build Monitor dashboards, and verify property values flow. Consumed by the SiteWise specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they build industrial IoT data platforms.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, iot-sitewise, industrial-iot, opc-ua, asset-model, time-series]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS IoT SiteWise

A managed service that **collects, structures, computes on, and visualizes industrial equipment
(OT) telemetry** at scale. It models physical plant assets as a hierarchy, ingests sensor data from
factory-floor protocols, computes operational metrics, and exposes them through built-in dashboards.
It sits above the raw connectivity layer — for generic device MQTT connectivity use IoT Core; for
edge runtime/compute use IoT Greengrass (SiteWise Edge runs as a Greengrass component).

## Core concepts and components
- **Asset models** — reusable templates defining the **properties** of a class of equipment and the
  **hierarchy** relationships (e.g., a `Wind Farm` model containing `Turbine` child assets).
- **Properties** — three kinds: **measurements** (raw sensor streams), **transforms** (per-datapoint
  formulas over other properties), and **metrics** (windowed aggregations like avg/max over a time
  interval).
- **Assets** — concrete instances of asset models, wired into hierarchies and associated with the
  data streams feeding their measurement properties.
- **SiteWise gateway / SiteWise Edge** — software (a Greengrass component) running near the plant
  that uses **source connectors** (OPC-UA, Modbus TCP, EtherNet-IP) to read PLCs/historians and
  stream values to the cloud; supports edge processing and store-and-forward.
- **Data store** — managed time-series storage with a **hot tier** (recent, low-latency) and a
  **cold tier** (S3, cheaper, for historical) plus optional retention tiering.
- **SiteWise Monitor** — managed web **portals** containing **projects** and **dashboards** that
  business/OT users view; access is governed via IAM Identity Center.

## Configuration and sizing
- Design asset models first (properties + hierarchy) so instances stay consistent; favor transforms
  for unit conversions/derived signals and metrics for KPIs (OEE, availability) over polling raw data.
- Size gateways to the number of OPC-UA tags and poll rate; enable edge processing/packs when you
  need local computation or buffered ingestion across unreliable WAN links.

## Security and IAM
- Gateway uses IoT Core thing certificates; scope its IoT policy. Monitor portal access is brokered
  through **IAM Identity Center** users/groups mapped to project-level permissions (owner/viewer).
- Encrypt with KMS; restrict `iotsitewise:BatchPutAssetPropertyValue` and asset/portal admin actions
  with least-privilege IAM; lock down the on-prem OPC-UA endpoints the gateway reaches.

## Cost levers
- Billed by messages/property-value ingestion, storage (hot tier costs more than cold/S3), compute
  for transforms/metrics, and Monitor. Move historical data to the cold tier, widen metric windows,
  and prune unused measurement tags rather than ingesting every PLC tag.

## Scaling and limits
- Quotas on properties per asset model, assets, hierarchy depth, and ingestion rate apply. Use
  bulk import for backfill; partition large plants across multiple gateways; raise quotas as the
  fleet grows.

## Operating procedure
1. **Provision** — create asset models with measurement/transform/metric properties and hierarchy
   definitions, then instantiate assets via Terraform `aws_iotsitewise_asset_model` /
   `aws_iotsitewise_asset` or `aws iotsitewise create-asset-model` + `create-asset`.
2. **Configure** — deploy a SiteWise gateway (Greengrass) with OPC-UA/Modbus source connectors,
   associate data streams to asset measurement properties, and set storage tiering.
3. **Secure** — scope the gateway IoT policy, wire Monitor portals to IAM Identity Center with
   project permissions, enable KMS encryption, and lock down on-prem source endpoints.
4. **Verify** — apply [[verify-by-running]]: `aws iotsitewise describe-asset` to confirm property
   IDs, then `aws iotsitewise get-asset-property-value` (and `get-asset-property-value-history`) to
   confirm a live measurement value arrived, and confirm a metric computed a non-null result.

## Inputs
Equipment hierarchy and property/KPI definitions, industrial protocols/tag list at each site, poll
rate and WAN reliability, storage retention needs, who views which dashboards, and compliance needs.

## Output
Asset models + assets with measurement/transform/metric properties, a configured gateway streaming
OT data, tiered time-series storage, Monitor portals/projects/dashboards, and verification that a
property value and a computed metric are flowing.

## Notes
- Gotchas: model the asset model before creating assets (changing models is disruptive); transforms
  are per-datapoint while metrics are windowed — don't confuse them; the gateway runs on Greengrass
  and needs network reach to OPC-UA endpoints; hot-tier storage is pricier than cold; Monitor uses
  IAM Identity Center, not raw IAM users; ingestion has rate quotas.
- IaC/CLI: Terraform `aws_iotsitewise_asset_model`, `aws_iotsitewise_asset`, `aws_iotsitewise_gateway`,
  `aws_iotsitewise_portal`, `aws_iotsitewise_project`, `aws_iotsitewise_dashboard`. CLI
  `aws iotsitewise create-asset-model` / `create-asset` / `create-gateway` /
  `batch-put-asset-property-value` / `get-asset-property-value` / `create-portal`. CloudFormation
  `AWS::IoTSiteWise::AssetModel`, `::Asset`, `::Gateway`, `::Portal`, `::Dashboard`.
