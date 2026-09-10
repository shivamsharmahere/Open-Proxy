# Project Research Summary

**Project:** OPENPROXY v1 Rebrand & Dual-Theme Console (nim-proxy)
**Domain:** Brownfield Rust proxy binary with compile-time embedded operator console (axum + vanilla HTML/CSS/JS, no build step, no npm)
**Researched:** 2026-09-04
**Confidence:** HIGH

## Executive Summary

This milestone adds three features to an already-built product (multi-upstream groups, model routing, dark console, Docker packaging all exist): a dual-theme console (orange-on-black dark + creamy light, with remembered toggle defaulting to OS), a provider-neutral copy sweep (NIM-only wording → generic provider/base-URL/key labels), and a multi-provider first-setup wizard (repeatable provider block fixing the "only NVIDIA at setup" gap). All four research threads converge on the same headline: **zero new dependencies.** Every feature composes from the existing stack — Rust + axum 0.8.9 + serde + CSS custom properties + vanilla JS + the repo's Python/Node proof scripts.

The recommended approach is strictly ordered because the dependency chain is hard, not advisory: copy-sweep foundation first (every later phase breaks its i18n gates otherwise), then the theme token system + toggle (toggle without tokens produces a half-themed console), then the `SetupReq` backend extension before its wizard UI (frontend loop-block is useless without the backend accepting N groups in one atomic claim), then a both-themes signup-to-first-call verification as the milestone exit gate. Backend setup work and theme CSS work can parallelize; the wizard UI and final verification cannot.

The key risks are all gate-shaped, not unknown-technology-shaped: stale i18n hashes/orphan ids (the project's most-guarded-against bug class, with shipped negative fixtures proving it), theme flash worsened by the CSP ban on inline scripts (the standard tutorial fix cannot ship here), hard-coded colors outside the token system, WCAG contrast failures on the chosen palette, breaking the atomic single-claim setup invariant when adding N providers, and DOM-id/byte-assertion gate breakage. Each has a concrete, cheap prevention — catalog-first edits, external-script bootstrap + CSS media-query defaults, token audit via `rg`, measured contrast table, validate-everything-before-mutating-anything with red tests first, additive-only DOM changes — and the "Looks Done But Isn't" checklist in PITFALLS.md turns them into phase exit criteria.

## Key Findings

### Recommended Stack

Zero new dependencies. axum is already at latest stable (0.8.9, MSRV 1.80 — no upgrade needed); multi-provider setup is a serde struct extension (`groups: Vec<SetupGroup>` with `#[serde(default)]` preserving old payloads), not a framework problem. Theming is native CSS custom properties (`:root` dark tokens + one `[data-theme="light"]` override block) with ~15 lines of vanilla JS (`setAttribute('data-theme')` + `localStorage` + one `matchMedia` listener) in the already-loaded external files. Copy sweep is data work in `en-US.json` + existing Python stdlib scripts, not tooling work. See STACK.md for the full avoidance table (no npm, no template engines, no `rust-embed`, no `ServeDir`, no i18n crates, no inline scripts, no server-side theme) — it is as load-bearing as the recommendation table.

**Core technologies:**
- Rust stable + axum 0.8.9 + serde/serde_json — wizard payload extension, served pages, wire-format-safe deserialization — already in tree, newest stable pinned
- CSS custom properties (`:root` + `[data-theme]`) — dual-theme token system — industry consensus across 5+ 2025–2026 sources; one override block, zero component rewrites
- Vanilla JS in `shared.js`/`setup.js`/`login.js` — theme bootstrap + dynamic wizard group rows — CSP-safe (external files only), ~15 lines, no library
- Python stdlib scripts + stdlib-only `render_check.js` — copy-sweep enforcement + both-themes render gate — already gate-enforced, extend the matrix, don't add Playwright

### Expected Features

Bounded brownfield milestone, not a v1: "MVP" means the shippable milestone slice in phase order. Eight P1 items form the exit gate; everything else is P2/P3. See FEATURES.md.

**Must have (table stakes):**
- Provider-neutral copy sweep incl. hashes + public fixtures + render fixtures — the rebrand promise; breaks three gates if split
- Semantic token layer (primitives + semantics, components reference semantics only) — toggle is decoration without it
- Theme toggle (light/dark/system, remembered in `localStorage`, OS default, no-flash, CSP-safe bootstrap, `theme-color` meta update)
- Multi-provider wizard (repeatable provider block + per-key Test Connection + progress + review-before-finish) with `SetupReq`/API support — fixes the reported gap at its root
- Masked secret input with reveal + no-persist-on-failure
- Signup-to-first-call verification in both themes (dark/light × single/multi-provider matrix) + screenshots + rebuilt image — milestone proof

**Should have (competitive):**
- Orange-on-black dark + creamy light brand values (accent swap inside the token system, contrast-checked pairs per theme)
- First proxied call as the wizard's ah-ha moment — deferred: needs billing/quota UX care; dashboard-level verification covers the milestone
- Skip-to-dashboard / expert mode — trigger: returning-operator friction reports
- Draft persistence / resume — trigger: abandonment evidence; ONLY if it fits existing store shapes (conflicts with no-storage-change constraint — cut before touching formats)
- Inline per-provider key help + cost hints — trigger: support questions about key origins

**Defer (v2+):**
- New providers, non-OpenAI protocols, additional locales, billing UI — each violates explicit out-of-scope bounds
- In-wizard live first call — scope-creep risk into billing/quota UX
- OS-only theming, separate light.css/dark.css, per-keystroke validation, server-side theme, 12-step tour, time-of-day auto-theme — anti-features (see FEATURES.md)

### Architecture Approach

No new top-level structure; all work lands in existing files (`settings.rs` extended, `config.rs`/`lib.rs` untouched, two stylesheets + three scripts extended, three HTML files get additive markup, `en-US.json` extended). Four patterns carry the milestone: (1) token-override dual theme (`:root` orange-dark defaults + `[data-theme="light"]` block + `color-scheme` flip, ~40-line diff per file); (2) theme toggle as catalog-labeled topbar control bound to one ~20-line snippet triplicated across three pages (accepted — a shared import would need a new asset route); (3) multi-provider setup as "grouped SetupReq" (additive `upstreams: Vec<SetupUpstream>`, fold through existing group helpers, exactly one `commit()` per claim, `config::validate` enforces everything with zero new validator code); (4) catalog-first copy (id first, `data-i18n`/`message()` second, regenerate third — prefix discipline decides public vs operator wire routing). See ARCHITECTURE.md.

**Major components:**
1. `presentation.rs` + `lib.rs` CSP boundary — compile-time embedding, operator/public catalog projection, `script-src 'self'` — add no routes, no inline scripts, ever
2. Token stylesheets (`operator.css` ~20 tokens, `public.css` 8) + `shared.js`/`setup.js`/`login.js` snippet — theme = token override set, charts re-render via `css('--var')`
3. `settings.rs` setup flow + `config.rs` group model — atomic first-run claim extended to N groups, store shape unchanged, one `commit()`
4. Catalog pipeline (`en-US.json` → wire projections → `check_i18n.py` → `locale_v1.py --update-public`) — every new string gets an id first; batch as its own commit to isolate hash churn

### Critical Pitfalls

Top 8 from PITFALLS.md (all HIGH confidence, repo sources read directly); the checklist at the bottom of that file is the phase-exit machinery.

1. **Stale i18n hashes / orphan ids** — catalog-first edits, recompute per `check_i18n.py` logic, run checker after every file, mechanical wording-only sweep — Phase 1
2. **Theme flash (FOWT) + CSP** — external pre-paint bootstrap + pure-CSS `prefers-color-scheme` defaults + `no-transition` until first frame, throttled-reload verification — Phase 2 design-first
3. **Hard-coded colors outside tokens** — `rg` literal-color audit, full token set for both themes up front, both-themes screenshots — Phase 2 entry task
4. **Orange/cream contrast failures** — measure every text/bg pair (4.5:1 / 3:1), separate decorative vs text accent variants — Phase 2 deliverable alongside token table
5. **Breaking atomic single-claim setup** — validate everything before mutating anything, red tests first (double-POST, invalid-provider-2, re-claim refusal) — Phase 3 entry proof
6. **Setup validation gaps** — structural validation sync for all providers, liveness best-effort with tight timeouts + per-provider errors, preserve form state — Phase 3 test plan
7. **DOM id/class + served-byte gate breakage** — additive-only DOM, full proof stack after every change — continuous, enforced hardest in Phase 4
8. **Fixture drift (stale or vacuous)** — regenerate + line-by-line diff review per phase, backfill new-surface fixtures (light theme, multi-provider states, new `SetupReq` shapes), 8 OpenAPI tests in the same commit

## Implications for Roadmap

Based on research, suggested phase structure (unanimous across FEATURES, ARCHITECTURE, and PITFALLS — adopt as-is):

### Phase 1: Copy-Sweep Foundation
**Rationale:** Every later phase depends on a green i18n gate; hash churn isolated in one commit unblocks everything.
**Delivers:** Provider-neutral `en-US.json` + ALL new ids (theme + multi-group) + recomputed hashes + regenerated public fixture + render fixtures.
**Addresses:** Provider-neutral copy (P1); unblocks toggle labels and wizard copy.
**Avoids:** Pitfall 1 (stale hashes/orphans), Pitfall 8 (locale fixture drift). No code deps — can parallelize with Phase 2 CSS.

### Phase 2: Theme Token System + Toggle
**Rationale:** Toggle wired against hardcoded colors produces a half-themed console; tokens must land before (or with) the toggle, never after. Bootstrap mechanism designed before any theme CSS (CSP removes the standard fix).
**Delivers:** `:root` orange-dark defaults + light overrides + `color-scheme` flip in both stylesheets; snippet + buttons in three pages; `themeColors()` chart-chrome fix; recorded contrast table; both-themes screenshots.
**Uses:** CSS custom properties + vanilla JS snippet; `body[hidden]`-until-ready pattern; `render_check.js` both-themes matrix.
**Implements:** Architecture Patterns 1–2; FEATURES token layer + toggle + brand values (P1/P2).
**Avoids:** Pitfalls 2 (flash), 3 (stray colors), 4 (contrast).

### Phase 3: Multi-Provider Setup (Backend → UI)
**Rationale:** Frontend loop-block without backend multi-group support is useless; backend first or both behind the same phase, never UI-only. Single-atomic-claim invariant constrains the whole design.
**Delivers:** `SetupUpstream` struct + `setup_submit` fold + utoipa schema + backward-compat/atomicity/pool-floor red tests (entry proof); then wizard `groups[]` state + per-group validate + review rows + submit mapper; OpenAPI fixtures + UI fixtures for new states.
**Addresses:** Multi-provider wizard + Test Connection + progress/review + masked input (P1).
**Avoids:** Pitfalls 5 (atomicity), 6 (validation gaps), 8 (SetupReq/UI fixtures), wire-format drift (8 OpenAPI tests same-commit).

### Phase 4: Full Verification + Image Rebuild
**Rationale:** The signup-to-first-call matrix in both themes is the milestone exit gate; it sits last because it requires everything above.
**Delivers:** `cargo test` (228 lib + 124 e2e + 8 openapi) green, i18n + locale-v1 green, `render_check.js` both themes, live signup→setup→dashboard→first-call in both themes, all-pages both-themes screenshots incl. error states, rebuilt Docker image with embedded-asset verification, no-localized-data `rg` check.
**Avoids:** Pitfall 7 (gate breakage), vacuous-fixture case (b); proves milestone value end to end.

### Phase Ordering Rationale

- **Dependencies dictate order:** wizard UI requires `SetupReq` change; toggle requires token layer; copy sweep requires nothing but everything requires its hashes — so 1 → 2 → 3 → 4 with 1∥2-CSS and 2∥4-backend parallelization allowed.
- **Grouping follows architecture boundaries:** catalog commit isolated (hash churn), CSS-only diff (screenshot-verifiable pre-JS), backend-extension commit (test-heavy), UI commit (depends on payload contract), verification (depends on all).
- **Pitfall prevention is phased, not pooled:** each pitfall maps to exactly one prevention phase (see table in PITFALLS.md), so phase exit criteria double as risk retirement.

### Research Flags

Phases likely needing deeper research during planning (`/gsd-plan-phase --research-phase <N>`):
- **Phase 3:** only if scope expands beyond the researched contract — e.g. group-name echo in `validate-key`, noscript multi-group support, or draft-persistence store fitting (the persistence-vs-no-storage-change conflict needs a design decision, not more sources).
- **Phase 2:** only if imagery goes beyond flat colors — distinct per-theme logo/chart-imagery tokens are sketched in STACK.md variants but unvalidated against actual assets.

Phases with standard patterns (skip research-phase):
- **Phase 1:** mechanical catalog workflow, gate-enforced, fully documented in-repo.
- **Phase 2 (core):** `data-theme` + `localStorage` + `matchMedia` pattern verified across 5+ independent 2025–2026 sources; unanimous consensus.
- **Phase 3 (core):** grouped-`SetupReq` design verified line-by-line against `settings.rs`/`config.rs`; no external unknowns.
- **Phase 4:** existing proof gates reused, matrix extended — procedural, not research-shaped.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | axum 0.8.9 verified via crates.io API + docs.rs + GitHub releases 2026-09-04; MDN/OpenReplay/StackPractices agree on theming; integration points grounded in the project tree itself |
| Features | MEDIUM | Cross-checked web sources (Chrome/MDN/CSS-theming/NNGroup/wizard implementations convergent); project specifics rest on PROJECT.md as ground truth — validate step counts and skip-mode prominence during planning |
| Architecture | HIGH | Verified against `src/settings.rs`, `presentation.rs`, `lib.rs` CSP, `config.rs`, `src/web/*` — source of truth, not inference |
| Pitfalls | HIGH | Repo sources read directly (catalog scripts, render gate, fixtures, PROJECT.md constraints); theme-flash findings cross-checked across multiple web sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Draft persistence store fit:** unknown whether resumable wizard state fits existing config/auth store shapes without format changes — decide during Phase 3 planning; default to cutting it (P2, trigger-gated) rather than touching formats.
- **Per-theme imagery:** if light theme needs distinct logo/chart art beyond token recolors, the computed-style bridge is sketched but unvalidated — inventory actual image assets during Phase 2 planning.
- **`rust-embed`-vs-`include_str!` judgment (STACK.md):** project-scale reasoning, no authoritative source — MEDIUM; harmless either way since the recommendation is "change nothing."
- **SaaS onboarding claims (wizard step caps, skip-friction):** single-source, directionally consistent — treat step-count guidance as advisory, validate against the actual wizard during Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- Project tree: `Cargo.toml` / `Cargo.lock` (axum 0.8.9), `src/settings.rs` (`SetupReq`, atomic claim, `validate-key`), `src/presentation.rs` (embedding, catalog split), `src/lib.rs` (CSP), `src/config.rs` (group model, validation), `src/web/*` (wizard, tokens, chart colors), `scripts/check_i18n.py` + `scripts/render_check.js` + `tests/fixtures/locales/` negative fixtures, `.planning/PROJECT.md` (scope, constraints, gates)
- crates.io API (`max_stable_version: 0.8.9`) + docs.rs + GitHub releases, verified 2026-09-04
- MDN (CSS custom properties; `light-dark()` reference), Chrome modern-web dark-mode guidance

### Secondary (MEDIUM confidence)
- OpenReplay / StackPractices theme-switcher articles (data-theme + color-scheme + storage-failure edges; toggle + OS-listener pattern)
- NNGroup wizard guidelines; wizard UX pattern guides (validation gating, Back-preserves-data, review step, focus management)
- ProviderWizard / Blink LLM keys / Oboto setup-wizard implementations (convergent multi-provider onboarding)
- Theme-flash/FOWT + `no-transition` guard + three-state priority (multiple agreeing sources)

### Tertiary (LOW confidence)
- SaaS onboarding research (wizard-vs-checklist, 3–5 step cap, completion data) — single-source claims, directionally consistent; validate in planning
- `rust-embed` scale judgment — project-scale reasoning, no authoritative source

---
*Research completed: 2026-09-04*
*Ready for roadmap: yes*
