# Roadmap: OPENPROXY v1 — Rebrand & Violet Console

## Overview

From NIM-specific single-provider console to provider-neutral OPENPROXY with a graphite + violet console and multi-provider first setup: copy-sweep foundation first (unblocks every i18n gate), then the violet token system (scope delta 2026-09-05: supersedes orange dual-theme; dark-only, no toggle), then multi-provider setup backend → UI, closing with end-to-end verification and a rebuilt image.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Copy-Sweep Foundation** - Provider-neutral copy + fresh catalog hashes and fixtures
- [x] **Phase 2: Violet Theme Tokens** (scope delta 2026-09-05: was "Theme Tokens + Toggle" for orange dual-theme) - Graphite + violet + cyan token system, dark-only (completed 2026-09-10)
- [x] **Phase 3: Multi-Provider Setup** - Atomic N-group claim backend plus wizard multi-group UI (completed 2026-09-10)
- [x] **Phase 4: Verification + Image Rebuild** - End-to-end pass, screenshots, rebuilt image (completed 2026-09-10)

## Phase Details

### Phase 1: Copy-Sweep Foundation

**Goal**: Every screen reads provider-neutral with green i18n gates
**Depends on**: Nothing (first phase)
**Requirements**: COPY-01, COPY-02, COPY-03
**Success Criteria** (what must be TRUE):

  1. First-time setup wizard never names NVIDIA-only key flows; all steps use generic API-key + provider-group wording
  2. Dashboard and settings screens show no NIM-specific strings that contradict multi-provider reality
  3. `scripts/check_i18n.py` and `locale_v1 --all` pass with fresh `sha256(en)[:8]` hashes and regenerated public/render fixtures

**Plans**: 01-01 (audit + gap-closure), 01-02 (proof stack + close-out)
**UI hint**: yes

### Phase 2: Violet Theme Tokens

**Goal**: Dark console wears the graphite + violet + cyan identity with semantic status colors (scope delta 2026-09-05: supersedes orange dual-theme; dark-only, no toggle)
**Depends on**: Phase 1
**Requirements**: THEME-01, THEME-02, THEME-04
**Success Criteria** (what must be TRUE):

  1. Dark console uses graphite surfaces with violet primary actions, cyan secondary data, and emerald/amber/red status semantics; no neon-gradient look
  2. No first-paint flash regression and preserved reduced-motion behavior
  3. Every text/background pair meets WCAG AA; product mark follows the violet identity

**Plans**: TBD
**UI hint**: yes

### Phase 3: Multi-Provider Setup

**Goal**: First-time setup claims multiple providers with keys in one atomic wizard flow
**Depends on**: Phase 2
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04
**Success Criteria** (what must be TRUE):

  1. User can add and remove provider groups (name, base URL, keys) in the setup wizard and review all groups before finishing
  2. User gets per-key probe feedback against each group's own base URL and cannot finish until at least one valid key exists
  3. Old single-group setup payloads still work and failed multi-group claims leave no partial state
  4. Noscript users can still complete primary-group setup with a hint pointing at the full wizard

**Plans**: TBD
**UI hint**: yes

### Phase 4: Verification + Image Rebuild

**Goal**: Milestone proven end to end in both themes from a fresh container and shipped as a rebuilt image
**Depends on**: Phase 3
**Requirements**: VER-01, VER-02, VER-03
**Success Criteria** (what must be TRUE):

  1. A fresh container passes signup → multi-provider setup → dashboard → first proxied call with no breakage
  2. Setup, login, dashboard, and settings screenshots exist (dark console) and are archived
  3. `docker build -t open-proxy .` from the final tree serves `/health` and the wizard smoke green, with all proof gates green (`cargo test` incl. 124 e2e + 8 openapi, `render_check.js` headless, `check_i18n.py`, `locale_v1 --all`, both-theme screenshots)

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Copy-Sweep Foundation | 2/2 | Complete    | 2026-09-05 |
| 2. Violet Theme Tokens | 1/1 | Complete    | 2026-09-10 |
| 3. Multi-Provider Setup | 1/1 | Complete    | 2026-09-10 |
| 4. Verification + Image Rebuild | 1/1 | Complete    | 2026-09-10 |
