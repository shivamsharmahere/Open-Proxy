# Phase 3: Multi-Provider Setup - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Phase Boundary

First-time setup wizard claims multiple provider groups (name, base URL, keys) in one atomic flow. Currently the wizard only supports a single NVIDIA NIM group. This phase adds group management UI (add/remove/reorder), per-key probe against each group's base URL, review step showing all groups, backward-compatible single-group payloads, and noscript fallback with hint.
</domain>

<decisions>
## Implementation Decisions

### Wizard Architecture
- Extend existing 3-step wizard (account → keys → review) to support multiple groups within step 2
- Step 2 becomes "Configure providers" with group cards; step 3 becomes "Review all groups"
- Single-group payloads still work — backend accepts both old `{nim_keys: [...]}` and new `{groups: [{name, base_url, keys: [...]}`]}` formats

### Group Management
- Add/remove group buttons in step 2; each group card has: name input, base URL input, key list, add-key button
- Default group name: "Provider 1" (auto-increments)
- Remove button disabled when only 1 group remains
- Groups ordered as added; no drag-reorder in v1

### Key Probe
- Per-key probe hits each group's own base URL (not a global endpoint)
- Probe response shows per-key status (valid/invalid/latency)
- Cannot proceed to review until at least one valid key exists across all groups

### Noscript Fallback
- Hidden `.noscript-fallback` elements already exist in setup.html
- Noscript users see single-group form (primary group only) with a hint: "For multiple providers, enable JavaScript"
- Form still submits valid single-group payload

### Backend
- `/setup` POST endpoint accepts `groups` array or legacy `nim_key`/`nim_rpm`/`base_url` fields
- Failed multi-group claim rolls back entirely (atomic — no partial state)
- Existing `settings_store` and `key_ring` code handles the new format

### Frozen Identifiers
- Field names `nim_keys`, `nim_key`, `nim_rpm`, `base_url` stay in legacy path
- Route `/setup` stays unchanged
- Catalog ids with `nim_key_count` stay unchanged
- `nvapi-…` placeholder stays
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/web/setup.html`: 3-step wizard with noscript fallbacks, data-i18n attributes
- `src/web/setup.js`: Wizard state machine (step transitions, key validation, form submission)
- `src/settings.rs`: `SettingsStore` with `apply_setup_payload` handling nim_keys/base_url/rpm
- `src/api.rs`: `/setup` POST handler, `/api/settings/nim-keys` GET

### Established Patterns
- Wizard steps controlled by showing/hiding `<section>` elements
- Key validation uses `/v1/models` probe against base_url
- i18n via `data-i18n` and `data-i18n-text` attributes
- Form uses `method="post" action="/setup"` with noscript fallback

### Integration Points
- setup.js wizard state machine (add group step, group card rendering)
- settings.rs apply_setup_payload (accept groups array)
- setup.html (new group card markup, add/remove buttons)
- locales/en-US.json (new i18n keys for group labels)
</code_context>

<specifics>
## Specific Ideas

- Keep the wizard feel — don't turn it into a complex form; group cards should feel lightweight
- Probe feedback should be inline per key (green check / red X / spinner), not a separate step
- Review step shows all groups in a summary card layout

</specifics>

<deferred>
## Deferred Ideas

- Drag-reorder groups — out of scope for v1
- Import/export group configs — future enhancement
- Group-level RPM settings — keep global for now
</deferred>
