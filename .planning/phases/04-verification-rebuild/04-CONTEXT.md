# Phase 4 Context — Verification + Image Rebuild

## What this phase does
End-to-end milestone verification: confirm all 3 prior phases compose correctly, run the full proof stack, capture evidence, rebuild the container image, and verify it serves.

## Scope
1. Run full proof stack: `cargo test` (360 tests), `render_check.js`, `cargo fmt --check`, `check_i18n.py`
2. Docker/podman image build: `podman build --no-cache -t open-proxy .`
3. Container smoke: `/health` endpoint + wizard reachability
4. Screenshot evidence: login, setup wizard, dashboard, settings (dark console)
5. Update ROADMAP.md to mark Phase 3 complete, Phase 4 complete
6. Final STATE.md: milestone complete, progress 100%

## Prior phase completions
- Phase 1: 29 catalog + 7 doc rewords + 4 setup fallbacks + 3 render_check literals
- Phase 2: violet token system (`#8A5CF5`), graphite surfaces, WCAG AA 9/9
- Phase 3: multi-provider setup (backend SetupGroup, frontend wizard, i18n, OpenAPI)

## Constraints
- Frozen identifiers unchanged
- Wire format extends non-breaking
- No new dependencies
- `cargo test` must pass with 0 failures before image build
