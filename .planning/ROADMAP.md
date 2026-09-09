# Roadmap: OPENPROXY v1 — Rebrand & Dual-Theme Console

## Overview

From NIM-specific single-provider console to provider-neutral OPENPROXY with a dual-theme console and multi-provider first setup: copy-sweep foundation first (unblocks every i18n gate), then the theme token system + toggle, then multi-provider setup backend → UI, closing with full both-themes signup-to-first-call verification and a rebuilt image.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Copy-Sweep Foundation** - Provider-neutral copy + fresh catalog hashes and fixtures
- [ ] **Phase 2: Theme Tokens + Toggle** - Dual-theme token system with remembered OS-default toggle
- [ ] **Phase 3: Multi-Provider Setup** - Atomic N-group claim backend plus wizard multi-group UI
- [ ] **Phase 4: Verification + Image Rebuild** - Both-themes end-to-end pass, screenshots, rebuilt image

## Phase Details

### Phase 1: Copy-Sweep Foundation
**Goal**: Every screen reads provider-neutral with green i18n gates
**Depends on**: Nothing (first phase)
**Requirements**: COPY-01, COPY-02, COPY-03
**Success Criteria** (what must be TRUE):
  1. First-time setup wizard never names NVIDIA-only key flows; all steps use generic API-key + provider-group wording
  2. Dashboard and settings screens show no NIM-specific strings that contradict multi-provider reality
  3. `scripts/check_i18n.py` and `locale_v1 --all` pass with fresh `sha256(en)[:8]` hashes and regenerated public/render fixtures
**Plans**: TBD
**UI hint**: yes

### Phase 2: Theme Tokens + Toggle
**Goal**: Users can switch between orange-on-black dark and creamy light consoles, defaulting to their OS setting
**Depends on**: Phase 1
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04
**Success Criteria** (what must be TRUE):
  1. User sees a visible theme toggle that switches the whole console between dark and light with no half-themed surfaces
  2. User's theme choice persists across browser sessions and defaults to their OS setting on first visit
  3. User experiences no first-paint theme flash and preserved reduced-motion behavior
  4. Every text/background pair in both themes meets WCAG AA with a single locked accent; product mark follows the orange identity
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
  1. A fresh container passes signup → multi-provider setup → dashboard → first proxied call with a mid-flow theme toggle and no breakage
  2. Setup, login, dashboard, and settings screenshots exist in both themes and are archived
  3. `docker build -t open-proxy .` from the final tree serves `/health` and the wizard smoke green, with all proof gates green (`cargo test` incl. 124 e2e + 8 openapi, `render_check.js` headless, `check_i18n.py`, `locale_v1 --all`, both-theme screenshots)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Copy-Sweep Foundation | 0/TBD | Not started | - |
| 2. Theme Tokens + Toggle | 0/TBD | Not started | - |
| 3. Multi-Provider Setup | 0/TBD | Not started | - |
| 4. Verification + Image Rebuild | 0/TBD | Not started | - |
