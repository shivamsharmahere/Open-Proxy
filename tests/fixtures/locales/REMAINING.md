# Strings still rendering in English

Measured, not estimated. Reproduce the populated five-tab dashboard with:

```sh
node scripts/render_check.js --locale en-XA
```

Current result: **0 known actionable repository-owned English runs**. The gate
replays real-binary fixtures, renders all five tabs, hovers every chart, and
fails when an ASCII prose run bypasses the generated pseudolocale. The former
sidebar uptime prefix and stacked-chart `total` label are catalog messages, all
counted labels use explicit plural categories, and **Reliability** replaced the
old **Proxy** navigation label through the catalog.

This is still a status inventory, not a claim that every future path is
automatically covered. Machine data and frozen identifiers—model and publisher
names, client names, metric identifiers, status codes, units, and numeric
values—must remain untranslated. A newly introduced state that no fixture
renders can evade the browser observation until its interaction row and fixture
are added. `check_i18n.py` covers source-level visible prose, including short
and lowercase labels, while the
[render-gate decision](../../../knowledge/decisions/render-gate.md) owns the
runtime coverage boundary.
