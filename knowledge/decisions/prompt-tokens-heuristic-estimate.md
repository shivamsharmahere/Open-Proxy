---
type: Decision
title: Prompt-token chars÷4 heuristic estimate
description: When upstream omits usage entirely, prompt tokens are estimated as request characters ÷ 4, clamped to ≥ 1, and carried as Observation::Estimated — additive-only over a previously empty series, following the completion-estimate pattern.
tags: [metrics, usage, estimation, observation]
timestamp: 2026-09-11T00:00:00Z
---

# Prompt-token chars÷4 heuristic estimate

## Context

[Usage injection](usage-injection-auto-fallback.md) makes token accounting
exact for streamed chat completions, and the completed-stream event count
covers the remaining completion gap. Prompt tokens had no equivalent: the
observation contract fixed `PromptTokens Estimated` at `never`, so a provider
that omits prompt usage left the field `unavailable` and the prompt-token
counters — and every dashboard view built on them — simply silent. Yet the
request body is already parsed and in hand at observation time; nothing about
the estimate requires upstream cooperation.

The constraint is the frozen wire contract: metric names and bounded label
values do not move, and estimates must never be confused with measured totals.

## Options

1. **Leave prompt usage unavailable.** Honest, but Models/Clients token views
   stay half-empty for any provider that omits usage even though the input the
   model consumed is locally known.
2. **Real per-model tokenization.** Accurate, but means shipping a tokenizer
   per model family (vocab tables or a new dependency) and paying
   O(prompt length) work on every upstream-omitting request — far past rung 6
   of the Ponytail ladder when no tokenizer is installed today.
3. **Deterministic chars÷4 heuristic.** The standard ~4-characters-per-token
   approximation, clamped to a minimum of 1. Zero dependencies, constant-time,
   reproducible across versions, and computed from the already-parsed request
   body.
4. **Record the availability outcome only.** The
   `nimproxy_usage_observations_total` series already distinguishes
   `estimated`, but dashboards and history read the token counters, not the
   quality series — this keeps the gap invisible where users actually look.

## Choice

Option 3. When a finalized response carries no measured prompt usage (the
field would otherwise be `unavailable`), the observer estimates prompt tokens
as request character count ÷ 4, clamped to ≥ 1, and marks the field
`Observation::Estimated`. If the field is `invalid` (present but wrong type or
range), it stays `invalid` — a malformed measured value is never laundered
into an estimate. If no request characters were countable, the field stays
`unavailable`.

The estimate flows through the same usage pipeline as the completion-event
estimate: token counters report it under `source="estimate"`, mirrored by
`nimproxy_usage_observations_total{field="prompt_tokens", result="estimated"}`
on the already-frozen quality series. Every label value involved
(`estimate`, `estimated`, `prompt_tokens`) already exists in a bounded closed
set. See the pipeline in
[NIM observations](../architecture/nim-observations.md).

## Consequences

- This is additive-only against the frozen wire contract: metric names and
  every bounded label value are unchanged, and the estimate writes values
  solely into series that previously could carry nothing for that observation
  (usage was absent). No existing measured series moves.
- Prompt/token dashboards for usage-omitting providers show data instead of
  gaps; operators can always split exact from heuristic via the `source`
  label and audit the estimate share via `result="estimated"`.
- The heuristic is deliberately crude: multilingual, code-heavy, or
  whitespace-padded traffic shifts the characters-per-token ratio. It is
  documented and displayed as an estimate, never as exact usage, mirroring
  how the SSE event count is presented for completion.
- Total/cached/reasoning stay measured-or-nothing: `TotalTokens` has no
  estimator, and the consistency rule (total ≥ prompt + completion) does not
  consume the prompt estimate.
