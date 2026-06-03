---
name: kafka-administration
description: The substantive Apache Kafka event-streaming capability — topics/partitions/replication factor and ISR, producers/consumers/consumer-groups and offset management, delivery semantics (at-least-once/at-most-once/exactly-once, idempotent producers, transactions), Kafka Streams, Kafka Connect source/sink connectors, the Schema Registry (Avro, compatibility modes), retention and log compaction, partition rebalancing/reassignment, partitioning/keying strategy, and tooling (kafka-topics, kafka-console-producer/consumer, kafka-consumer-groups, kafka-reassign-partitions). Use when designing, administering, tuning, securing, or operating a self-managed Kafka cluster, its topics/clients, Streams/Connect apps, or schemas. Any agent operating Kafka can load it. NOT for managed cloud streaming (AWS MSK/Kinesis, GCP Pub/Sub, Azure Event Hubs — the cloud data-engineers own those), managed Supabase, Postgres/MongoDB/Redis, Snowflake, batch orchestration design (etl-architect), or SQL rewrites (Kafka isn't SQL).
allowed-tools: Read, Grep, Glob, Bash
category: data
tags: [kafka, event-streaming, topics, partitions, consumer-groups, delivery-semantics, kafka-streams, kafka-connect, schema-registry, log-compaction]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Kafka Administration

The substantive Apache Kafka capability: designing topics/partitions/replication and ISR, operating
producers/consumers/consumer-groups and offsets, choosing delivery semantics (at-least-once,
at-most-once, exactly-once with idempotent producers and transactions), building Kafka Streams and
Kafka Connect applications, governing schemas through the Schema Registry, tuning retention and log
compaction, rebalancing and reassigning partitions, picking a partitioning/keying strategy, and
operating the cluster with the standard tooling. This is engine-level administration of a self-managed
Kafka cluster — not a managed cloud streaming service, not a relational/document/cache engine, and not
SQL.

## When to use this skill
Whenever the work targets Kafka itself: sizing a topic's partition count and replication factor,
diagnosing under-replicated partitions or ISR shrinkage, choosing a key so related events land on the
same partition and preserve order, tuning a producer (`acks`, `enable.idempotence`, batching,
`linger.ms`, compression) or a consumer group (offset commit strategy, `max.poll.records`, rebalance
behavior), selecting delivery semantics including exactly-once with transactions, building a Kafka
Streams topology (KStream/KTable, joins, windowing, state stores) or a Kafka Connect source/sink
connector, registering schemas and choosing a compatibility mode, configuring retention vs log
compaction, reassigning partitions across brokers, or running `kafka-topics`, `kafka-console-producer`/
`consumer`, `kafka-consumer-groups`, and `kafka-reassign-partitions`. Pair it with the verification
skill to confirm any change against a live cluster. Do NOT use it for managed cloud streaming (MSK/
Kinesis/Pub-Sub/Event-Hubs), managed Supabase, Postgres/MongoDB/Redis, the Snowflake warehouse,
cloud-agnostic batch pipeline orchestration design, or SQL query rewrites.

## Instructions
1. **Establish context first.** Capture the Kafka version (and whether it runs ZooKeeper or KRaft), the
   broker count and rack/AZ layout, the topic inventory (partition counts, replication factor,
   `min.insync.replicas`, retention/compaction settings), the producer and consumer-group configs and
   their lag, any Kafka Streams / Connect apps and the Schema Registry, the security posture (TLS,
   SASL, ACLs), and the workload (throughput, message size, ordering and durability requirements). Read
   `server.properties`, topic configs (`kafka-configs --describe`), and client configs before changing
   anything. Confirm whether the target is production and what a safe change window is.
2. **Size topics: partitions, replication factor, and ISR.** Partitions are the unit of parallelism and
   ordering — a consumer group scales only up to the partition count, and order is guaranteed only
   within a partition. Pick partition count from target throughput and consumer parallelism (you can
   increase but not decrease it, and increasing breaks key→partition stability). Set **replication
   factor** (typically 3) for durability and **`min.insync.replicas`** (typically 2) so producers with
   `acks=all` fail rather than lose data when the ISR shrinks. Spread replicas across racks/AZs. Watch
   for **under-replicated** and **offline** partitions and ISR shrink/expand as the primary health
   signal.
3. **Choose a partitioning/keying strategy.** The producer's key determines the partition (default:
   hash of key, or round-robin when null). Key by the entity whose events must stay ordered (e.g.
   `customerId`) so they co-locate on one partition; accept that this can create hot partitions if the
   key is skewed. Null keys spread load but give no per-entity ordering. Remember that adding
   partitions reshuffles the key→partition mapping for future records, breaking ordering guarantees
   built on it — design partition count up front.
4. **Operate producers and consumers and offsets.** For producers, tune `acks` (`0`/`1`/`all`),
   `enable.idempotence`, `retries`, `max.in.flight.requests.per.connection`, `batch.size`, `linger.ms`,
   and `compression.type` to balance throughput, latency, and durability. For consumers, decide the
   **offset commit** strategy (auto vs manual `commitSync`/`commitAsync`, and commit-after-processing
   for at-least-once), `enable.auto.commit`, `auto.offset.reset` (`earliest`/`latest`), and
   `max.poll.records`/`max.poll.interval.ms` to avoid rebalance-on-slow-processing. Track **consumer
   lag** (`kafka-consumer-groups --describe`) as the core consumer health metric; reset offsets
   deliberately with `--reset-offsets`.
5. **Pick delivery semantics deliberately.** **At-most-once** = commit offset before processing (can
   lose). **At-least-once** = process then commit (can duplicate — the common default; make consumers
   idempotent). **Exactly-once** = an **idempotent producer** (dedupes broker-side retries) plus
   **transactions** (`transactional.id`, `initTransactions`/`beginTransaction`/`sendOffsetsToTransaction`/
   `commitTransaction`) so produces and the consumer-offset commit are atomic, read with
   `isolation.level=read_committed`. Use Streams' `processing.guarantee=exactly_once_v2` to get EOS in a
   topology. EOS adds latency/overhead — apply it only where duplicates are unacceptable.
6. **Build Kafka Streams topologies correctly.** Model the pipeline as **KStream** (event stream) and
   **KTable**/**GlobalKTable** (changelog/state); use stateless ops (map/filter), stateful ops
   (aggregate/count/reduce backed by **state stores** and a compacted changelog topic), **windowing**
   (tumbling/hopping/session), and **joins** (stream-stream windowed, stream-table, table-table).
   Co-partition inputs for joins (same key, same partition count). Size the application instances to
   the partition count, account for state-store rebalancing/restoration time, and prefer
   `exactly_once_v2` for correctness on aggregations.
7. **Integrate with Kafka Connect.** Use **Connect** for source (DB/CDC/files → Kafka) and **sink**
   (Kafka → DB/warehouse/object-store) integration instead of bespoke producers/consumers. Configure
   the connector class, `tasks.max` (parallelism bounded by partitions), converters (often Avro via the
   Schema Registry), transforms (SMTs), and the **dead-letter queue** / error tolerance. Run in
   distributed mode for HA, and monitor connector/task status and offsets.
8. **Govern schemas with the Schema Registry.** Register **Avro** (or Protobuf/JSON) schemas per
   topic-subject and choose a **compatibility mode** — `BACKWARD` (new schema reads old data; default,
   safe to evolve consumers first), `FORWARD` (old schema reads new data), `FULL`, or `NONE`. Evolve
   schemas within the mode's rules (e.g. backward = add optional/defaulted fields, don't remove
   required ones). Use the schema-aware serializers so producers register and consumers fetch schemas
   by ID; never disable compatibility checks on a shared topic.
9. **Configure retention and log compaction.** Choose the **cleanup policy** per topic: `delete`
   (time/size retention via `retention.ms`/`retention.bytes` — for event logs) or `compact` (retain the
   latest value per key — for changelog/state topics and Streams stores), or `compact,delete`. Tune
   `segment.ms`/`segment.bytes`, `min.cleanable.dirty.ratio`, and tombstone retention
   (`delete.retention.ms`) for compaction. Match the policy to the data: compaction keeps the latest
   state per key but does not bound total keys, so unbounded key cardinality still grows.
10. **Rebalance, reassign, and verify against the cluster.** Use `kafka-reassign-partitions` to move
    replicas when adding/removing brokers or fixing skew — generate a plan, execute, and **throttle**
    the reassignment to protect live traffic; verify completion and that the ISR is restored. Confirm
    every change against a live or staging cluster with [[verify-by-running]]: `kafka-topics --describe`
    (partitions, RF, ISR, under-replicated), `kafka-consumer-groups --describe` (lag, members),
    `kafka-configs --describe`, produce/consume a test record with `kafka-console-producer`/`consumer`,
    and check connector/Streams status — report the exact command and observed result, not just that the
    config is valid.

## Inputs
- The Kafka version and mode (ZooKeeper/KRaft); broker count and rack/AZ layout; the topic inventory
  (partitions, RF, `min.insync.replicas`, retention/compaction); producer/consumer-group configs and
  current lag; any Streams/Connect apps and the Schema Registry subjects/compatibility modes; the
  security posture (TLS/SASL/ACLs); the workload (throughput, message size, ordering/durability/EOS
  requirements); and the change window.

## Output
- A concern-by-concern recommendation (topic sizing/RF/ISR, keying/partitioning, producer/consumer/
  offset config, delivery semantics, Streams topology, Connect, schema/compatibility, retention/
  compaction, rebalancing) with each setting named and the trade-off (throughput vs latency vs
  durability vs ordering) justified, plus the blast radius of each change.
- Where changes are made: the config/topology/connector/reassignment steps as diffs or runnable CLI
  steps, plus the validation command(s) run (`kafka-topics --describe`, `kafka-consumer-groups`, a
  produce/consume test) and the observed result.

## Notes
- This is engine-level Kafka administration of a self-managed cluster — confirm every applied change
  with [[verify-by-running]] against a live or staging cluster.
- The most common failures are too few partitions (can't scale consumers / no headroom), `acks=1` or
  `min.insync.replicas=1` with RF=3 (silent data loss on failover), relying on key-based ordering then
  adding partitions, assuming at-least-once delivery is exactly-once (non-idempotent consumers
  duplicating effects), `max.poll.interval.ms` too low for slow processing (constant rebalances), and
  using `delete` retention on a changelog topic that should be `compact`.
- Treat partition reassignment without throttling, changing replication factor, reducing retention
  (which purges data), `--reset-offsets` on a live group, and topic deletion as high-blast-radius:
  surface the effect and require explicit confirmation before running on a production cluster.
- Kafka is an append-only distributed log, not a queried store: there are no indexes, transactions
  over arbitrary rows, or SQL. Throughput/latency tuning is about partitions, batching, replication,
  and consumer parallelism — not query plans.
