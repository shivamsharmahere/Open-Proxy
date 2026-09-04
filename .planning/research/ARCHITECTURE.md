# Architecture Research: Dual-Theme Console + Provider-Neutral Copy + Multi-Provider Setup

**Domain:** Brownfield Rust binary (OPENPROXY/nim-proxy) with compile-time embedded operator console
**Researched:** 2026-09-04
**Confidence:** HIGH (findings verified against `src/settings.rs`, `src/presentation.rs`, `src/lib.rs` CSP, `src/config.rs`, `src/web/*`)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation layer (embedded)                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ public pages │  │ operator con │  │ locale catalogs        │  │
│  │ setup/login  │  │ dashboard +  │  │ en-US.json (authoring) │  │
│  │ public.css   │  │ settings     │  │ operator/public wire   │  │
│  │ setup/login  │  │ operator.css │  │ projections            │  │
│  │ .js          │  │ shared/set-  │  │                        │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘  │
│         │                 │                      │               │
├─────────┴─────────────────┴──────────────────────┴───────────────┤
│                     HTTP layer (axum, same-origin)               │
│  GET /setup · POST /setup · POST /setup/validate-key            │
│  /api/config · /api/settings/upstreams · /api/settings/nim-keys │
│  /assets/public/* · /assets/operator/* · /assets/*/locales/*    │
│  CSP: default-src 'none'; style-src 'self'; script-src 'self'   │
├─────────────────────────────────────────────────────────────────┤
│                  Store layer (single writer pipeline)           │
│  StoredConfig (users · upstream/nim_keys · upstreams[] ·        │
│    client_auth · limits · history · dashboard)                  │
│  commit(): build candidate → validate → persist → swap runtime  │
│    snapshot → rebuild pool (rate-state carryover) → side effects│
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation (here) |
|-----------|----------------|-------------------------------|
| `presentation.rs` | Compile-time asset embedding (`include_str!`/`include_bytes!`), operator vs public catalog projection, page assembly | Add NO new routes if possible; extend existing CSS/JS files |
| `lib.rs` security headers | CSP (`script-src 'self'`, no inline exceptions), `no-store` on presentation paths | Theme bootstrap MUST live in existing external JS, never inline |
| Token stylesheets | All color flows through `:root` custom properties (`operator.css`, `public.css`) | Theme = token override set, not a second stylesheet |
| `settings.rs` setup flow | Atomic first-run claim: superuser + keys + optional client key + session cookie | Extend `SetupReq`, keep atomic claim semantics |
| `config.rs` groups | Primary `nvidia` group (`upstream`) + `upstreams: Vec<UpstreamEndpoint>`; `key_groups_mut()` / `group_keys_mut()` span groups | Setup writes through the same group helpers, not new storage |
| Catalog pipeline | Authoring `en-US.json` → wire projections → `check_i18n.py` hashes → `locale_v1.py --update-public` + fixture | Every new user-visible string needs a catalog id first |

## Recommended Project Structure

No new top-level structure. All work lands in existing files:

```
src/
├── settings.rs          # EXTEND SetupReq + setup_submit + setup_validate_key
├── presentation.rs      # TOUCH ONLY if a new asset file is added (avoid)
├── lib.rs               # UNCHANGED (CSP already permits the plan)
├── config.rs            # UNCHANGED (group model already supports the plan)
└── web/
    ├── operator.css     # EXTEND : token overrides for [data-theme="light"]
    ├── public.css       # EXTEND : same, smaller token set
    ├── shared.js        # EXTEND : theme init/apply/toggle for operator console
    ├── setup.js         # EXTEND : theme init + grouped key model + payload
    ├── login.js         # EXTEND : theme init only
    ├── dashboard.html   # MODIFY  : theme toggle button in .tright
    ├── setup.html       # MODIFY  : toggle + per-group wizard markup
    ├── login.html       # MODIFY  : toggle markup
    └── locales/en-US.json  # EXTEND : new ids for theme + multi-group copy
```

### Structure Rationale

- **No new asset files:** each new `.css`/`.js` file requires a new match arm in `public_asset()`/`operator_asset()`, a new route serving path, and updates to render/e2e gates. Extending the existing two stylesheets and three scripts avoids all of that.
- **`config.rs` unchanged:** `UpstreamEndpoint { name, base_url, enabled, keys, models }` plus `group_keys_mut(name)` already express "extra groups + keys". The setup handler just needs to accept more of them, not a new store shape (PROJECT.md compatibility constraint: no storage format changes).
- **`lib.rs` unchanged:** CSP `script-src 'self'` already allows external-file theme logic. The constraint is negative: do NOT add inline `<script>` or `style=` theme bootstraps to fix FOUC; use the external files plus the existing `body[hidden]`-until-ready pattern.

## Architectural Patterns

### Pattern 1: Token-override dual theme via `[data-theme]` + OS default + localStorage memory

**What:** Keep every component reading `var(--accent)`, `var(--bg)`, `var(--ink-*)`, etc. Define the dark orange-on-black palette as the new `:root` defaults, and add a single override block `:root[data-theme="light"]` (set the attribute on `<html>`) with the creamy-light values. `color-scheme` flips with the theme (`dark` default, `light` under the override) so form controls, scrollbars, and `datetime-local` follow.

**When to use:** This is the recommended approach here because both stylesheets are already fully tokenized — `operator.css` has ~20 tokens, `public.css` has 8. A token override is a ~40-line diff per file, touches zero component rules, and automatically themes every card, table, chart chrome, and settings control.

**Trade-offs:** Pro: minimal diff, no per-component rework, screenshots diff cleanly. Con: hardcoded non-token colors in JS/SVG (see Pitfall 1) must be fixed separately; they will not follow the override.

**Example:**

```css
/* operator.css — dark (default) becomes orange-on-black */
:root {
  --bg: #0A0908; --side: #100D0B; /* near-black, warm */
  --accent: #E06C1F;              /* burnt orange, was #22D3EE cyan */
  --accent-lt: #F5B47A; --accent-dk: #9A4A12;
  --focus-ring: rgba(224,108,31,0.55);
  color-scheme: dark;
}
/* creamy light override — one block, same token names */
:root[data-theme="light"] {
  --bg: #FAF6EE; --side: #F3EDE0; --side-border: #E2D7C0;
  --card: rgba(90,70,40,0.05); --card-border: rgba(90,70,40,0.16);
  --ink-1: #221A10; --ink-2: #4A3E2E; --ink-25: #6E5F4B; --ink-3: #8A7961;
  --accent: #B4530A; --accent-lt: #8A3E06; --accent-dk: #D97B2B;
  color-scheme: light;
}
```

```js
// shared.js / setup.js / login.js — identical ~20-line snippet, CSP-safe
const THEME_KEY = "openproxy.theme"; // "dark" | "light" | absent = OS
function resolveTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch { /* private mode: fall through to OS */ }
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
function applyTheme(t) { document.documentElement.dataset.theme = t; }
applyTheme(resolveTheme()); // runs before body unhide → no FOUC
```

### Pattern 2: Theme toggle as a catalog-labeled topbar control bound to the same snippet

**What:** One `<button>` in the dashboard `.tright` (next to range pills) and one in the setup/login cards, labeled via `data-i18n` (e.g. `dashboard.topbar.theme.toggle`, `aria-label` + visible sun/moon glyph swapped in JS). Click cycles dark→light, writes `localStorage`, calls `applyTheme`, and re-renders charts (chart colors are read once via `css('--var')` at render time, so a re-render picks up the new tokens).

**When to use:** Always for this milestone — PROJECT.md requires an explicit remembered toggle defaulting to OS. Putting it in `.tright` reuses an existing flex-wrap container (no layout work); on setup/login it must be visible pre-claim so first-run screenshots can show both themes.

**Trade-offs:** Pro: single interaction pattern across three pages; e2e can assert `documentElement.dataset.theme` + `localStorage`. Con: three pages × same snippet = triplication; accept it (small, CSP forces external-file-only, and a shared import would need a new asset route).

### Pattern 3: Multi-provider setup as "grouped SetupReq" reusing the post-setup group API

**What:** Extend `SetupReq` with an additive optional field while keeping every existing field working:

```rust
#[derive(Deserialize, ToSchema)]
pub struct SetupUpstream {
    name: String,            // group id; "nvidia" = primary
    #[serde(default)]
    base_url: Option<String>,
    #[serde(default)]
    keys: Vec<SetupKey>,     // { key, rpm }
}
// SetupReq gains:
#[serde(default)]
upstreams: Vec<SetupUpstream>,
```

`setup_submit` keeps its exact pipeline (password check → PBKDF2 → lock → clone candidate → mutate → `commit()`), but after applying the legacy `base_url`/`nim_keys` fields it folds each `upstreams[]` entry through the SAME logic the authenticated `POST /api/settings/upstreams` (add) + `nim_keys` (add) handlers use: create-or-find group by name, push trimmed keys with `rpm.unwrap_or(40)` and `owner = username`, trim trailing `/` on URLs. `commit()` validation (`config::validate`) then enforces name charset, reserved `nvidia`, URL policy, and pool-floor invariants with zero new validator code. Unknown group names in the wizard auto-create the group (mirrors the dashboard "add group then add keys" flow collapsed into one claim).

**When to use:** This shape is required by the "no storage change" constraint — the wire payload changes, the store does not.

**Trade-offs:** Pro: backward compatible (old wizard payloads still claim; `#[serde(default)]` on the new field), OpenAPI stays additive, e2e for single-key setup keeps passing. Con: the handler grows one loop; keep it a straight-line fold, not a second commit path — there is still exactly one `commit()` call per claim.

### Pattern 4: Catalog-first copy (no hardcoded strings, public projection aware)

**What:** Every new or reworded user-visible string (theme toggle, "provider" replacing "NIM", per-group wizard labels, review rows) gets a catalog id in `src/web/locales/en-US.json` FIRST; HTML uses `data-i18n`/`data-i18n-attr`, JS uses `setMessageText`/`message()`. Then regenerate: `scripts/check_i18n.py` hashes + `locale_v1.py --update-public` + `tests/fixtures/locales/public-en-US.json`.

**When to use:** Mandatory here — the i18n gates fail the build on stale hashes, and `presentation.rs` splits catalogs by prefix: `setup.*`/`login.*` ids flow to the PUBLIC wire catalog (pre-auth wizard), `dashboard.*` ids stay OPERATOR-only. Theme-toggle strings on setup/login MUST use `setup.*`/`login.*` prefixes; dashboard toggle strings MUST use `dashboard.*`.

**Trade-offs:** Pro: gates stay green, no new plumbing. Con: copy sweep touches many ids at once — batch the catalog edit as its own commit before the theme/setup work so hash churn is isolated.

## Data Flow

### Request Flow

```
[Wizard step 2: per-group key lists + per-group base URLs]
    ↓ (setup.js groups[] state; validate-key per group base_url)
[POST /setup { username, password, base_url?, nim_keys[]?, upstreams[]?, create_client_key? }]
    ↓ (settings.rs setup_submit: one atomic claim)
[StoredConfig candidate → config::validate → persist → swap runtime → rebuild pool]
    ↓
[SetupResponse + session cookie] → [step 4 connect screen] → [GET / dashboard]
```

```
[Theme toggle click / first paint]
    ↓ (external JS only — CSP forbids inline)
[resolveTheme(): localStorage → matchMedia OS → default dark]
    ↓
[documentElement.dataset.theme] → [CSS token override] → [charts re-render via css('--var')]
```

### State Management

```
[localStorage "openproxy.theme"] ←→ [resolveTheme/applyTheme in shared|setup|login.js]
        ↓ (absent = follow OS via matchMedia; stored value wins)
[documentElement[data-theme]] → [all component styles] (no per-component state)
```

Setup wizard state stays exactly as today (`keys[]` array + step navigation) but nested one level: `groups[] = [{ name, base_url, keys[] }]`, with the legacy single-group view rendered as `groups[0]` (name `nvidia`) so the existing step/review/submit code paths are preserved and extended, not rewritten.

### Key Data Flows

1. **First-claim with extra providers:** wizard collects N groups → one `POST /setup` → one `commit()` → pool contains all groups' lanes at first boot. No second request, no half-configured state (fail-closed invariant preserved).
2. **Pre-claim key probing per group:** `POST /setup/validate-key { key, base_url }` is called with each group's URL (current handler already accepts per-call `base_url`; the wizard just passes different values per group row). The `upstream:` field continues to be rejected pre-claim (no groups exist yet) — no handler change needed unless the milestone wants group-name echo, which it should NOT add.
3. **Theme persistence:** toggle writes `localStorage` only — never the server store, never a cookie, never `StoredConfig`. No backend change, no locale change, no metric change.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single binary, 1 locale) | No scaling work. Token override + grouped SetupReq are constant-cost. |
| Many endpoint groups at setup | Wizard groups list is DOM-cheap (<20 rows); `setup_submit` loop is O(groups × keys) under one mutex hold — fine. Cap wizard groups at ~10 in UI copy to keep review readable. |
| Future locales | Theme/copy work is locale-neutral (ids, not text). Adding a locale = one `InstalledLocale` + catalog, untouched by this milestone. |

### Scaling Priorities

1. **First bottleneck:** none introduced. Theme is pure CSS + localStorage; setup payload grows by bytes.
2. **Second bottleneck:** `render_check.js` screenshot matrix doubles (2 themes × pages) — headless Chrome time, not architecture. Keep the gate to dashboard + setup + login at two viewports.

## Anti-Patterns

### Anti-Pattern 1: Hardcoded chart/SVG colors that ignore theme tokens

**What people do:** Leave `RAMP`, `MED`/`P95`, `PUBLISHERS` colors, `gGreen`/`gMuted` gradients, ring-gauge `rgba(255,255,255,0.08)` tracks, and `rowKey`-adjacent `css('--hairline')` gridlines as-is because "CSS handles theming".
**Why it's wrong:** `shared.js` reads some values from tokens (`css('--hairline')`, `css('--bg')`) but heatmap ramps, publisher brand chips, and SVG gradients are literals — they will glow cyan/green on the orange theme and wash out on creamy light.
**Do this instead:** Centralize a `themeColors()` helper in `shared.js` reading `data-theme` (dark ramp vs light ramp, track stroke, gridline), and keep publisher brand colors as-is (data, never localized/restyled — AGENTS.md invariant 5) while fixing only chrome colors.

### Anti-Pattern 2: Inline theme-bootstrap `<script>` to beat FOUC

**What people do:** Add `<script>try{...}documentElement.dataset.theme=...</script>` in `<head>` for pre-paint theming.
**Why it's wrong:** CSP is `script-src 'self'` with no inline exceptions (`lib.rs`); the render/e2e gates assert this. An inline script breaks every page load under the enforced policy.
**Do this instead:** Run the snippet at the top of the existing external files (`shared.js`/`setup.js`/`login.js`) and keep `body[hidden]` until catalog+theme ready — the current anti-FOUC mechanism already hides unstyled paint.

### Anti-Pattern 3: A second `commit()` path or new store shape for wizard groups

**What people do:** Add `StoredConfig.setup_upstreams` or a separate "wizard groups" table, or commit primary keys first and extra groups second.
**Why it's wrong:** Breaks the "no storage format change" constraint; two commits break atomic-claim (a crash between them leaves half-configured state, violating fail-closed invariant 1); new validators duplicate `config::validate`.
**Do this instead:** Fold wizard groups into the existing `upstream` + `upstreams` fields inside the single existing candidate, then one `commit()`.

### Anti-Pattern 4: New copy as hardcoded English in HTML/JS

**What people do:** Write "Provider", "Toggle theme", group labels directly in markup to move fast during the copy sweep.
**Why it's wrong:** `check_i18n.py` freshness hashes + `locale_v1` public-projection tests fail; pre-auth strings outside `setup.*`/`login.*` never reach the wizard (wrong wire catalog).
**Do this instead:** Catalog id first, `data-i18n`/`message()` second, regenerate hashes/fixtures third — per string.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Upstream provider APIs at setup | Per-group `POST /setup/validate-key { key, base_url }` probes (existing endpoint, called once per key with its group's URL) | No handler change; throttle + 500ms delay already apply. Do not add group-name params pre-claim. |
| Headless Chrome (`render_check.js`) + screenshots | Extend matrix: each page × `{dark, light}` via `?theme`-forcing or localStorage seed + `prefers-color-scheme` emulation | Pin fallback hue `#5A6150` probe value stays exact (render gate asserts it). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `setup.js` ↔ `POST /setup` | JSON body gains additive `upstreams[]`; legacy fields still sent for compat | NEW field, MODIFIED submit mapper; OpenAPI (`ToSchema`) regenerates — update `scripts/check_openapi` snapshot if present. |
| `setup.js` ↔ `NoScriptSetupForm` | Native form stays single-key primary-group projection | MODIFIED only if trivial; acceptable to leave noscript as primary-group-only with a hint (document the limitation). |
| `setup.html` step 2 ↔ `setup.js` | `keys[]` becomes `groups[]`; review step gains per-group rows | MODIFIED markup; DOM ids/classes MUST NOT be removed (e2e constraint) — only add. |
| `operator.css` / `public.css` ↔ all pages | `:root` defaults (orange dark) + `[data-theme="light"]` override | MODIFIED stylesheets only; no new files, no route changes. |
| `dashboard.html` `.tright` ↔ `shared.js` | New toggle button → `applyTheme` + chart re-render | NEW button (additive id, e.g. `themetoggle`); existing pills untouched. |
| `en-US.json` ↔ `presentation.rs` catalogs | New ids: `dashboard.topbar.theme.*`, `setup.step2.group.*`, reworded provider-neutral copy | Prefix discipline decides wire catalog routing (`setup.*`→public). Regenerate hashes + public fixture in the same commit. |
| `POST /api/settings/upstreams` ↔ wizard | No runtime link — wizard folds into `POST /setup`; post-setup editing unchanged | Explicitly NOT modified; reuse its validation semantics by sharing `config::validate`. |

## Suggested Build Order (dependency-aware)

1. **Copy-sweep foundation (catalog first).** Reword `en-US.json` to provider-neutral, add ALL new ids (theme + multi-group) in one pass, regenerate hashes + public fixture. Unblocks everything; isolates hash churn. (No code deps.)
2. **Theme token system.** `operator.css` + `public.css` `:root` orange-dark defaults + light overrides + `color-scheme` flip. Pure CSS, verifiable by screenshots before any JS lands. (Depends on 1 for toggle labels, but CSS itself is independent — can parallelize.)
3. **Theme toggle + memory.** Snippet in `shared.js`/`setup.js`/`login.js` + buttons in three HTML files + chart chrome fix in `shared.js`. (Depends on 2 for tokens; reuses `body[hidden]` pattern.)
4. **`SetupReq` backend extension.** `SetupUpstream` struct + `setup_submit` fold + utoipa schema + lib/e2e tests for multi-group claim, backward-compat single-group claim, and atomic-failure cases. (Depends on 1 for any new error copy; independent of 2–3 — can parallelize with them.)
5. **Wizard multi-group UI.** `setup.html` group sections + `setup.js` `groups[]` state + per-group validate + review rows + submit mapper. (Depends on 4 for the payload contract; reuse existing step/error patterns.)
6. **Verification pass.** `cargo test`, i18n + locale-v1 validators, `render_check.js` both themes, full signup→setup→dashboard→first-call in both themes + screenshots + image rebuild. (Depends on 1–5.)

## Sources

- `src/settings.rs` — `SetupReq`/`SetupKey`/`NoScriptSetupForm`, `setup_submit` atomic claim, `setup_validate_key` pre-claim rules, `upstreams`/`nim_keys` group semantics (HIGH — source of truth)
- `src/presentation.rs` — embedded assets, operator/public catalog split by id prefix, page assembly (HIGH — source of truth)
- `src/lib.rs` `security_headers` — CSP `script-src 'self'`, no inline exceptions (HIGH — source of truth)
- `src/config.rs` — `UpstreamEndpoint`, `PRIMARY_UPSTREAM`, `key_groups_mut`/`group_keys_mut`, validation rules (HIGH — source of truth)
- `src/web/setup.js` + `setup.html` — wizard steps, `keys[]` model, validate/submit flow, `body[hidden]` gate (HIGH — source of truth)
- `src/web/shared.js` — catalog bootstrap, `css('--var')` token reads, hardcoded `RAMP`/publisher colors (HIGH — source of truth)
- `src/web/operator.css` + `public.css` — `:root` token sets, `color-scheme: dark` (HIGH — source of truth)
- `.planning/PROJECT.md` — milestone scope, constraints (CSP external-scripts-only, no DOM id removal, no storage changes), env quirk (HIGH — project context)

---
*Architecture research for: OPENPROXY v1 Rebrand & Dual-Theme Console (new-features only)*
*Researched: 2026-09-04*
