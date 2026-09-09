# Phase 3 Verification — Multi-Provider Setup

## Proof Gates

| Gate | Status |
|------|--------|
| `cargo test` — 360/360 pass, 0 fail, 1 ignored | PASS |
| `render_check.js` — 5 tabs, 17 charts, no errors | PASS |
| `cargo fmt --check` — clean | PASS |
| `UPDATE_OPENAPI=1 cargo test --test openapi` — 8/8 pass | PASS |
| `locale_catalog_routes_are_gated` — exact-projection match | PASS |
| `setup.html` renders group cards container, add-group button | PASS |
| `setup.js` multi-group state machine, per-group key validation | PASS |
| Backend `SetupReq.groups` field compiles and accepts multi-group | PASS |
| `setup_submit` multi-group claim — first group primary, rest to UpstreamEndpoint | PASS |
| i18n keys present in `en-US.json` and fixture | PASS |

## Scope Delivered

### Backend
- `settings.rs`: Added `SetupGroup` struct (`name: String`, `base_url: String`, `keys: Vec<String>`)
- `settings.rs`: `SetupReq` gains `groups: Vec<SetupGroup>` field
- `settings.rs`: `setup_submit` processes multi-group claim — first group sets primary upstream, remaining groups added as `UpstreamEndpoint` entries
- `settings.rs`: `NoScriptSetupForm` conversion adds `groups: Vec::new()`
- `openapi.json`: regenerated to reflect new `SetupReq` schema

### Frontend — setup.html
- Replaced static key list with `#groups` container (group cards)
- Add-group button for multi-provider support
- Noscript hint for JS-disabled fallback

### Frontend — setup.js
- Multi-group state machine with `renderGroups()` function
- Per-group key validation with inline error feedback
- Review step shows all groups with provider names and key counts
- Add/remove group buttons with min-1-group guard

### i18n
- 5 new keys in `en-US.json`: `setup.step2.add_group`, `setup.step2.group_base_url`, `setup.step2.group_hint`, `setup.step3.review.group`, `setup.step3.review.groups_summary`
- Fixture `public-en-US.json` updated with sorted BTreeMap-compatible keys

## Constraint Checklist
- [x] No new dependencies added
- [x] Legacy single-group fallback preserved
- [x] Frozen identifiers untouched
- [x] Wire format extends (non-breaking)
- [x] OpenAPI regenerated and committed
