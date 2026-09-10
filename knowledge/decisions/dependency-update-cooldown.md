---
type: Decision
title: Seven-day cooldown for routine dependency updates
description: Delay non-security Dependabot updates long enough for regressions and compromised releases to surface.
tags: [dependencies, supply-chain, dependabot]
timestamp: 2026-07-28T00:00:00Z
resource: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown-
---

# Seven-day cooldown for routine dependency updates

## Context

Dependabot checks the Cargo, GitHub Actions, and Docker ecosystems weekly.
Without an explicit policy, GitHub applies a three-day cooldown to routine
version updates. That window is shorter than zizmor's recommended seven days
and can admit a fresh regression or opportunistically compromised release
before the ecosystem has had much time to react.

Security updates are not subject to Dependabot cooldowns, so delaying routine
updates does not delay vulnerability remediation.

## Options

1. Keep GitHub's implicit three-day default.
2. Apply one seven-day default to every updater.
3. Maintain ecosystem- and SemVer-specific windows.

## Choice

Set `cooldown.default-days: 7` on the Cargo, GitHub Actions, and Docker
updaters. Use the same window everywhere until observed maintenance or
security outcomes justify a more complex policy.

## Consequences

- Routine releases receive a seven-day observation period before Dependabot
  proposes them.
- Security updates continue immediately.
- A uniform value is easy to audit and avoids policy drift between ecosystems.
- The repository intentionally accepts receiving routine fixes several days
  later in exchange for lower regression and supply-chain risk.

This policy complements the pinned-action, dependency-review, cargo-deny, and
workflow-lint controls described in the
[test strategy](../testing/test-strategy.md).
