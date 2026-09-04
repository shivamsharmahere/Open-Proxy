# Feature Research

**Domain:** Dual-theme console + provider-neutral copy + multi-provider first-setup wizard for OPENPROXY (Rust + embedded HTML/CSS/JS operator console)
**Researched:** 2026-09-04
**Confidence:** MEDIUM (cross-checked web sources; project specifics from PROJECT.md)

## Feature Landscape

Scope note: this milestone adds to an existing app. Already built (out of scope for research): multi-upstream endpoint groups, model routing, global model toggles, merged catalog, dark console, OPENPROXY brand, Docker packaging. Everything below is ONLY what the three new features need.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Theme toggle with remembered choice, OS default | Every dual-theme product in 2026 offers explicit light/dark control that defaults to `prefers-color-scheme`; OS-only with no toggle was explicitly rejected by the user | MEDIUM | Three-state (light/dark/system) persisted in `localStorage`. Explicit choice always wins over OS; listen for OS changes only while on `system`. Constraint: CSP forbids inline scripts, so the pre-paint bootstrap must live in an existing external JS file, not an inline `<script>`. Also update `theme-color` meta on toggle |
| No-flash theme boot | Users notice a white/black flash on load when the saved theme differs from the OS default; standard expectation is zero flash | LOW | Set `color-scheme` on `:root`/`html` (not `body`) so scrollbars, form controls, and canvas match. Run the stored-theme bootstrap synchronously before first paint. CSS defaults to system preference so a JS failure still renders sanely |
| Semantic token layer for both themes | Without it, every themed component becomes per-theme overrides and the second theme rots; industry pattern is primitives + semantics, components reference semantics only | MEDIUM | Extend existing `:root` tokens in `operator.css`/`public.css` with a `[data-theme]` override block. Rewrite any hardcoded hex in component CSS to semantic refs. Dark-mode specifics: stronger shadows, more prominent borders, brighter status colors, dimmed icons. Lint (grep or stylelint) against hardcoded hex outside the token block |
| Per-provider key entry with Test Connection | Users expect each pasted key to be verified before they move on, not to discover a dead key at first proxied call | MEDIUM | Masked input with reveal toggle, trim-on-submit, light format check, then a lightweight provider ping (e.g. list-models) with success checkmark or actionable error. "Could not verify, continue anyway?" escape hatch for network failures. Depends on: `SetupReq`/API change + existing `/api/settings/upstreams` post-setup path |
| Repeatable provider block (add-another-provider) in the wizard | The reported gap is "only NVIDIA at setup"; users adding multiple API providers at signup expect to repeat the same key block per provider, not one fixed vendor slot | MEDIUM | Loop/repeat wizard step: select provider, enter key, verify, repeat. At least one valid provider gates Finish; extra providers skippable. Depends on: `SetupReq` accepting extra groups + keys (settings.rs `POST /setup` change) |
| Provider-neutral copy on wizard, login, dashboard, fixtures | Users pointed at any OpenAI-compatible endpoint are confused by NIM-only wording; neutral copy is the whole rebrand promise of this milestone | LOW | Sweep `src/web/locales/en-US.json` (no em-dashes per taste skill), keep sha256(en)[:8] freshness hashes green via `scripts/check_i18n.py`, regenerate `tests/fixtures/locales/public-en-US.json` via `locale_v1.py --update-public`, update render/screenshot fixtures. Generic labels: provider, base URL, API key |
| Wizard progress + review-before-finish | Users expect to know where they are (step X of N), go Back without losing data, and confirm a summary before committing credentials | LOW | Persistent step list with current/complete/disabled states, per-step validation gating Next, Back preserves data without revalidating, final review screen summarizing providers + keys (masked) + what happens next. Depends on: existing `setup.html`/`setup.js` structure; no DOM ids/classes removed (e2e gate) |
| Masked secret input with reveal + no-persist-on-failure | Standard secret hygiene every key-entry UI offers; plaintext-by-default keys erode trust | LOW | `type=password` with show/hide toggle, `autocomplete=off`, never echo full key back after save (mask or drop from review). Client-side only concern, no storage-format change allowed |
| Signup-to-first-call verification in both themes | The milestone's core value is "first-time user makes a successful proxied call understanding every screen"; shipping without proving it in both themes leaves the milestone unverified | MEDIUM | Headless signup, setup, dashboard, first proxied call matrix: {dark, light} x {single provider, multi-provider}. Reuses existing proof gates (`cargo test`, `render_check.js`, screenshots, rebuilt image). This is verification work, not new UI |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Orange-on-black dark + creamy light brand themes | Gives OPENPROXY a distinct identity versus generic slate/cyan admin consoles; user explicitly chose this palette | LOW | Accent swap inside the token system, not a parallel stylesheet. Keep contrast-checked text pairs per theme; orange needs a darker text-on-accent in light mode and a brighter variant on black |
| First proxied call as the wizard's ah-ha moment | Most gateway wizards end at "saved!"; ending at a live verified call proves value in-session and collapses setup + smoke test into one flow | MEDIUM | Final wizard step (or immediate post-wizard dashboard state) performs one real proxied call and shows the result. Enhances the review-before-finish table-stakes item. Watch scope: read-only cheap model call, no billing surface |
| Skip-to-dashboard / expert mode | Returning operators re-running setup resent a forced wizard; a visible skip keeps single-shot Docker evaluators happy | LOW | Offer "Skip to dashboard" when config already exists (auto-detect existing setup, offer reconfigure vs new). Do NOT make skip so prominent that new users bypass configuration into an empty product (the documented skip-friendly-empty failure) |
| Inline per-provider key help (where-to-get-key links) | Users constantly leave wizards to hunt for key consoles and lose flow; provider-specific "create key" links plus cost hints keep them in-flow | LOW | Self-contained step help: link out to each provider's key page, one-line cost hint per provider. Copy lives in the i18n catalog like all other strings |
| Draft persistence across refresh/close during setup | A pasted key lost to an accidental refresh is infuriating; per-step persistence makes the wizard resumable | LOW | Persist completed-step data as the user advances (server-side setup state preferred so any browser resumes; never persist raw keys in `localStorage`). Constraint: no storage-format changes, so fit within existing config/auth store |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| OS-only theming with no toggle | Less UI to build | User explicitly rejected it; also strands users whose OS setting differs from their preference for this console | Three-state toggle defaulting to OS, as decided |
| Separate light.css / dark.css stylesheets | Feels like clean separation | Duplicated component styles drift; every fix ships twice; token grep audits fail | Single stylesheet, one semantic-token override block under `[data-theme]` |
| Validating the key against the provider on every keystroke | Feels responsive | Spams provider APIs, leaks key prefixes, rate-limit risk on a rate-limit product | Validate on explicit Test/Next action only |
| Storing theme preference server-side per operator | Feels consistent across devices | Console has no per-user profile store in scope; adds API + storage migration for zero milestone value; multi-operator machines would fight over one value | `localStorage` per browser, the documented standard |
| 12-step feature-tour wizard | Feels thorough | Tutorial overload: users skip or abandon before the ah-ha moment; 3-5 steps max is the documented norm | 3-4 steps (providers, keys, review/verify, done) + deferred advanced settings to the dashboard |
| New providers, protocols, locales, or billing UI in this milestone | "While we're in setup anyway" | Explicitly out of scope; each drags catalog, protocol, or product-requirement changes the milestone forbids | OpenAI-compatible surface only, en-US only, no billing; log as future milestone candidates |
| Auto-detecting theme from time of day | Feels clever | Fights both OS setting and explicit choice; unpredictable; no ecosystem precedent | OS default + explicit toggle only |

## Feature Dependencies

```
[Multi-provider wizard UI (setup.html/setup.js)]
    └──requires──> [SetupReq + POST /setup multi-group support (settings.rs)]
                       └──requires──> [Existing single-NVIDIA setup + /api/settings/upstreams post-setup path]

[Theme toggle (JS + toggle control)]
    └──requires──> [Semantic token layer in operator.css / public.css]
                       └──requires──> [color-scheme on :root + pre-paint external bootstrap JS (CSP-safe)]

[Orange dark + creamy light values]
    └──enhances──> [Semantic token layer] (accent swap only, no structural dependency)

[Provider-neutral copy (wizard + login + dashboard)]
    └──requires──> [en-US.json catalog + hash/fixture regeneration pipeline]
                       └──requires──> [render_check + screenshot fixtures updated]

[First-proxied-call verification step]
    └──requires──> [Multi-provider wizard UI] + [Review-before-finish]
    └──requires──> [At least one verified provider key]

[Draft persistence / resume]
    └──requires──> [Multi-provider wizard UI]
    └──conflicts──> [No storage-format changes] (must fit existing config/auth store)
```

### Dependency Notes

- **Wizard UI requires SetupReq/API change:** the frontend loop-block is useless without the backend accepting extra groups + keys in one claim. Backend first, or both behind the same phase; never UI-only.
- **Toggle requires token layer first:** wiring a toggle against hardcoded colors produces a half-themed console. Token refactor lands before (or with) the toggle, never after.
- **Copy sweep requires fixture regeneration:** catalog edits without hash + public-fixture + render-fixture updates break `check_i18n.py`, locale-v1, and `render_check.js`. One atomic unit.
- **Verification requires everything above:** the signup-to-first-call matrix in both themes is the milestone exit gate, so it sits last in phase order.
- **Draft persistence conflicts with the no-storage-change constraint:** only attempt within existing store shapes; if it does not fit, cut it before touching formats.

## MVP Definition

This is a bounded brownfield milestone, not a v1 product: "MVP" here means the shippable milestone slice in phase order.

### Launch With (milestone exit)

Minimum for the milestone goal (rebranded copy, dual theme, multi-provider setup, verified end to end).

- [ ] Provider-neutral copy sweep incl. hashes + public fixtures + render fixtures — the rebrand promise; breaks three gates if split
- [ ] Semantic token layer + orange dark + creamy light values — toggle is decoration without it
- [ ] Theme toggle (light/dark/system, remembered, OS default, no-flash, CSP-safe bootstrap) — explicit user requirement
- [ ] Multi-provider wizard (repeatable provider block + per-key Test Connection + review screen) with SetupReq/API support — fixes the reported gap at its root
- [ ] Signup-to-first-call verification in both themes + screenshots + rebuilt image — milestone proof

### Add After Validation (follow-up)

Features to add once the milestone core proves green.

- [ ] Skip-to-dashboard / expert mode — trigger: returning-operator friction reports
- [ ] Draft persistence / resume — trigger: wizard-abandonment evidence; only if it fits existing store shapes
- [ ] Inline per-provider key help + cost hints — trigger: support questions about where keys come from

### Future Consideration (later milestones)

Features to defer; each violates current out-of-scope bounds.

- [ ] New providers or non-OpenAI protocols — why defer: no backend need in this milestone, protocol surface frozen
- [ ] Additional locales — why defer: catalog system unchanged, en-US only
- [ ] Pricing/billing UI — why defer: no product requirement
- [ ] First-call-as-wizard-step (live call inside the wizard proper) — why defer: needs design care to avoid scope creep into billing/quota UX; dashboard-level verification covers the milestone

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Provider-neutral copy + fixtures | HIGH (core rebrand promise) | LOW | P1 |
| Semantic token layer | HIGH (unlocks everything themed) | MEDIUM | P1 |
| Theme toggle + persistence + OS default + no-flash | HIGH (explicit user choice) | MEDIUM | P1 |
| Multi-provider wizard + SetupReq/API | HIGH (fixes reported gap) | MEDIUM | P1 |
| Per-key Test Connection | HIGH (prevents dead-key setups) | MEDIUM | P1 |
| Progress + review-before-finish | MEDIUM (expected wizard chrome) | LOW | P1 |
| Masked key input + reveal | MEDIUM (table-stakes trust) | LOW | P1 |
| Both-theme e2e verification + screenshots | HIGH (milestone exit proof) | MEDIUM | P1 |
| Orange/cream brand values | MEDIUM (identity, user-chosen) | LOW | P2 |
| Skip/expert mode | MEDIUM (returning operators) | LOW | P2 |
| Draft persistence / resume | MEDIUM (abandonment safety) | LOW | P2 |
| Inline per-provider key help | MEDIUM (reduces flow exits) | LOW | P2 |
| In-wizard live first call | MEDIUM (ah-ha moment) | MEDIUM | P3 |
| New providers/protocols/locales/billing | LOW for this milestone | HIGH (scope breach) | P3 (defer) |

**Priority key:**
- P1: Must have for milestone exit
- P2: Should have, add when core is green
- P3: Nice to have, future milestone

## Competitor Feature Analysis

| Feature | Typical ecosystem pattern | OPENPROXY constraint | Our Approach |
|---------|--------------------------|----------------------|--------------|
| Theme toggle | light/dark/system, localStorage, pre-paint bootstrap, `color-scheme` on root | CSP bans inline scripts; dark-only `:root` tokens today | Three-state toggle; bootstrap in existing external JS; extend current token files |
| Token system | Primitives + semantics, `[data-theme]` override, components use semantics only | Tokens exist but dark-only with hardcoded values possible | Refactor to semantic layer first, then accent swap |
| Provider onboarding | Select provider, paste key, Test Connection, review, finish; 3-5 steps | Wizard handles one NVIDIA group; extras post-setup only | Repeatable provider block; SetupReq accepts N groups + keys; keep 3-4 steps |
| Neutral copy | Generic provider/base-URL/key labels; self-contained inline help | NIM wording in catalog + fixtures + hashes enforced | Catalog sweep with hash/fixture regeneration as one atomic unit |
| Setup verification | Inline Test Connection per credential; summary artifact of what was configured | Proof gates: cargo test, render_check, i18n validators, screenshots | Per-key ping in wizard + full signup-to-first-call matrix in both themes |

## Sources

- Chrome modern-web guidance, dark-mode guide (color-scheme on root, light-dark(), toggle with localStorage, pre-paint inline-script FOUC guard) — MEDIUM (verified across MDN + theming articles)
- MDN `light-dark()` reference (color-scheme: light dark enabling adaptive tokens) — MEDIUM (cross-checked with Chrome guide)
- CSS-theming pattern articles (primitive/semantic split, `[data-theme]` override, semantic-only components, lint hardcoded hex) — MEDIUM (multiple independent sources agree)
- NNGroup wizard guidelines (prescribed order, progress, no future-step skipping, save/resume, reuse prior selections) — MEDIUM (long-standing primary UX source)
- Wizard UX pattern guides (per-step validation gating, Back preserves data, draft persistence, review step, stale-dependent recompute, focus management) — MEDIUM (multiple sources agree)
- Multi-provider wizard implementations: ProviderWizard (select, keys, models, confirm), Blink LLM keys setup (provider, open key page, paste key), Oboto setup-wizard design (per-provider key env mapping, Test Connection, persist-per-step, resume) — MEDIUM (convergent implementations)
- SaaS onboarding research (wizard vs checklist, 3-5 step cap, skip-friction balance, 4-item checklist completion data) — LOW (single-source claims, directionally consistent)
- PROJECT.md milestone context (existing features, constraints, decisions, proof gates) — project ground truth for scoping

---
*Feature research for: OPENPROXY dual-theme + provider-neutral copy + multi-provider setup wizard*
*Researched: 2026-09-04*
