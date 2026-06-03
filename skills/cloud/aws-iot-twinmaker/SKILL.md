---
name: aws-iot-twinmaker
description: Use when building digital twins of real-world systems (factories, buildings, industrial sites) with AWS IoT TwinMaker — workspaces backed by S3 and a role, entities and component types, components that bind twin properties to data via connectors (built-in IoT SiteWise/Kinesis Video connectors or custom Lambda data connectors), knowledge-graph relationships, 3D scenes built from uploaded glTF/glb models with tags/rules, and the Grafana/Amazon Managed Grafana TwinMaker plugin for visualization (AWS IoT TwinMaker). Loads the TwinMaker knowledge: how to model entities/components, bind them to live data sources, author 3D scenes, and verify a twin resolves property values. Consumed by the TwinMaker specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) building digital-twin applications.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, iot-twinmaker, digital-twin, knowledge-graph, 3d-scenes, data-connector]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS IoT TwinMaker

A service for building **digital twins** — virtual representations of physical systems that combine
data from many sources (sensors, video, business apps), 3D models, and a knowledge graph of how
things relate. It is the modeling/visualization layer; the underlying time-series telemetry usually
comes from IoT SiteWise, the connectivity from IoT Core, and edge from IoT Greengrass.

## Core concepts and components
- **Workspace** — the top-level container for a twin, backed by an **S3 bucket** (scenes, resources)
  and an IAM **execution role** that TwinMaker assumes to read data sources.
- **Entities & component types** — **entities** are nodes in the knowledge graph (a pump, a room);
  **component types** are reusable templates defining properties and the data connector used;
  **components** attach to entities and bind their properties to data.
- **Data connectors** — bind twin properties to live data: built-in connectors (IoT SiteWise,
  Kinesis Video Streams) or **custom Lambda data connectors** that fetch property values/history and
  metadata from any source (Timestream, databases, APIs).
- **Knowledge graph** — relationships between entities, queryable to navigate the twin.
- **Scenes** — **3D scenes** authored in the console from uploaded **glTF/glb** models, with **tags**
  (anchors) and **rules** that map data values to visual states (color/icon).
- **Visualization** — the **TwinMaker plugin for Grafana / Amazon Managed Grafana** renders scenes
  and dashboards bound to the twin.

## Configuration and sizing
- Define component types before entities so bindings stay consistent; reuse component types across
  similar entities. Keep custom Lambda connectors stateless and fast (they are invoked per query).
- Optimize 3D assets (decimate/compress glb) so scenes load quickly; bind only the properties a
  dashboard actually shows.

## Security and IAM
- The workspace execution role must allow read access to each bound data source (SiteWise, Kinesis
  Video, Lambda invoke) and to the S3 bucket; scope it least-privilege per source.
- Restrict workspace/entity/scene admin actions with IAM; KMS-encrypt the S3 bucket; Grafana access
  is governed by the Grafana workspace/IAM auth.

## Cost levers
- Billed by entity/query/scene operations and the cost of underlying connectors (SiteWise ingestion,
  Lambda invocations, Kinesis Video). Cache in custom connectors, prune unused entities, and avoid
  over-frequent dashboard refresh.

## Scaling and limits
- Quotas on entities/components per workspace and connector throughput apply; custom connectors must
  respect Lambda concurrency/timeout. Partition very large systems across workspaces.

## Operating procedure
1. **Provision** — create a workspace (S3 bucket + execution role) via Terraform
   `aws_iottwinmaker_workspace` or `aws iottwinmaker create-workspace`; define component types
   (`create-component-type`).
2. **Configure** — create entities with components bound to data connectors (SiteWise/Kinesis
   Video/custom Lambda), build relationships, upload glb models, and author a 3D scene with tags and
   rules.
3. **Secure** — scope the execution role to each data source and the S3 bucket, restrict admin IAM,
   enable KMS, and lock down the Grafana workspace.
4. **Verify** — apply [[verify-by-running]]: `aws iottwinmaker get-entity` to confirm components,
   then `aws iottwinmaker get-property-value-history` (or `get-property-value`) to confirm the
   connector resolves live data, and confirm the scene loads in Grafana with a tag reflecting a value.

## Inputs
The physical system and its entities/relationships, the data sources for each property (SiteWise,
video, custom), available 3D models, the visual rules/states to show, and access/compliance needs.

## Output
A workspace with component types, entities + components bound to data connectors, a knowledge graph,
optimized 3D scenes with tags/rules, Grafana dashboards, and verification that a property resolves
and a scene renders live state.

## Notes
- Gotchas: define component types before entities; custom Lambda connectors are invoked per query
  and must be fast/stateless; the execution role needs read access to every bound source; 3D assets
  must be glTF/glb and should be optimized; TwinMaker models/visualizes — telemetry storage is
  usually SiteWise and connectivity is IoT Core; Grafana plugin needed for scene rendering.
- IaC/CLI: Terraform `aws_iottwinmaker_workspace`, `aws_iottwinmaker_entity`,
  `aws_iottwinmaker_component_type`, `aws_iottwinmaker_scene`. CLI `aws iottwinmaker create-workspace`
  / `create-component-type` / `create-entity` / `create-scene` / `get-entity` /
  `get-property-value-history`. CloudFormation `AWS::IoTTwinMaker::Workspace`, `::Entity`,
  `::ComponentType`, `::Scene`.
