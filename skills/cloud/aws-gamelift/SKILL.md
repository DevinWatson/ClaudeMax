---
name: aws-gamelift
description: Use when designing, provisioning, securing, or operating Amazon GameLift — dedicated, scalable game server hosting, builds and fleets (managed EC2/Spot, Container, Anywhere), aliases, fleet auto-scaling on player demand, queues spanning Regions/fleets for placement and latency, FlexMatch matchmaking (rule sets + configurations), game sessions and player sessions, and GameLift Realtime/local testing (Amazon GameLift). Loads the GameLift knowledge: upload a build, run a scaled fleet behind a queue, add FlexMatch matchmaking, secure it, and verify a game session is placed. Consumed by the GameLift specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle game-server hosting.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, gamelift, game-servers, matchmaking, fleets, specialized]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon GameLift

Dedicated, auto-scaling hosting for session-based multiplayer game servers. You upload a server
build, GameLift runs it across fleets of instances, scales capacity to player demand, places players
into low-latency sessions through queues, and matches players with **FlexMatch** — so you don't
operate game-server infrastructure.

## Core concepts and components
- **Build / script** — your packaged game-server executable (or Realtime script) uploaded to
  GameLift; integrates with the GameLift **Server SDK** (process ready, accept sessions, report
  health).
- **Fleet** — the hosting capacity running your build: **managed EC2** (On-Demand or **Spot**),
  **Container** fleets, or **Anywhere** (your own/on-prem hardware). **Aliases** point at fleets for
  blue/green swaps.
- **Auto-scaling** — target-tracking on percent available game sessions (or rule-based) to scale
  fleet capacity to demand.
- **Queue** — spans multiple fleets/Regions to **place** game sessions by latency/cost (FleetIQ
  picks the destination); emits placement events.
- **FlexMatch** — matchmaking with a **rule set** (team/skill/latency rules) and a **matchmaking
  configuration** that forms matches and places them via a queue.
- **Game session / player session** — a running match instance and the per-player slots in it.

## Configuration and sizing
- Pick the fleet compute model: managed EC2 for full control, Spot for cost (interruption-tolerant),
  Container for packaged servers, Anywhere for hybrid/edge. Choose instance type by server CPU/mem
  and players-per-process. Size min/max capacity and per-instance concurrent sessions.

## Security and IAM
- The GameLift service role grants access to your build/resources; scope it least-privilege. Lock
  fleet inbound to the game-server port range only; players connect via session endpoints, not the
  control plane. Use Spot with on-demand fallback for availability; encrypt build artifacts in S3.

## Cost levers
- Biggest levers: **Spot** fleets vs On-Demand, auto-scaling min capacity near demand troughs,
  packing more sessions per instance, and queue placement preferring cheaper Regions/fleets.
  Idle fleet capacity is pure waste — tune scaling and scale-in protection.

## Scaling and limits
- Per-account quotas bound fleets, instances per fleet, and aliases; scaling is bounded by EC2
  capacity (Spot availability varies). FlexMatch has rule-set/ticket limits. Raise via Service Quotas.

## Operating procedure
1. **Provision** — upload the server **build** (integrated with the Server SDK) and create a
   **fleet** (compute model + instance type + inbound port range) via Terraform `aws_gamelift_build`
   + `aws_gamelift_fleet` or `aws gamelift upload-build` / `create-fleet`.
2. **Configure** — attach **auto-scaling**, create an **alias** to the fleet, build a **queue**
   spanning fleets/Regions, and (for matchmaking) a FlexMatch **rule set** + **matchmaking
   configuration** targeting the queue.
3. **Secure** — scope the GameLift service role, restrict fleet inbound to the server port range,
   prefer Spot with On-Demand fallback, and KMS-encrypt build artifacts in S3.
4. **Verify** — apply [[verify-by-running]]: `aws gamelift describe-fleet-attributes` shows the
   fleet `ACTIVE`, `describe-ec2-instance-limits`/scaling confirms capacity, `start-game-session-
   placement` (or FlexMatch `start-matchmaking`) yields a placed game session, and a `create-player-
   session` connects a player.

## Inputs
Server build + Server SDK integration, fleet compute model (EC2/Spot/Container/Anywhere), instance
type + players-per-process, multi-Region/latency requirements, matchmaking rules (teams/skill/
latency), expected concurrency + scaling shape, encryption/compliance requirements.

## Output
A GameLift deployment (uploaded build, sized auto-scaling fleet, alias, multi-Region queue, optional
FlexMatch rule set + configuration), secured service role + inbound rules, and verification of an
`ACTIVE` fleet plus a successfully placed game session with a connecting player.

## Notes
- Gotchas: the server build must integrate the GameLift Server SDK or it never reports ready and the
  fleet stays unhealthy; Spot fleets can be interrupted — pair with On-Demand fallback and scale-in
  protection; queues place by latency only if clients report latency; fleet activation and build
  validation take minutes; FlexMatch rule sets are strict (bad rules silently fail to match).
- IaC/CLI: Terraform `aws_gamelift_build`, `aws_gamelift_fleet`, `aws_gamelift_alias`,
  `aws_gamelift_game_session_queue`, `aws_gamelift_script`. CLI `aws gamelift upload-build`,
  `create-fleet`, `put-scaling-policy`, `create-game-session-queue`,
  `create-matchmaking-configuration`, `start-matchmaking`, `describe-fleet-attributes`.
  CloudFormation `AWS::GameLift::Fleet`, `AWS::GameLift::Build`, `AWS::GameLift::GameSessionQueue`,
  `AWS::GameLift::MatchmakingConfiguration`.
