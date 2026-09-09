# Milestone v1 Requirements — OPENPROXY Rebrand & Dual-Theme Console

## Copy rebrand (provider-neutral)

- [ ] **COPY-01**: Wizard copy is provider-neutral — first-time setup never names NVIDIA-only key flows; generic "API key" + provider-group wording throughout steps 1–4.
- [ ] **COPY-02**: Dashboard/settings copy sweep — every user-visible NIM-specific string (keys, validation, users, hints) reworded provider-neutral; no screen contradicts multi-provider reality.
- [ ] **COPY-03**: Catalog hashes + fixtures regenerated — every edited `en` gets fresh `sha256(en)[:8]`, public projection regenerated, `check_i18n.py` + `locale_v1 --all` green, no new em-dashes.

## Dual theme

- [ ] **THEME-01**: Token split — `:root` dark defaults + `[data-theme="light"]` creamy overrides in `operator.css`/`public.css`; components reference semantic tokens only.
- [ ] **THEME-02**: Palette pairs — orange-on-black dark and deep-orange-on-cream light, each text/background pair at WCAG AA; single accent locked everywhere.
- [ ] **THEME-03**: Toggle + memory — visible toggle, persisted in browser, OS setting as default, no first-paint flash within the CSP external-scripts-only constraint; reduced-motion gate preserved.
- [ ] **THEME-04**: Icon recolor — product mark follows the orange identity (shape unchanged).

## Multi-provider setup

- [ ] **SETUP-01**: `SetupReq` accepts extra provider groups — additive `upstreams[]` (name, base URL, keys) alongside the existing primary-group fields.
- [ ] **SETUP-02**: Atomic claim validation — all groups validated before any mutation (names unique, URLs valid, pool-floor invariant holds); old single-group payloads still work.
- [ ] **SETUP-03**: Wizard multi-group UI — add/remove groups, per-key probe against the group's own base URL, review screen lists all groups; finish blocked until ≥1 valid key exists.
- [ ] **SETUP-04**: Noscript form stays primary-group-only with a hint pointing at the full wizard.

## Verification

- [ ] **VER-01**: Both-theme signup-to-first-call pass — fresh container, claim with 2 providers, proxied call served, theme toggled mid-flow without breakage.
- [ ] **VER-02**: Screenshots — setup, login, dashboard, settings captured in both themes and archived.
- [ ] **VER-03**: Image rebuilt — `docker build -t open-proxy .` from the final tree, `/health` + wizard smoke green.

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
| COPY-01 | Phase 1 | Pending |
| COPY-02 | Phase 1 | Pending |
| COPY-03 | Phase 1 | Pending |
| THEME-01 | Phase 2 | Pending |
| THEME-02 | Phase 2 | Pending |
| THEME-03 | Phase 2 | Pending |
| THEME-04 | Phase 2 | Pending |
| SETUP-01 | Phase 3 | Pending |
| SETUP-02 | Phase 3 | Pending |
| SETUP-03 | Phase 3 | Pending |
| SETUP-04 | Phase 3 | Pending |
| VER-01 | Phase 4 | Pending |
| VER-02 | Phase 4 | Pending |
| VER-03 | Phase 4 | Pending |
