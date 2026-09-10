# Stack Research

**Domain:** Dual-theme console + multi-provider setup wizard + copy sweep for OPENPROXY (Rust binary, embedded vanilla HTML/CSS/JS, no build step, no npm)
**Researched:** 2026-09-04
**Confidence:** HIGH

## Recommended Stack

Headline finding: **zero new dependencies.** All three milestone features compose from the existing stack (Rust + axum + serde + vanilla CSS custom properties + vanilla JS + the repo's Python/Node proof scripts). Every table below names the existing capability, the exact version, and the integration point — because the downstream consumer asked for "what NOT to add" with equal weight, the avoidance table is as load-bearing as the recommendation table.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Rust (stable channel) | stable via `rust-toolchain.toml` (MSRV declared in `Cargo.toml`, enforced by CI `msrv` job) | Wizard payload changes (`SetupReq` gains provider groups) | Already the whole backend; multi-provider setup is a serde struct extension, not a framework problem. axum 0.8.9's MSRV is 1.80 — no toolchain friction. |
| axum | `0.8` range, **lockfile already at 0.8.9 = latest stable** (verified 2026-09-04 via crates.io API + docs.rs + GitHub releases) | Serve theme-aware pages, extended `POST /setup`, existing `/assets/*` routes | No upgrade needed: `Cargo.toml` floats on the `0.8` range and `Cargo.lock` pins the newest stable. Wizard work reuses the existing `ApiJson::<SetupReq>` extractor and `presentation.rs` include_str routes untouched. |
| serde / serde_json | `1` (already in tree) | Deserialize `SetupReq` with a new `groups: Vec<SetupGroup>` field (`#[serde(default)]` keeps old single-group payloads valid) | Zero new crates: the proc-macro stack is already compiled in (per the `Cargo.toml` comment). `#[serde(default)]` preserves the wire-format invariant — old wizard payloads still parse. |
| CSS custom properties (no preprocessor, no framework) | Native CSS, all evergreen browsers | Dual-theme token system: `:root` dark tokens + `[data-theme="light"]` overrides | Industry consensus across 5+ independent 2025–2026 sources (MDN, OpenReplay, StackPractices, Saput, theme-change 1.7k★): tokens-on-`:root` + single `data-theme` attribute on `<html>` is the maintainable pattern. Component CSS never changes — it references `var()` tokens, so adding the light theme = one new variable block, not a stylesheet rewrite. |
| Vanilla JS in existing external files (`shared.js`, `setup.js`) | No library, no version | Theme bootstrap + toggle (`localStorage` + `matchMedia('(prefers-color-scheme: dark)')`) and dynamic wizard group rows | CSP forbids inline scripts, so the theme bootstrap must live in the already-loaded external JS (e.g. `shared.js`, included on every operator page). No library needed: `setAttribute('data-theme')` + `localStorage` + one `matchMedia` listener is ~15 lines. |
| Python stdlib scripts (`check_i18n.py`, `locale_v1.py`, `gen_pseudolocale.py`) | Already in `scripts/` | Copy sweep enforcement: sha256(en)[:8] freshness hashes, public-subset projection, pseudolocale verification | The catalog workflow already exists and is gate-enforced. A copy sweep is data work (edit `src/web/locales/en-US.json` + fixtures), not tooling work. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none)* | — | — | Deliberately empty. Each candidate below was evaluated and rejected; see "What NOT to Use". |
| headless Chrome via `scripts/render_check.js` | System Chrome, **stdlib-only Node (no package.json, no npm install)** | Render-gate both themes + screenshots for the milestone's verification requirement | Already covers "both themes" verification: drive the page, set each `data-theme`, fail on uncaught exceptions. Extend the script's theme matrix; do not add Playwright. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `cargo test` (228 lib + 124 e2e + 8 openapi) | Regression gate for `SetupReq` changes + served-HTML assertions | e2e asserts on served HTML *text*; keep DOM ids/classes frozen per project constraints so the suite stays green. |
| `node scripts/render_check.js [--locale en-XA]` | Catches what `cargo test` cannot: JS throws, theme-token breakage, untranslated catalog runs | Run once per theme. The `--locale en-XA` pseudolocale mode doubles as the copy-sweep overflow check (long fake strings expose layout breaks from reworded copy). |
| `cargo fmt --check` + clippy (toolchain components) | Pre-push hygiene | Required by repo guide before any push; new `SetupReq` fields must be rustfmt-clean. |

## Installation

```bash
# Core — nothing to add. Lockfile already resolves the newest stable:
cargo update -p axum   # no-op today: Cargo.lock pins axum 0.8.9 (latest stable, Apr 2026)

# Supporting — nothing to install:
# - No npm packages (no package.json exists; render_check.js is stdlib-only by design)
# - No new crates (serde/serde_json/axum already in tree)
# - No cargo install (check_i18n.py / locale_v1.py are stdlib Python)
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `[data-theme]` attribute on `<html>` | `.light` / `.dark` class toggle | Never here: attribute expresses a single active value; classes suit compositional multi-flag state. Sources unanimously prefer `data-theme` for theming (also matches `theme-change` helper conventions). |
| `localStorage` key (e.g. `openproxy-theme`) with OS fallback | Cookie or server-side `/api/settings` theme preference | Only if theme must follow the operator across machines — it must not: theme is a per-device display preference, and server persistence would touch the protected config format (invariant: no storage format changes). |
| Extend `SetupReq` with `groups: Vec<SetupGroup>` | Separate `POST /setup/extra-groups` endpoint or post-setup-only flow | Never: the milestone goal explicitly fixes "only NVIDIA at setup" at its root with one atomic claim; a second endpoint splits the atomic-claim invariant and doubles e2e surface. |
| `include_str!` + explicit routes (`presentation.rs` today) | `rust-embed` crate with `#[derive(RustEmbed)]` | Only if the asset count grows ~10× (dozens of files with folder-walking). Today there are ~12 web files on explicit `/assets/*` routes that e2e asserts against; `rust-embed` adds a proc-macro dependency to save ~12 lines and risks breaking the CSP asset-path contract. |
| Hand-rolled `var()` token overrides | Sass/Less build step, Tailwind, CSS-in-JS | Never under current constraints: any of these introduces the npm build step the project explicitly forbids. Native custom properties are runtime-dynamic (unlike Sass compile-time variables) — exactly what theme switching needs. |
| `color-scheme: light dark` handling per theme | `prefers-color-scheme` media query alone (OS-only, no toggle) | OS-only was explicitly rejected in Key Decisions (user chose remembered toggle + OS default). Ship both: media query as default source, stored preference as override. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Any npm dependency (Tailwind, theme-change lib, PostCSS, Playwright) | No `package.json` exists by design; Dockerfile/offline builds and the "no build step" constraint break the moment `npm install` enters. `theme-change` (1.7k★) is a 15-line pattern — vendoring the pattern beats the dependency. | Hand-rolled `data-theme` + `localStorage` (~15 lines in `shared.js`) |
| `rust-embed`, `askama`, `maud`, `tera` | Each adds compile-time machinery (proc-macros / templates) for pages that are static HTML with JS-filled data. Template engines would also bypass the catalog-sink discipline ("Context owns the sink" invariant) by introducing second string-interpolation paths. | Existing `include_str!` in `presentation.rs` |
| `tower-http` `ServeDir` / static-file middleware | Assets are compile-time embedded for single-binary Docker packaging; serving from disk reintroduces a runtime asset path and breaks the distroless image. | Existing explicit `/assets/*` axum routes |
| New Rust crates generally (cookie stores, i18n crates like `fluent`/`gettext`) | Copy sweep is en-US-only with an established JSON-catalog + hash workflow; a localization framework adds API surface for zero milestone value and risks touching protected wire formats. | `src/web/locales/en-US.json` + `scripts/check_i18n.py` |
| Inline `<script>` theme bootstrap in `<head>` | CSP forbids inline scripts — the standard "inline bootstrap to avoid FOUC" snippet from every tutorial **cannot ship here**. An external deferred script means first paint may flash the default theme. | Bootstrap in `shared.js` (already loaded synchronously via `<script src>` before body content renders on operator pages); accept one-paint flash on cold load, or set a `media`-gated default via `prefers-color-scheme` in CSS so OS-dark users never flash. Mitigate residual FOUC with `color-scheme` + matching `<meta name="color-scheme">` |
| `@property` typed custom properties for theme tokens | Chromium-only ancestry; Firefox/Safari support is newer — unnecessary risk for plain color swaps that untyped `var()` handles everywhere. | Plain `--token: value` declarations |
| Server-side theme in config/auth store | Violates "no storage format changes" + "data plane" invariants; theme is display state, not operator state. | `localStorage` per device |

## Stack Patterns by Variant

**If the wizard must validate each provider key pre-claim:**
- Reuse `POST /setup/validate-key` per group row (it already probes without claiming); loop client-side, no new endpoint.
- Because the endpoint is group-agnostic (takes base_url + key), multi-provider validation is a frontend loop, not backend work.

**If the light (creamy) theme needs distinct imagery (logo, chart colors):**
- Expose them as tokens too (`--brand-mark-filter`, `--chart-*`); JS chart code reads `getComputedStyle(document.documentElement)` rather than hardcoding hex.
- Because canvas/SVG don't inherit CSS, computed-style reads are the only no-dependency bridge.

**If `prefers-reduced-motion` users get theme transitions:**
- Gate the `transition: background-color .3s` on `@media (prefers-reduced-motion: no-preference)`.
- Because instant switching is the accessible default; animation is enhancement.

**If e2e must assert theme persistence:**
- Playwright-free option: `render_check.js` sets `localStorage` via CDP `DOMStorage`, reloads, asserts `documentElement[data-theme]`.
- Because adding a JS test framework for one assertion violates the no-npm constraint.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| axum `0.8.9` | Rust ≥ 1.80 (axum MSRV); project tracks stable | `Cargo.toml` `axum = "0.8"` already floats to latest; no pin change. `utoipa = "=5.5.0"` stays exactly pinned per project convention — new `SetupReq` fields need `ToSchema` derives so `openapi.json` regenerates (8 openapi tests enforce). |
| Vanilla `data-theme` CSS | All evergreen browsers (custom properties since 2017) | No `@property`, no `light-dark()` (Baseline 2024 but thinner test coverage in headless Chrome matrix) — stick to universally supported syntax. |
| `matchMedia('(prefers-color-scheme: dark)')` + `addEventListener('change')` | All evergreen browsers | Use `addEventListener`, not legacy `addListener` (removed from spec). |

## Sources

- crates.io API `GET /api/v1/crates/axum` — `max_stable_version: 0.8.9` (verified 2026-09-04) — HIGH
- docs.rs `axum 0.8.9` + GitHub releases (axum-v0.8.9, Apr 2026; MSRV 1.80) — HIGH, cross-verified
- MDN "Using CSS custom properties" (updated 2026-08) — `:root` token scoping — HIGH
- OpenReplay "Creating a Theme Switcher with CSS Variables" (2026-05) — `data-theme` + `color-scheme` + storage-failure edge cases — HIGH
- StackPractices "Dark Mode with prefers-color-scheme and CSS Variables" (2026-07) — toggle + OS-change listener pattern — HIGH
- Project tree itself (`Cargo.toml`, `Cargo.lock`, `src/settings.rs` `SetupReq`, `src/web/operator.css`, `scripts/render_check.js` header) — integration points grounded, not assumed — HIGH
- `rust-embed`-vs-`include_str!` judgment — project-scale reasoning, no authoritative source — MEDIUM

---
*Stack research for: OPENPROXY v1 Rebrand & Dual-Theme Console (new-features delta only)*
*Researched: 2026-09-04*
