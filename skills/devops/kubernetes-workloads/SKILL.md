---
name: kubernetes-workloads
description: Use when authoring Kubernetes workload manifests (Deployments, StatefulSets, Services, Ingress, RBAC, ConfigMaps) or operating live workloads — setting resources/probes/securityContext and rollout strategy, and debugging CrashLoopBackOff/Pending/OOMKilled/ImagePullBackOff pods with kubectl, driving rollouts and rollbacks. TRIGGER on writing k8s manifests or diagnosing a sick workload on a cluster. Any agent that authors, reviews, operates, or debugs Kubernetes workloads (an operator, an SRE, a platform reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: devops
tags: [kubernetes, kubectl, workloads, rollouts, debugging]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Kubernetes Workloads

The substantive capability for both sides of Kubernetes workloads: writing correct,
hardened manifests AND operating live workloads — observing cluster state read-first,
mapping pod symptoms to root causes, and driving rollouts/rollbacks safely. Changes go
through manifests under version control, not ad-hoc `kubectl edit`.

## When to use this skill
When authoring or fixing workload manifests, or when a workload is misbehaving on a live
cluster (crash loops, stuck rollouts, unschedulable pods, OOM kills). Not for packaging a
reusable chart (that is Helm work) or building the container image itself.

## Instructions
1. **Establish context first.** `kubectl config current-context` and `kubectl get ns`;
   confirm and state which cluster/namespace you are acting in. For authoring, read existing
   manifests to match apiVersions, labels, and naming.
2. **Observe before forming a hypothesis (read-only).** For a sick workload collect evidence:
   - `kubectl get pods -o wide`, `kubectl describe pod <p>` (Events, restart count, last
     state, exit code).
   - `kubectl logs <p> --previous` for crash loops; `kubectl get events --sort-by=.lastTimestamp`.
   - Map the symptom: `CrashLoopBackOff` → app/exit code or bad probe; `Pending` →
     unschedulable (resources, taints, affinity, PVC binding); `OOMKilled` → memory limit too
     low; `ImagePullBackOff` → tag/registry/imagePullSecret; `0/1 READY` → failing readiness.
3. **Confirm the root cause, don't guess.** Tie the symptom to a precise cause (exit code,
   scheduler message, probe failure) before changing anything. Distinguish where it crashed
   from why it was misconfigured.
4. **Author or fix the manifest in source.** Set CPU/memory `requests` and `limits`,
   `liveness`/`readiness`/`startupProbe`, `securityContext` (runAsNonRoot, readOnlyRootFilesystem,
   drop capabilities, no privilege escalation), and a `RollingUpdate` strategy with sane
   `maxUnavailable`/`maxSurge`. For HA, consider a `PodDisruptionBudget`.
5. **Apply safely.** `kubectl apply --dry-run=server -f <file>` first, then apply. Watch the
   rollout: `kubectl rollout status deploy/<name> --timeout=120s`. If it stalls or pods fail
   readiness, `kubectl rollout undo deploy/<name>` and report why.
6. **Verify recovery.** Re-run the step-2 observation: confirm pods `Running`/`Ready`, the
   rollout completed, and the symptom is gone. Report before/after state.

## Inputs
- The workload manifests (or the desired workload), the kube-context/namespace, and for a
  failure: the pod state, events, and logs.

## Output
- The diagnosis (root cause) or the manifest change as `path:line` diffs.
- The exact `kubectl` commands run and their key output (events/status).
- The rollout result and a ready-to-paste rollback command in case of regression.

## Notes
- Read-first and reproducible: never `delete`, `scale` to zero, `drain`, or `apply` to a
  prod namespace without stating blast radius and confirming; never `kubectl edit` as the
  fix — change the manifest so cluster state is reproducible from source.
- Harden the manifest with [[yaml-manifest-review]] before applying (least-privilege,
  pinning, resource governance).
- Diagnose failing workloads with the [[reproduce-then-fix]] discipline: make the failure
  reason observable, then make the minimal corrective change.
- Fit the repo with [[match-project-conventions]] and confirm health with [[verify-by-running]]
  (the dry-run / rollout-status commands and their real output).
