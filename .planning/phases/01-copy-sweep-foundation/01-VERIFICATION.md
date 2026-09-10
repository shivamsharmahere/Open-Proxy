---
phase: 01-copy-sweep-foundation
verified: 2026-09-05T00:00:00Z
status: passed
score: 3/3 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 1: Copy-Sweep Foundation Verification Report

**Phase Goal:** Every screen reads provider-neutral with green i18n gates
**Verified:** 2026-09-05
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | First-time setup wizard never names NVIDIA-only key flows; all steps use generic API-key + provider-group wording | ✓ VERIFIED | `rg -i nvidia\|NIM` over src/web/setup.html + setup.js: zero user-visible NVIDIA-only key-flow strings. Stepper "Add API keys", hint "API keys are shared across clients. The default rate limit is 40 requests/min per key." Tracer: catalog en → setup.html:48 `data-i18n` fallback → hand-recomputed `sha256(en)[:8]` = `897d7ac3` = stored hash (recomputed live this run). Remaining `nvidia` tokens are data defaults only (placeholder/default base URL `https://integrate.api.nvidia.com`, default group name `'nvidia'`), not key-flow naming. |
| 2 | Dashboard and settings screens show no NIM-specific strings that contradict multi-provider reality | ✓ VERIFIED | `rg NIM` over dashboard.html/login.html/setup.html/setup.js/dashboard-side sources, filtered: zero genuine residuals. Survivors classify clean: (a) frozen catalog ids (`settings.users.nim_key_count.*`, `settings.validation.nim_key_required` — identifiers frozen per repo invariant, must not move); (b) data pass-through (publisher/vendor `nvidia` brand entry in shared.js:907, default group name); (c) internal-only (comments, non-OpenAPI Rust doc comments, render_check mutation ids/paths/payload keys). No screen contradicts multi-provider reality. |
| 3 | `scripts/check_i18n.py` and `locale_v1 --all` pass with fresh `sha256(en)[:8]` hashes and regenerated public/render fixtures | ✓ VERIFIED | Spot-check this run: `python3 scripts/check_i18n.py` → "i18n OK — 480 ids referenced, round-trip clean". Hash freshness proven live: `setup.step2.hint` recomputed `897d7ac3` matches stored hash. Fixture carries identical swept values (public-en-US.json: "Open Proxy", "Add API keys", shared-hint verbatim). Remainder of proof stack per 01-02 SUMMARY (locale_v1 --all +19-case selftest, gen_pseudolocale --check 480 en-XA, cargo 228 lib + 124 e2e + 8 openapi, render_check triple, fmt clean) accepted as established evidence, not re-run per run instruction. |

**Score:** 3/3 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/web/locales/en-US.json` | Provider-neutral catalog, fresh hashes | ✓ VERIFIED | 480 ids, spot hash recompute matches, zero genuine NIM residuals in values |
| `tests/fixtures/locales/public-en-US.json` | Regenerated public projection | ✓ VERIFIED | Carries swept values verbatim ("Open Proxy", "Add API keys") |
| `src/web/setup.html` + `setup.js` | Generic API-key wizard wording | ✓ VERIFIED | data-i18n wiring intact, no NVIDIA-only flow naming |
| `scripts/check_i18n.py` gate | Green | ✓ VERIFIED | Re-run live this verification: OK |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| catalog en (`setup.step2.hint`) | setup.html:48 fallback + data-i18n | catalogMessage/data-i18n sink boundary | WIRED | Value identical across catalog → DOM fallback → public fixture; hash matches |
| catalog hashes | check_i18n gate | sha256(en)[:8] recompute-by-gate | WIRED | Gate green live; spot recompute matches |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| setup.html hint fallback | `setup.step2.hint` en | catalog en-US.json | Yes — verbatim swept copy, hash-matched | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| i18n gate green on swept tree | `python3 scripts/check_i18n.py` | "i18n OK — 480 ids referenced, round-trip clean" | ✓ PASS |

Full suite (cargo, locale_v1, gen_pseudolocale, render_check, fmt) accepted from 01-02 recorded verbatim proof; not re-run per instruction (single fast gate only).

### Probe Execution

No phase-declared probes. Skipped (not a migration/tooling phase).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| COPY-01 | 01-01 | Wizard copy provider-neutral | ✓ SATISFIED | Truth 1 |
| COPY-02 | 01-01 | Dashboard/settings sweep | ✓ SATISFIED | Truth 2 |
| COPY-03 | 01-01/01-02 | Hashes + fixtures + green gates | ✓ SATISFIED | Truth 3 + proof stack |

No orphaned requirements: REQUIREMENTS.md maps exactly COPY-01/02/03 to Phase 1, all claimed.

### Anti-Patterns Found

None. Zero phase-caused source modifications (audit + proof-only phase); no TODO/FIXME/placeholder/stub patterns introduced. Pre-existing over-budget `dashboard.capacity.ratelimit.heading` (26ch > 20ch) left unedited per minimal-churn — owned by Phase 4 screenshot backstop, not a Phase 1 gap.

### Out of Scope (Not Gaps)

Per ROADMAP/UI-SPEC phase boundaries: violet/graphite theme + product-mark recolor (Phase 2), multi-group wizard payload incl. `settings.dialog.remove_group` (Phase 3), screenshots + image rebuild + layout human review (Phase 4 backstop, not a Phase 1 gate). Frozen `nim_key`-family identifiers and `nimproxy_*` series stay per repo invariant 6.

### Human Verification Required

None. Layout-human-review is a Phase 4 backstop per UI-SPEC, not a Phase 1 gate; nothing in Phase 1 genuinely needs eyes.

### Gaps Summary

No gaps. All three Phase 1 success criteria are TRUE with live evidence (gate re-run + hash recompute + residual scans). Phase goal achieved. Ready for Phase 2.

---

_Verified: 2026-09-05_
_Verifier: the agent (gsd-verifier)_
