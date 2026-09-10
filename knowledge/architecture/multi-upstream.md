---
type: Component
title: Multi-upstream endpoint groups
description: Several OpenAI-compatible APIs behind one proxy; model-name routing, per-group allowlists, global model toggles, merged catalog.
tags: [upstream, routing, models]
timestamp: 2026-09-04T00:00:00Z
---

# Multi-upstream endpoint groups

The proxy fronts **several OpenAI-compatible APIs**, not just NVIDIA NIM:
the primary `nvidia` group plus any number of extra groups (other providers,
self-hosted NIM, second team accounts). Each group has its own base URL,
keys with per-key rpm, enable toggle, and model allowlist. Pre-multi-upstream
stores load unchanged as one enabled catch-all `nvidia` group (additive
schema: `upstreams: []`, `disabled_models: []`, primary `enabled: true`,
empty `models`).

- **Lanes are group-tagged.** `LaneSpec` carries `endpoint` (index into the
  stored group order, 0 = primary), `base_url`, and `upstream` name. A key on
  a disabled group parks as a state carrier — the same mechanism as a
  disabled key — so re-enabling resumes warm. Grants carry the originating
  `Arc<Pool>` plus the lane's endpoint metadata, so a settings-driven swap
  can never reroute an in-flight reservation to another group's API.
- **Routing is by model name** (`Config::route_model`): a model pinned in a
  group's allowlist is served only by that group (a key is never spent where
  the model doesn't exist); anything else falls back to the catch-all groups
  (empty allowlist). The dispatcher filters to the allowed groups
  (`reserve_filtered` / `acquire_filtered`); lanes outside the filter neither
  grant nor set the wait. Affinity `prefer` on a disallowed lane falls
  through instead of sticking.
- **Toggles fail fast.** Globally disabled models are rejected with
  `model_disabled` before queueing (no rate budget spent); a model no enabled
  group carries is `404 model_not_found`, not a wait-until-timeout.
- **One merged catalog.** `GET /v1/models` fans out with one rate slot per
  group that has a key, merges by model id (first group wins), and removes
  disabled models. A single group's catalog still passes through
  byte-identical. Disabled-group lanes and keyless groups never burn a queue
  wait (`active_endpoints`).
- **Operator surface.** `POST /api/settings/upstreams` (add/remove/set;
  the primary can be toggled and repinned but never removed) and
  `POST /api/settings/models` (full-replacement disabled list) are
  admin-only and flush the upstream-specific caches. Key add takes an
  optional `upstream` (default `nvidia`); fingerprints stay globally unique.
  The pool-floor invariant spans groups: the superuser must own ≥1 enabled
  key on an enabled group.
- **Unchanged boundaries.** Per-model worker-concurrency stays global — see
  the [governor](governor.md). No new metric labels (series contract holds);
  routing is a debug trace. The authenticated key probe takes an optional
  `upstream` instead of a caller URL (SSRF guard preserved).
