---
type: Decision
title: Counted labels use CLDR plural categories, not an English ternary
description: >-
  `n === 1 ? '' : 's'` is English grammar compiled into the render path. Counted
  messages carry all six CLDR categories as explicit catalog ids, selected by
  Intl.PluralRules.
tags: [i18n, dashboard, locale, intl]
timestamp: 2026-07-29T00:00:00Z
---

# Counted labels use CLDR plural categories

## Context

Six labels originally pluralized themselves inline. The first two converted by
this decision were:

```js
`${cfg.lanes} enabled key${cfg.lanes === 1 ? '' : 's'}`
`${unknownCapacity} interval${unknownCapacity === 1 ? '' : 's'} with no capacity data`
```

Both survived the extraction pass and the untagged-string lint, because neither
contains a quoted prose string — the English is the *absence* of a character in
one branch of a ternary. They are the same class as
[the leaks that hid as arguments](message-catalog-and-escaping.md): grammar in
the render path is invisible to a scan that looks for text.

A ternary encodes two claims that are only true of English: that there are
exactly two forms, and that the boundary sits at 1. Arabic has six categories,
Russian and Polish three, Welsh six, Japanese one. `cfg.lanes` can also be 0,
which English happens to render as the plural and several languages do not.

## Options

1. **Keep the ternary, translate the two strings.** Cheapest, and wrong in a way
   that cannot be fixed by translators: they receive a singular and a plural slot
   and no way to add the four categories their language needs.
2. **A pluralization library.** Rejected at ladder rung 4 — the platform already
   ships this. `Intl.PluralRules` is CLDR data, in the browser, no dependency.
3. **`Intl.PluralRules` with all six categories in the source catalog.**

## Choice

Option 3. `Intl.PluralRules(LOCALE).select(n)` returns the category; a `switch`
maps it to a catalog id.

Two details that are not obvious and are the reason this page exists:

**All six categories live in the English source catalog**, even though English
uses two and the other four repeat the `other` text verbatim. `locale-v1`
enforces exact id parity between a translation and the source, so a category
absent from the source can never be *added* by a translation — the Arabic file
would be rejected for having ids English lacks. The redundancy is what makes the
languages that need those forms reachable at all. Each redundant form carries a
`desc` telling the translator so, because a translator seeing six identical
English strings will otherwise assume a mistake.

**The ids are spelled out, not built from the category.** `t(prefix + '.' +
select(n))` is shorter and breaks the orphan check: `check_i18n.py` finds
references by matching `t('literal')`, so a computed id makes all six look
unreferenced, and the check would then demand their deletion. Writing
`case 'few': return t('…enabled_keys.few', p)` keeps the check working.

## Consequences

- Six catalog ids per counted message. The Settings surface adds explicit sets
  for history bytes, validated models, NIM API key counts, and client API key
  counts; English repeats its `other` wording for the categories it does not
  distinguish.
- Every counted label reuses the shared cached `PLURALS` instance rather than
  constructing another `Intl.PluralRules`. It is initialized with the catalog
  locale alongside the number/date formatters in `shared.js`, so Settings does
  not depend on `dashboard.js` execution order. The formatter-caching reasoning
  in [intl-formatting](intl-formatting.md) applies unchanged.
- English output is byte-identical to the ternaries **for every count either
  label can reach**, so this is invisible in the shipped locale — which means the
  pseudolocale run is the only check that observes it working.
  `node scripts/render_check.js --locale en-XA` shows the counted runs accented.

  Not unconditionally identical, though: the new code wraps the count in
  `fmt()`, so at n = 1000 the ternary rendered `1000` and the message renders
  `1,000`, and at 10000 it renders `10K`. Neither is reachable — the rollup
  budget is clamped to 1000 (`src/history.rs`) and the page requests 288 points,
  while `cfg.lanes` is a key count — but "byte-identical" is a claim about the
  code and this is the boundary where it stops being true. One consequence to
  keep in mind if a counted label ever *can* reach those magnitudes:
  `select(n)` reads the raw number while the surface shows `10K`, and there are
  locales whose category depends on the surface form.
- The four composite dashboard runs that were deferred by the initial decision
  now use complete catalog messages and `PLURALS.select()`; no English suffix
  ternary remains in `src/web/`. The current pseudolocale inventory is
  [REMAINING.md](../../tests/fixtures/locales/REMAINING.md).
- `check_i18n.py` now has a deliberately narrow `PLURAL_SUFFIX` guard. It
  rejects the historical `.length` and `lanes === 1 ? '' : 's'` shapes and its
  mutation fixture proves that check can fail. It is not a JavaScript grammar
  analyzer: a differently spelled count expression or grammar encoded through
  other control flow can still evade the regex. Reviewers therefore keep
  checking counted UI messages for explicit catalog variants even when the
  lint is green.
