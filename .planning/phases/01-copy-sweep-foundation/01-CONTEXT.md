# Phase 1: Copy-Sweep Foundation - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Reword every user-visible NIM-specific string (setup wizard, dashboard, settings) to provider-neutral OPENPROXY copy, refreshing catalog hashes and regenerating fixtures atomically so all i18n gates stay green. No DOM ids, classes, API, metric, or storage changes.

</domain>

<decisions>
## Implementation Decisions

### Wizard wording
- Generic key noun is "API key" — matches the existing "Client API key" precedent.
- Keep the `nvapi-…` placeholder — factually accurate example for the default group.
- Stepper label becomes "Add API keys".
- Keep the 40-rpm hint — factual default, still true.

### Dashboard wording
- "NIM API keys" headings become "API keys".
- Pool-floor guard copy uses "enabled API key".
- Governor copy uses "when a provider reports worker exhaustion".
- Key-count plurals become "{n} API keys" across all CLDR forms.

### Sweep mechanics
- Leave existing em-dashes in edited strings untouched — minimal churn.
- Update `desc` fields where they name NIM.
- Docs and screenshots out of scope — code + catalog + fixtures only.
- Verify the en-XA pseudolocale as part of phase proof.

### the agent's Discretion
- Exact replacement phrasing per string, as long as meaning is preserved and placeholders stay intact.
- Order of file edits within the phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/web/locales/en-US.json` — single catalog; hash rule `sha256(en)[:8]` enforced by `scripts/check_i18n.py:1442`.
- `scripts/locale_v1.py --update-public` regenerates `tests/fixtures/locales/public-en-US.json`.
- `POST /setup/validate-key` and settings endpoints already accept per-group base URLs.

### Established Patterns
- Copy flows via `data-i18n` / `data-i18n-attr` + `catalogMessage()`; never hardcode display strings (untagged-string lint).
- Additive-only changes; proof stack run per phase (`cargo test`, `render_check.js`, i18n + locale-v1).

### Integration Points
- `src/web/setup.html` + `setup.js` (wizard), `settings.js` + `dashboard.js` (console), `src/api.rs` OpenAPI descriptions naming NIM (update where user-visible).

</code_context>

<specifics>
## Specific Ideas

- User's trigger: setup wizard says "only adding nvidia nim api key at the first time setup" — wizard must read provider-neutral from day one.
- Full sweep on each screen; lightweight; never remove any feature.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope
- (Noted for later phases, not this one: orange/cream dual theme, multi-group wizard payload, end-to-end screenshots + image rebuild.)

</deferred>
