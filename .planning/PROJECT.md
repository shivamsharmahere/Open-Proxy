# OPENPROXY

## What This Is

OPENPROXY is a rate-limit-aware, OpenAI-compatible multi-upstream LLM proxy (Rust + embedded dashboard) forked from nim-proxy. Operators run it in Docker, claim it via a first-run setup wizard, and point OpenAI-speaking clients at it. This milestone rebrands every screen from NIM-specific to provider-neutral copy and ships a graphite + violet console.

## Core Value

A first-time user can sign up, configure any providers, and make a successful proxied call — understanding every screen along the way.

## Requirements

### Validated

- ✓ Multi-upstream endpoint groups with model-name routing — v0.6.6
- ✓ Global model toggles + merged `/v1/models` catalog — v0.6.6
- ✓ Dark slate-navy console with cyan accent — v0.6.6
- ✓ OPENPROXY binary, image, and dashboard brand rename — v0.6.6
- ✓ Provider-neutral copy on setup wizard, login, and dashboard (COPY-01/02/03) — Phase 1 (29 en + 27 desc, fresh hashes, fixtures regen, all gates green; identifiers frozen)

### Active

- [ ] Violet theme: graphite surfaces + violet primary + cyan secondary + semantic status colors, dark-only (scope delta 2026-09-05, supersedes orange dual-theme; toggle + light theme dropped same day)
- [ ] Multi-provider first setup (extra groups + keys claimable in the wizard)
- [ ] Verified end-to-end: signup → setup → dashboard → first proxied call (dark console)

### Out of Scope

- New providers or protocol support (OpenAI-compatible surface only) — no backend need
- Additional locales (en-US only) — catalog system unchanged
- Pricing/billing UI — no product requirement

## Current Milestone: v1 OPENPROXY Rebrand & Violet Console

**Goal:** Rebrand every screen to provider-neutral OPENPROXY copy, ship the graphite + violet console, and make first setup support multiple providers end to end.

**Target features:**
- Copy sweep incl. wizard + dashboard + catalog hashes/fixtures
- Violet theme tokens (graphite/violet/cyan/semantic), vanilla CSS variables — no Tailwind (scope delta 2026-09-05)
- Multi-provider setup wizard incl. SetupReq/API changes
- Full signup-to-first-call verification + screenshots + rebuilt image

## Context

- Brownfield Rust codebase (`src/`, `src/web/` embedded console); prior session work (multi-upstream, rebrand, cyan theme) is uncommitted in the working tree.
- UI strings live in `src/web/locales/en-US.json` with sha256(en)[:8] freshness hashes enforced by `scripts/check_i18n.py`; public subset projected to `tests/fixtures/locales/public-en-US.json` via `locale_v1.py --update-public`.
- Console is dark-only today (`color-scheme: dark`, `:root` tokens in `operator.css`/`public.css`); no theme toggle infrastructure exists.
- Setup wizard (`setup.html`/`setup.js` + `POST /setup` in `settings.rs`) handles one NVIDIA group only; extra providers are post-setup only via `/api/settings/upstreams`.
- Proof gates: `cargo test` (228 lib + 124 e2e + 8 openapi), `node scripts/render_check.js` (headless Chrome), i18n + locale-v1 validators, headless screenshots.
- Env quirk: `/tmp` rejects writes (quota) — use `TMPDIR=/mnt/new-volume/.tmp`.

## Constraints

- **Compatibility**: No metric, API, or storage format changes — presentation + setup-payload only.
- **Security**: CSP forbids inline scripts — theme bootstrap must live in existing external JS files.
- **i18n**: No new user-visible strings without catalog entries; new copy avoids em-dashes per taste skill §9.G; existing catalog copy otherwise untouched.
- **Tests**: No DOM ids/classes removed; e2e + render gates must stay green.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Orange (burnt) dark accent, creamy light | User chose over green; cyan replaced to give OPENPROXY its own identity | SUPERSEDED 2026-09-05 — user switched to violet (next row) |
| Theme toggle in UI, remembered, OS default | User chose over OS-only; explicit control + sensible default | DROPPED 2026-09-05 — dark-only console, nothing to toggle to |
| Graphite + violet primary + cyan secondary + semantic status colors (dark) | User switched from orange dual-theme; proposal adapted: vanilla CSS vars (no Tailwind), OPENPROXY naming, no Dollars-Saved card, data-driven (not per-model) chart colors | — Pending |
| Full multi-provider setup (not copy-only) | Fixes the reported "only NVIDIA at setup" gap at its root | — Pending |
| Execute via GSD milestone v1 + autonomous | User chose milestone scaffolding over direct execution | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-04 after milestone v1 start*
