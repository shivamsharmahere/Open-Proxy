---
phase: 01-copy-sweep-foundation
plan: '01'
subsystem: ui
tags: [i18n, copy-sweep, provider-neutral, openproxy, catalog-hashes, pseudolocale]

# Dependency graph
requires: []
provides:
  - Gap-closed provider-neutral copy sweep verified end-to-end with green i18n gates
  - Residual-NIM classification (all remaining tokens classed a/b/c, zero genuine residuals)
  - Catalog-id freeze evidence (zero removals; additions belong to pre-existing multi-upstream work)
affects: [01-02 proof stack, phase-2 violet theme, phase-3 multi-group wizard]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 0    # audit-first: zero source edits; verification-only execution
  tasks: 3
  commits: 0   # no code changes required; SUMMARY committed with phase close-out

# Tech tracking
tech-stack:
  added: []
  patterns: [audit-first tracer on pre-existing uncommitted work, residual classification a/b/c/d]

key-files:
  created: [.planning/phases/01-copy-sweep-foundation/01-01-SUMMARY.md]
  modified: []

key-decisions:
  - "settings.rs:362/392 NIM doc comments classified internal-only (c) and left untouched — probe_key carries no utoipa path, fingerprint is a private fn; neither is OpenAPI-visible"
  - "render_check.js:6226 diagnostic plus mutation ids/paths/payload keys classified test-description/identifier and left untouched per plan scope guard"
  - "Zero source edits: the pre-existing sweep was already complete; audit discipline over blind redo"

requirements-completed: [COPY-01, COPY-02, COPY-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Setup wizard steps 1-4 read provider-neutral (generic API key wording, Add API keys stepper, 40-rpm hint and nvapi- placeholder intact)"
    requirement: "COPY-01"
    verification:
      - kind: other
        ref: "rg NIM|Nvidia scan over setup.html/setup.js + sha256(en)[:8] hand-recompute 897d7ac3 + check_i18n OK (480 ids)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dashboard and settings show no user-visible NIM-specific string contradicting multi-provider reality"
    requirement: "COPY-02"
    verification:
      - kind: other
        ref: "rg NIM|Nvidia scan over dashboard.html/login.html/dashboard.js/settings.js/shared.js — only comment/code-false-positives (c) and publisher pass-through (b)"
        status: pass
    human_judgment: false
  - id: D3
    description: "check_i18n (+121 selftest), locale_v1 --all (+19 selftest), gen_pseudolocale --check green with fresh hashes and regenerated public fixture"
    requirement: "COPY-03"
    verification:
      - kind: integration
        ref: "python3 scripts/check_i18n.py && python3 scripts/locale_v1.py --all && python3 scripts/gen_pseudolocale.py --check"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-09-05
status: complete
---

# Phase 1 Plan 1: Copy-Sweep Audit Summary

**Verify-first audit of the pre-existing provider-neutral copy sweep: full tracer chain proven (catalog → DOM → hash → fixture), all residual NIM tokens classified, zero genuine residuals, i18n gates green with no source edits**

## Performance

- **Duration:** 18 min
- **Started:** 2026-09-05T00:00:00Z
- **Completed:** 2026-09-05T00:18:00Z
- **Tasks:** 3 (1 tracer + 2 auto, all verification/closure)
- **Files modified:** 0 (audit confirmed the sweep already complete)

## Accomplishments

- Tracer chain proven for `setup.step2.hint`: catalog en "API keys are shared across clients. The default rate limit is 40 requests/min per key." → setup.html:48 fallback with intact `data-i18n="setup.step2.hint"` → hand-recomputed sha256(en)[:8] `897d7ac3` matches stored hash → public fixture carries the identical value (stepper "Add API keys", `nvapi-…` placeholder, 40-rpm fact all intact)
- Full residual scan classified: every remaining NIM token is (a) frozen catalog id (`nim_key_count`, `nim_key_required`), (b) data pass-through (`minimaxai` publisher entry, `nimproxy_*` series, model ids), or (c) internal-only (dashboard.js:548 comment, settings.rs:362/392 non-OpenAPI doc comments, render_check mutation ids/paths/payload keys + :6226 tool diagnostic). Zero category-(d) genuine residuals
- i18n gates green: check_i18n OK (480 ids, round-trip clean) + selftest ok (121 cases), locale_v1 --all ok + selftest ok (19 cases), gen_pseudolocale --check OK (480 en-XA messages)
- Catalog-id freeze evidenced: zero ids removed vs HEAD; 31 added ids are all pre-existing multi-upstream work (`settings.upstream.*`, `settings.models.*`, `settings.dialog.remove_group`, `settings.validation.*`) — untouched per the Phase 3 scope guard

## Task Commits

No per-task code commits — the audit found zero genuine residuals, so no source edits were made (the sweep exists as pre-existing uncommitted work, deliberately left uncommitted and undisturbed per plan):

1. **Task 1 (tracer): Audit sweep end-to-end** — verified, no changes
2. **Task 2 (auto): Close desc + Rust-doc + asserted-literal gaps** — nothing to close, no changes
3. **Task 3 (auto): Refresh hashes, regen fixtures, green gates** — hashes already fresh, fixture already atomic, gates re-proven green, no changes

**Plan metadata:** committed with phase close-out (see 01-02 SUMMARY).

_Independent review: not applicable — zero edits made, nothing to review. No independence claimed._

## Files Created/Modified

- `.planning/phases/01-copy-sweep-foundation/01-01-SUMMARY.md` - This file
- No source files created or modified (audit-only execution)

## Decisions Made

- **settings.rs:362 (`Probe a NIM key`) and :392 (`stored NIM key`) left untouched.** Rationale: `probe_key` carries no `#[utoipa::path]` (internal helper, not OpenAPI-visible) and `fingerprint` is a private fn (invisible outside the module). Both are category-(c) internal-only; rewording would add churn with zero user-visible benefit and violate the plan's "reword genuine residuals only" rule.
- **render_check.js NIM tokens left untouched.** Rationale: mutation ids (`mutation-nim-key-*`), API paths (`/api/settings/nim-keys`), payload keys (`nim_keys`), and the :6226 tool diagnostic are test descriptions/identifiers, explicitly excluded by the plan ("leaving test descriptions … alone").
- **Plan verify-pipeline false positives documented, not "fixed".** The task-2 scan as written flags `minimum` (substring "nim") in en-US.json:1915 and cannot filter rg's `file:line:` prefix with `grep -v "^\s*//"`. Both are scan artifacts, not copy defects; tighter re-scans confirmed clean.

## Deviations from Plan

None - plan executed exactly as written. The audit-first design worked as intended: verification replaced implementation.

## Issues Encountered

None. All gates passed on first run; no fix attempts needed (0 of 3 auto-fix budget used).

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes. Catalog values flow through the existing catalogMessage/data-i18n sink boundary unchanged (T-01-03 holds); hashes recomputed-by-gate rather than hand-written (T-01-01 holds via check_i18n green); no package installs (T-01-SC holds).

## Known Stubs

None. No placeholders, TODOs, or unwired surfaces introduced or found in scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for plan 01-02: full proof stack (cargo lib+e2e+openapi, render_check setup + escape-probe + syntax-only, fmt) over this swept tree, plus the four scope guards and REQUIREMENTS/ROADMAP close-out
- Deferred (explicitly out of scope per CONTEXT.md): orange/cream dual theme, multi-group wizard payload (incl. `settings.dialog.remove_group`), end-to-end screenshots + image rebuild — owned by later phases
- Pre-existing openapi.json drift (stale title + unrecorded models/upstreams endpoints) acknowledged per plan, not re-litigated here — plan 01-02 classifies it

---
*Phase: 01-copy-sweep-foundation*
*Completed: 2026-09-05*
