# Milestone v1 Requirements — OPENPROXY Rebrand & Violet Console

## Copy rebrand (provider-neutral)

- [x] **COPY-01**: Wizard copy is provider-neutral — first-time setup never names NVIDIA-only key flows; generic "API key" + provider-group wording throughout steps 1–4. _(Phase 1 plans 01-01/01-02, 2026-09-05)_
- [x] **COPY-02**: Dashboard/settings copy sweep — every user-visible NIM-specific string (keys, validation, users, hints) reworded provider-neutral; no screen contradicts multi-provider reality. _(Phase 1 plans 01-01/01-02, 2026-09-05)_
- [x] **COPY-03**: Catalog hashes + fixtures regenerated — every edited `en` gets fresh `sha256(en)[:8]`, public projection regenerated, `check_i18n.py` + `locale_v1 --all` green, no new em-dashes. _(Phase 1 plans 01-01/01-02, 2026-09-05)_

## Theme (violet)

- [x] **THEME-01**: Token split — `:root` graphite/violet dark tokens in `operator.css`/`public.css`; components reference semantic tokens only. (Dark-only per 2026-09-05 decision; no light token set.)
- [x] **THEME-02**: Palette pairs — graphite surfaces + violet primary + cyan secondary + emerald/amber/red semantic colors (SCOPE DELTA 2026-09-05: supersedes orange-on-black/cream; vanilla CSS vars, no Tailwind; data-driven chart colors, no per-model hardcoding, no Dollars-Saved card)
- [ ] ~~**THEME-03**: Toggle + memory~~ — DROPPED 2026-09-05 (dark-only console; no second theme to toggle to)
- [x] **THEME-04**: Icon recolor — product mark follows the violet identity (shape unchanged; SCOPE DELTA 2026-09-05: supersedes orange identity)

## Multi-provider setup

- [ ] **SETUP-01**: `SetupReq` accepts extra provider groups — additive `upstreams[]` (name, base URL, keys) alongside the existing primary-group fields.
- [ ] **SETUP-02**: Atomic claim validation — all groups validated before any mutation (names unique, URLs valid, pool-floor invariant holds); old single-group payloads still work.
- [ ] **SETUP-03**: Wizard multi-group UI — add/remove groups, per-key probe against the group's own base URL, review screen lists all groups; finish blocked until ≥1 valid key exists.
- [ ] **SETUP-04**: Noscript form stays primary-group-only with a hint pointing at the full wizard.

## Verification

- [ ] **VER-01**: Signup-to-first-call pass — fresh container, claim with 2 providers, proxied call served, no breakage.
- [ ] **VER-02**: Screenshots — setup, login, dashboard, settings captured (dark console) and archived.
- [ ] **VER-03**: Image rebuilt — `docker build -t open-proxy .` from the final tree, `/health` + wizard smoke green.

## Scope Deltas

- **2026-09-05 — violet theme switch.** Owner replaced the orange dual-theme plan with the graphite + violet primary + cyan secondary + semantic status colors proposal. Adaptations vs the proposal as pasted: vanilla CSS custom properties (no Tailwind — Ponytail: existing `operator.css`/`public.css` token system does it); OPENPROXY naming (not "NIM Proxy"); no Dollars-Saved KPI (metric deliberately deleted); chart colors data-driven by series, not hardcoded per model id. Cascade resolved same day: dark-only console (THEME-03 dropped; THEME-01 dark tokens only; VER-01/02 single-theme).

- **2026-09-05 — dark-only resolution.** Owner dropped the light theme + toggle: console stays dark-only (as today). THEME-03 dropped; THEME-01 is dark tokens only; VER-01/02 are single-theme (dark) passes.

## Future Requirements (deferred)

- In-wizard live test call against a provider.
- Setup draft persistence/resume across restarts.
- Additional locales beyond en-US.
- Per-provider key verification strategy differences.

## Out of Scope (explicit exclusions with reasoning)

- New providers/protocols beyond OpenAI-compatible surface — no backend need for this milestone.
- Billing/pricing UI — no product requirement.
- Metric, API, or storage format changes — presentation + setup-payload only, by constraint.
- New icon libraries or webfonts — offline/CSP-safe stack stays as-is.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COPY-01 | Phase 1 | Complete (01-01/01-02) |
| COPY-02 | Phase 1 | Complete (01-01/01-02) |
| COPY-03 | Phase 1 | Complete (01-01/01-02) |
| THEME-01 | Phase 2 | Complete |
| THEME-02 | Phase 2 | Complete |
| THEME-03 | Phase 2 | Dropped (dark-only 2026-09-05) |
| THEME-04 | Phase 2 | Complete |
| SETUP-01 | Phase 3 | Pending |
| SETUP-02 | Phase 3 | Pending |
| SETUP-03 | Phase 3 | Pending |
| SETUP-04 | Phase 3 | Pending |
| VER-01 | Phase 4 | Pending |
| VER-02 | Phase 4 | Pending |
| VER-03 | Phase 4 | Pending |
