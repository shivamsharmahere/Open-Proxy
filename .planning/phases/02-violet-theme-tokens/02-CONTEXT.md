# Phase 2: Violet Theme Tokens - Context

**Gathered:** 2026-09-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Dark console wears the graphite + violet + cyan identity with semantic status colors. Scope delta 2026-09-05: supersedes orange dual-theme; dark-only, no toggle. This phase delivers CSS custom property updates, status color tokens, and chart color centralization — no new components or routes.
</domain>

<decisions>
## Implementation Decisions

### Token Mechanics
- Repoint `--accent` to violet primary (#7C5CFC); rename current cyan `--accent` to `--cyan` / `--accent-data`
- Chart colors read from theme tokens via `css()` / `themeColors()` instead of hardcoded hex literals
- Centralize palette in one object (operator.css custom properties + shared.js themeColors()) to avoid drift

### Status Semantics
- Use emerald for success/ok, amber for warning, red for error/danger — standard semantic mapping
- `--green` in public.css renamed to `--ok` or `--success`; operator.css adds `--success` / `--warning` / `--danger` tokens

### Product Mark
- Logo / favicon uses violet identity; keeping existing shapes, just recoloring

### Animation / Transition
- No animated color transitions (prefers-reduced-motion preserved; instant swap on load)

### WCAG AA
- Every new text/background pair audited; ink tokens adjusted if contrast drops below 4.5:1 on new surfaces

### the agent's Discretion
- Exact hex values for violet, cyan, emerald, amber chosen at implementation time to meet contrast
- public.css treatment (login CTA, card gradient) chosen to match operator.css palette
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/web/operator.css` lines 1–11: CSS custom property block (--bg, --accent, --ink-*, --amber, --red, etc.)
- `src/web/shared.js` line 262: `RAMP` array hardcoded to current cyan; replace with theme token reads
- `src/web/public.css` line 2: hardcoded --green/--err; gradient + focus ring at lines 105,124,133
- `src/web/dashboard.js` line 621: `LANE_COLORS` array with #22D3EE literal

### Established Patterns
- `css('--token')` helper in shared.js reads live custom property values
- No build step — vanilla CSS tokens applied via :root selector
- SVG charts use inline `stroke`/`fill` from css() calls

### Integration Points
- operator.css :root block (all token definitions)
- public.css :root block + gradient/focus/card rules
- shared.js themeColors() or equivalent palette export
- dashboard.js LANE_COLORS array
</code_context>

<specifics>
## Specific Ideas

- Graphite surfaces (not neon-gradient); violet primary actions; cyan secondary data
- Scope delta locked 2026-09-05: dark-only, no toggle, no light theme
- Orange dual-theme superseded entirely
</specifics>

<deferred>
## Deferred Ideas

- Light theme / toggle — dropped by owner decision 2026-09-05
- New components or routes — none in this phase
</deferred>
