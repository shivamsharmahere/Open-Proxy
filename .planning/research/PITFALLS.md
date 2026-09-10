# Pitfalls Research: OPENPROXY Rebrand + Dual-Theme + Multi-Provider Setup

**Domain:** Brownfield embedded-console rebrand — dual theme, provider-neutral copy sweep, first-run claim-flow extension (Rust + embedded HTML/JS/CSS, hash-pinned i18n catalog, render/e2e proof gates)
**Researched:** 2026-09-04
**Confidence:** HIGH (repo sources read directly: `PROJECT.md`, `src/web/*`, `scripts/check_i18n.py`, `scripts/render_check.js`, `src/settings.rs` structure; theme-flash findings cross-checked across multiple web sources)

## Critical Pitfalls

### Pitfall 1: Stale i18n hashes and orphan/stranded catalog ids after the copy sweep

**What goes wrong:**
Every reworded `en` string changes its `sha256(en)[:8]` freshness hash. If the sweep edits markup text or catalog `en` values without recomputing hashes, `scripts/check_i18n.py` fails on hash freshness; if it adds/removes `data-i18n` ids without updating the catalog (or vice versa), it fails on completeness (missing/orphan). The public-subset projection (`locale_v1.py --update-public` → `tests/fixtures/locales/public-en-US.json`) drifts too, breaking the locale-v1 validator and any e2e fixture that asserts served bytes. A large copy sweep can produce dozens of simultaneous failures that look like a broken pipeline rather than one root cause.

**Why it happens:**
Developers edit copy in HTML directly (it reads naturally) and forget the catalog is the source of truth enforced by three coupled checks (round-trip + completeness + hash freshness), plus the public projection step. The repo even ships negative fixtures (`stale-hash.json`, `orphan-key.json`, `missing-key.json`) proving these exact failures — they are the project's most-guarded-against bug class.

**How to avoid:**
Treat the sweep as catalog-first: edit `src/web/locales/en-US.json` `en` values, recompute hashes the same way `check_i18n.py` does, then regenerate markup attributes/projection (`locale_v1.py --update-public`). Run `python3 scripts/check_i18n.py` after every file, not at the end. Keep the sweep mechanical (wording only, no id renames) so diffs stay reviewable.

**Warning signs:**
`check_i18n.py` reporting hash mismatches or orphans; diff touching HTML text but not `en-US.json`; `public-en-US.json` untouched while catalog changed.

**Phase to address:**
Phase 1 (copy sweep + catalog/fixtures) — must go first; every later phase depends on a green i18n gate.

---

### Pitfall 2: Theme flash (FOWT) from JS-deferred theme application — worsened by the CSP constraint

**What goes wrong:**
The standard tutorial pattern (read `localStorage` in a bottom-of-body script, then set `data-theme`) paints the page in the default theme first, then flips — a white/orange flash on every load for users with the non-default preference. The well-known fix (tiny blocking script in `<head>` that sets the theme attribute before first paint) is **inline**, which this project's CSP (`script-src 'self'`, no inline scripts) forbids. A naive implementation either violates CSP or ships the flash.

**Why it happens:**
Nearly every theme-toggle guide assumes inline head scripts are available. This repo's invariant (CSP forbids inline scripts; theme bootstrap must live in existing external JS files) removes the standard fix, and `color-scheme: dark` hard-coded in `:root` bakes the dark default into first paint.

**How to avoid:**
Apply the theme from an existing external script loaded with no `defer` before stylesheets finish, or set the earliest possible external-script execution that toggles `documentElement` attributes/classes before first paint; keep the bootstrap in `shared.js`/page JS (already CSP-allowlisted). Use pure-CSS `prefers-color-scheme` media queries for the OS-default path so first paint is correct even before JS runs, with the stored override applied ASAP. Suppress transitions until after first paint (e.g. a `no-transition` class removed on `DOMContentLoaded` + `requestAnimationFrame`) so the initial apply doesn't animate. Verify with throttled reload (Slow 3G, stored non-default theme) in headless Chrome — the render gate should assert no uncaught errors and screenshots should be captured in both themes.

**Warning signs:**
Toggle logic living only in `DOMContentLoaded` handlers; `:root` still hard-codes one theme's tokens; screenshots taken in one theme only; any new `<script>` block inside HTML files (CSP violation breaks the page entirely, not just theming).

**Phase to address:**
Phase 2 (theme token system + toggle) — design the bootstrap mechanism before writing any theme CSS.

---

### Pitfall 3: Hard-coded colors outside the token system (theme-incomplete UI)

**What goes wrong:**
Dual theme ships with most surfaces themed but stray hard-coded hex/rgb values (chart colors, badges, inline `style=` attributes, canvas-drawn elements, SVG fills, `noscript.css`) remaining dark-only or light-only. Result: unreadable text on some cards, invisible borders, charts that ignore the theme — caught only by eyeballing screenshots, not by any automated gate.

**Why it happens:**
`operator.css`/`public.css` currently define `:root` tokens, but nothing enforces that all color declarations use them. Developers adding theme overrides (`[data-theme="light"]`) fix the tokens they know about while legacy hard-coded values and JS-set styles slip through. Canvas/SVG elements don't inherit CSS variables without explicit wiring.

**How to avoid:**
Audit with `rg -n "#[0-9a-fA-F]{3,6}|rgb\(|hsl\(" src/web/*.css src/web/*.js` and require every match to either be a token definition or carry a comment justifying it. Define the full token set (bg, card, line, text, muted, accent, danger, focus-ring at minimum) for both themes up front; forbid new literal colors in review. Extend the render gate or a screenshot step to capture every page in both themes and diff structurally.

**Warning signs:**
`rg` for hex literals outside token blocks returns hits; light-theme screenshots with dark-only chart lines; focus rings or borders disappearing in one theme.

**Phase to address:**
Phase 2 (theme system) — token audit is the phase entry task; screenshot-both-themes is its exit proof.

---

### Pitfall 4: Orange-on-black and creamy-light contrast failures (WCAG)

**What goes wrong:**
Burnt orange on near-black and muted text on cream routinely fails WCAG AA (4.5:1 normal text, 3:1 large/UI). Muted/secondary text, placeholder text, disabled states, and orange links on cream are the usual failures. This is an operator console used for long sessions — eye-strain and unreadability complaints follow, and low-contrast focus indicators are an accessibility defect.

**Why it happens:**
Brand identity ("orange accent, creamy light") is chosen by aesthetics; accent colors that pop as large headers fail as small body text. Developers test with their own eyes on good monitors instead of measuring ratios.

**How to avoid:**
Measure every text/background token pair with a contrast checker (or DevTools) against 4.5:1 / 3:1 before freezing tokens; keep decorative orange (large headers, active accents) separate from text orange (lightened/darkened variant that passes). Never use pure black on pure white. Check focus rings, placeholders, and disabled states explicitly — they are always the first failures.

**Warning signs:**
Accent color reused directly as body-text color; `--text-muted` chosen by feel; no contrast numbers recorded anywhere in the phase plan.

**Phase to address:**
Phase 2 (theme system) — contrast table is a phase deliverable alongside the token table.

---

### Pitfall 5: Breaking the atomic single-claim setup invariant when adding multi-provider fields

**What goes wrong:**
`POST /setup` is one atomic claim: create superuser + record config, fail closed pre-setup, refuse re-claim post-setup. Extending `SetupReq` with extra provider groups/keys risks (a) partial claims (superuser created, second provider key invalid → setup half-done, data plane ambiguous), (b) re-claim windows (validation endpoints like `/setup/validate-key` leaking whether setup is complete), (c) weakening the pool-floor invariant (superuser-owned enabled key must exist) if extra groups bypass the ownership check.

**Why it happens:**
Multi-provider setup feels like "add more form fields," but each added provider multiplies validation paths (per-key probes, per-group parsing) inside what must remain a single atomic transaction. Pre-auth validation endpoints are especially tempting to loosen ("probe any key to help the user") in ways that become setup-state oracles.

**How to avoid:**
Validate everything before mutating anything: probe/parse all provider groups and keys first, then execute the single atomic claim; any failure aborts with no durable writes. Keep `SetupReq` backward compatible (old single-group payloads still parse). Keep `/setup/validate-key` bounded and unauthenticated-safe as today — it must not reveal setup completion state beyond what the wizard needs. Add red tests first: double-POST (second must fail), invalid second-provider key (no partial state), post-setup re-claim refusal.

**Warning signs:**
Setup handler writing the superuser before validating provider N; new pre-auth endpoints returning different errors for "no setup yet" vs "setup done"; e2e covering only the happy path with one provider.

**Phase to address:**
Phase 3 (multi-provider setup) — invariant tests (atomicity, re-claim refusal, pool-floor) are the phase entry proof, written before the feature.

---

### Pitfall 6: Setup validation gaps — trusting client-side checks for provider keys

**What goes wrong:**
The wizard validates keys client-side (format, non-empty) and the server accepts them loosely; an operator completes setup with a dead/mistyped key for provider #2 and discovers it only on the first real proxied call. Or server-side per-key probing during setup adds latency/timeouts that the wizard doesn't handle, leaving the UI stuck on "validating…" with no recovery.

**Why it happens:**
`POST /setup/validate-key` exists as a pre-auth probe, but extending it to N providers means N network calls with N failure modes during a flow the user can only run once. Developers either skip server validation for the extra providers (gap) or block setup on live probes with no timeout/error UX (hang).

**How to avoid:**
Server validates structure for all providers synchronously (cheap, no network); liveness probing stays best-effort with tight timeouts and per-provider error reporting that names which provider failed and lets the user fix just that section without losing the rest of the form. Never accept a key the server hasn't at least structurally validated. Wizard must preserve entered state across a failed attempt.

**Warning signs:**
Setup success followed by first-proxied-call failure on provider #2; wizard clearing the whole form on error; no per-provider error attribution in the UI.

**Phase to address:**
Phase 3 (multi-provider setup) — validation matrix (valid/invalid/dead-key per provider × error UX) is phase test plan.

---

### Pitfall 7: Breaking e2e/render gates via removed DOM ids, classes, or served-byte changes

**What goes wrong:**
`cargo test` asserts on served HTML text; `render_check.js` drives the pages in headless Chrome and fails on uncaught exceptions; e2e tests address elements by DOM ids/classes. The milestone constraint is explicit (no DOM ids/classes removed; gates must stay green), yet a copy sweep + theme retrofit touches exactly those surfaces: renaming a class for theming, restructuring wizard steps for multi-provider, changing served bytes so hash-asserting tests fail.

**Why it happens:**
Theming invites class renames ("make it semantic"); the wizard extension invites DOM restructuring (add provider sections → renumber steps, rename ids); the copy sweep changes served bytes that byte-asserting tests pin. Each change is locally reasonable and globally gate-breaking.

**How to avoid:**
Additive-only DOM changes: new `data-theme` attributes and new provider sections reuse existing id/class prefixes; never rename or remove. Run the full proof stack (`cargo test`, `node scripts/render_check.js`, i18n + locale-v1 validators) after every change, not per-phase. If served bytes must change (they will — new copy), update the asserting fixtures deliberately in the same commit with the catalog hash updates, and keep the render-gate's exception detection running in both themes.

**Warning signs:**
Diff deleting an `id=` or `class=`; e2e selectors updated to match (means the contract moved); render gate run only in dark theme; served-HTML assertions "temporarily" ignored.

**Phase to address:**
Every phase (continuous) — gate-green is the exit criterion of each phase, enforced hardest in Phase 4 (full verification).

---

### Pitfall 8: Fixture drift — UI fixtures and OpenAPI/metrics contracts silently stale

**What goes wrong:**
`tests/fixtures/ui/*` fixtures drive `render_check.js`; `tests/fixtures/locales/*` pin catalog projections. After copy + theme + SetupReq changes, stale fixtures either (a) fail loudly (good but noisy, masking real regressions in a wall of fixture diffs) or (b) pass vacuously because the gate doesn't cover the new surfaces (new wizard step never rendered headlessly, new theme never screenshotted, new SetupReq fields never fixture-tested). Case (b) is worse: green gates, broken feature.

**Why it happens:**
Fixtures are updated by regeneration scripts, not by hand — developers forget to regenerate, or regenerate and commit without inspecting the diff. New surfaces (provider #2 section, theme toggle, light theme) have no fixtures at all until someone adds them.

**How to avoid:**
Regenerate all fixtures as part of each phase (`locale_v1.py --update-public`, UI fixture rebuild) and review the regeneration diff line-by-line — unexpected lines are regressions. Add fixtures for every new surface on creation: light-theme screenshots, multi-provider wizard states (0/1/2 extra providers, validation error), new SetupReq shapes. The 8 OpenAPI tests and metric-name invariants must be re-run explicitly after the SetupReq change (wire format does not move — presentation + setup-payload only).

**Warning signs:**
Fixture files older than the code they test; new UI with no corresponding fixture; regeneration diffs committed unreviewed; OpenAPI tests not mentioned in the setup-change plan.

**Phase to address:**
Phase 1 (locale fixtures) and Phase 3 (SetupReq/UI fixtures); Phase 4 verifies coverage of all new surfaces.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| One-off hex values for "just this badge" in the new theme | Faster theme pass | Theme-incomplete UI; every future theme change misses it | Never — use tokens from the start |
| `!important` overrides for light theme instead of proper token scoping | Quick visual fix | Specificity wars; dark theme regressions on every later edit | Never |
| Storing theme choice only in `localStorage` with no OS-default fallback logic | Less code | Users with OS light mode get dark flash/default; FOWT for new visitors | Never — three-state logic (stored > OS > default) is the requirement |
| Skipping public-locale projection regen ("en-only change, fixtures don't matter") | Saves one command | Locale-v1 validator + e2e drift; failures surface phases later | Never |
| Client-side-only validation for extra provider keys | Faster wizard work | Dead keys discovered post-setup; support burden | Never for structure; liveness may stay best-effort with timeouts |
| Duplicating wizard step logic per provider instead of a provider-section component/loop | Ships step 2 faster | N-provider bugs fixed N times; inconsistent error UX | Only if wizard is provably capped at 2 providers forever (it isn't) |
| Theme toggle as a new inline `<script>` in HTML | Fixes FOWT the tutorial way | CSP violation breaks the entire page, not just theming | Never — external JS only |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Hash-pinned catalog (`check_i18n.py`) | Editing HTML text and catalog in separate commits, hashes recomputed last | Catalog-first edits; run checker after every file; keep sweep commits small and green |
| Public locale projection (`locale_v1.py`) | Forgetting `--update-public` after catalog edits | Regenerate + diff-review in the same commit as the catalog change |
| Headless render gate (`render_check.js`) | Running it dark-only or skipping it "because only copy changed" | Run in both themes on every phase; copy changes alter served bytes the gate pins |
| `cargo test` served-HTML assertions | Treating byte-diff failures as "update the expected string" without checking the render | Inspect each served-byte diff: intended copy change (update fixture) vs accidental DOM change (fix code) |
| Headless screenshots | Capturing one theme, eyeballing, moving on | Both themes × every page (setup, login, dashboard) + wizard error states; store as phase proof |
| Docker image rebuild | Verifying with `cargo run` only | Rebuild the image and verify embedded assets (CSS/JS/locales) are the new ones — stale layers ship old console |
| `/setup/validate-key` probe | Extending it to return verbose per-key diagnostics pre-auth | Keep responses minimal; per-provider detail only inside the authenticated-or-claiming flow, never a setup-state oracle |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous live key probes for N providers during setup | Wizard hangs seconds per provider; timeouts on slow networks | Structural validation inline; liveness best-effort with tight per-key timeout + parallel probes | At 2+ providers on high-latency links (the milestone's core scenario) |
| Full-catalog re-render on theme toggle | Visible flicker, chart re-fetch storms | Toggle only swaps `data-theme` attribute; CSS variables repaint without JS re-render or data refetch | Dashboard with live charts on every toggle |
| Transition animations on initial theme apply | Page appears to flash even when the theme was applied pre-paint | `no-transition` guard until after first frame; transitions only for user-initiated toggles | Every first paint with transitions enabled |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Verbose setup-validation errors pre-auth (which provider/key failed, setup state) | User-enumeration / setup-state oracle for attackers | Generic pre-auth responses; detailed per-provider errors only within the claim flow context |
| Double-claim race (two concurrent `POST /setup`) creating two superusers or partial state | Privilege/ownership ambiguity; pool-floor invariant broken | Atomic single-claim preserved; second concurrent claim fails closed; test with parallel POSTs |
| Theme preference stored in a cookie readable server-side without flags | Session-fixation-adjacent leakage; cookie bloat on every request | Keep theme in `localStorage` (client-only); if a cookie is ever needed for SSR-free first paint, use `SameSite=Lax`, minimal value |
| New wizard fields expanding `SetupReq` without updating OpenAPI snapshot tests | Undocumented API surface; clients built against stale schema | Update OpenAPI fixtures + run the 8 OpenAPI tests in the same commit as the `SetupReq` change |
| Copy sweep accidentally localizing data (model ids, publisher names, `nimproxy_*` series) | Breaks the "data is never localized" invariant; corrupts metrics/API contracts | Sweep covers repository-owned labels only; `rg` for model/metric identifiers in changed lines during review |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Theme toggle hidden in settings, no OS default | Users flashed with wrong theme on first visit; can't find the control | Toggle visible in console chrome; default follows `prefers-color-scheme`; choice remembered |
| Wizard reset on validation failure | Re-typing N provider keys after one typo; abandonment | Preserve all entered state; inline per-provider errors; fix-and-resubmit one section |
| Provider-neutral copy that says nothing ("Configure your provider") | First-time user still doesn't know what to do — the milestone's core value fails | Copy names the action concretely ("Add an OpenAI-compatible base URL + API key"); provider-neutral ≠ vague |
| Em-dash or off-taste copy slipping into new strings | Violates taste skill §9.G; inconsistent voice | New copy avoids em-dashes; match existing catalog voice |
| Light theme as an afterthought (dark reviewed, light skimmed) | Half the users get the unpolished theme | Both themes get equal screenshot review; light theme is a first-class deliverable in Phase 2 exit criteria |

## "Looks Done But Isn't" Checklist

- [ ] **Copy sweep:** All `data-i18n` round-trips green — verify `python3 scripts/check_i18n.py` passes, not just "pages look right"
- [ ] **Copy sweep:** Public projection current — verify `public-en-US.json` regenerated and locale-v1 validator passes
- [ ] **Dual theme:** No first-paint flash — verify throttled reload with stored non-default theme shows zero intermediate paint
- [ ] **Dual theme:** Zero hard-coded colors — verify `rg` for hex/rgb literals outside token definitions returns only justified hits
- [ ] **Dual theme:** Contrast measured — verify token-pair ratio table recorded (4.5:1 text / 3:1 UI), not eyeballed
- [ ] **Dual theme:** Both themes screenshotted — verify setup + login + dashboard + error states captured in light AND dark
- [ ] **Setup:** Atomicity proven — verify double-POST and invalid-second-provider red tests exist and pass
- [ ] **Setup:** Old payloads still work — verify single-group `SetupReq` backward-compat test passes
- [ ] **Setup:** Pool-floor invariant held — verify superuser-owned enabled key requirement tested with multi-provider config
- [ ] **Gates:** Full proof stack green — verify `cargo test` (228 lib + 124 e2e + 8 openapi), `render_check.js` both themes, i18n + locale-v1, screenshots, rebuilt image
- [ ] **Data:** No localized identifiers — verify changed lines contain no model ids, publisher names, or `nimproxy_*` series in catalog values

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale i18n hashes / orphan ids | LOW | Recompute hashes per `check_i18n.py` logic; delete or wire orphan ids; regenerate public projection; re-run checker |
| Theme flash shipped | LOW | Move theme apply earlier (external pre-paint script + CSS media-query defaults); add `no-transition` guard; verify throttled |
| Hard-coded colors found post-ship | MEDIUM | Tokenize strays; re-screenshot both themes; add `rg` literal-color check to phase exit criteria so it can't recur |
| Contrast failures found post-ship | LOW | Adjust failing token variants (text-safe accent shades); re-measure; no structural change needed if tokens were used (another reason for tokens-first) |
| Partial setup claim in the wild | HIGH | Manual operator recovery (inspect config/auth store, complete or reset claim); add missing atomicity red test; never auto-retry claims server-side |
| Broken e2e/render gate from DOM renames | MEDIUM | Restore removed ids/classes (additive-only); update selectors back; re-run full gate stack |
| Stale fixtures masking regressions | MEDIUM | Regenerate all fixtures, review diff line-by-line, backfill missing-surface fixtures (new wizard steps, light theme) |

## Pitfall-to-Phase Mapping

Suggested phase order: **Phase 1 copy sweep + catalog/fixtures → Phase 2 theme tokens + toggle → Phase 3 multi-provider setup → Phase 4 full verification + screenshots + image rebuild.**

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Stale i18n hashes / orphan ids | Phase 1 (copy sweep) | `check_i18n.py` + locale-v1 validator green at phase exit |
| Fixture drift (locale/UI) | Phase 1, extended Phase 3 | Regeneration diffs reviewed; new-surface fixtures added |
| Theme flash (FOWT + CSP) | Phase 2 (theme system) | Throttled-reload no-flash check; no inline scripts (`rg "<script"` in HTML) |
| Hard-coded colors | Phase 2 | `rg` literal-color audit clean; both-theme screenshots |
| Contrast failures | Phase 2 | Recorded ratio table meeting 4.5:1 / 3:1 |
| Setup atomicity / re-claim | Phase 3 (wizard) | Double-POST + partial-failure red tests green |
| Setup validation gaps | Phase 3 | Per-provider validation matrix (valid/invalid/dead-key × error UX) |
| DOM id/class breakage | Every phase (continuous) | Full `cargo test` + `render_check.js` green per phase |
| OpenAPI / wire-format drift | Phase 3 | 8 OpenAPI tests green; `SetupReq` backward-compat test |
| End-to-end signup→first-call both themes | Phase 4 (verification) | Live walkthrough both themes + rebuilt Docker image |

## Sources

- Repo primary (HIGH): `src/web/locales/en-US.json`, `scripts/check_i18n.py` (round-trip/completeness/hash checks), `scripts/render_check.js` (headless Chrome exception gate, CSP constant), `src/web/operator.css` + `public.css` (`color-scheme: dark`, `:root` tokens), `src/settings.rs` (`SetupReq`, `POST /setup` atomic claim, `/setup/validate-key`, `/api/settings/upstreams`), `tests/fixtures/locales/` negative fixtures (stale-hash, orphan-key, missing-key), `.planning/PROJECT.md` constraints (CSP external-JS-only, no DOM id/class removal, gates green)
- Web cross-check (MEDIUM-HIGH, multiple agreeing sources): theme-flash/FOWT root cause and pre-paint script fix; `no-transition`-until-first-frame guard; CSS-variable toggle + `prefers-color-scheme` three-state priority; WCAG 4.5:1/3:1 contrast minima
- Web cross-check (MEDIUM): first-run wizard guidance gaps; race-condition check-then-act hazards for single-claim flows (applied here to double-`POST /setup` reasoning; confirm with project-specific red tests)

---
*Pitfalls research for: OPENPROXY v1 Rebrand & Dual-Theme Console (brownfield addition)*
*Researched: 2026-09-04*
