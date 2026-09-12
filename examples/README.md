# Example configs

## `opencode.json` — OpenCode through OPENPROXY

A ready-to-use [OpenCode](https://opencode.ai) config pointed at a local
OPENPROXY (`http://localhost:8000/v1`). One provider entry serves **every
upstream group** the proxy fronts: the example lists `moonshotai/kimi-k3`
(NVIDIA NIM group) and `z-ai/glm-5.3-free` (an extra TokenRouter group), but
any model in the proxy's merged catalog works under the same entry.

### Install

Copy it to your project root (or `~/.config/opencode/opencode.json` for
global use) and set the API key OpenCode sends to the proxy:

```sh
cp examples/opencode.json ./opencode.json
export NIM_PROXY_KEY=your-proxy-secret   # a client API key (npk_…) you minted in
                                         # Settings when the API is in keyed mode,
                                         # or any non-empty string in open mode
opencode
```

Confirm the model ids your groups actually serve — the proxy is a strict
pass-through, so a key under `models` must match the upstream catalog
exactly:

```sh
curl -s localhost:8000/v1/models | grep -i glm
```

If an id differs, change the `models` key and the `model` reference to match.
Only give OpenCode credentials for the proxy itself: a direct credential for
a fronted upstream (in OpenCode's auth store or a second provider entry)
silently bypasses the gateway — those requests get no pacing and never show
on the dashboard.

### Why these settings

| Setting | Value | Rationale |
|---|---|---|
| `options.timeout` | `false` | **The important one.** OPENPROXY holds the connection open with SSE heartbeats while it waits out a group's per-key RPM limit. With a client-side timeout, OpenCode would abort mid-wait and defeat the proxy's whole purpose. Disable it and let the proxy pace. |
| `options.baseURL` | `http://localhost:8000/v1` | Points at the proxy, never at an upstream directly. Change the port if you set a non-default `PORT`. |
| `options.apiKey` | `{env:NIM_PROXY_KEY}` | The SDK requires a key. In keyed mode this is a client API key (`npk_…`) you generate in the dashboard Settings; in open mode any non-empty value works. |
| `limit.context` | `131072` (128k) | A conservative floor: NVIDIA's **hosted** endpoints have historically served NIM-group models at 128k regardless of the card's advertised window, and other groups' served windows are unverified. Because OpenCode auto-compacts *below* this number, setting it conservatively means compaction fires before an upstream can reject an over-length request. Raise it only if testing confirms the served window is larger. |
| `limit.output` | `32768` | OpenCode silently caps `limit.output` at 32k ([issue #29363](https://github.com/anomalyco/opencode/issues/29363)), so this is the effective ceiling. Generous headroom for reasoning/"thinking" tokens, which count toward output. |
| `compaction` | `auto`/`prune`/`reserved: 24000` | Auto-compact keeps long sessions under the window; `prune` drops stale tool outputs; `reserved` leaves ~24k tokens free so a compaction summary plus the next response never overflow. **Option names have changed across OpenCode releases** — if your version ignores this block, check `opencode.ai/docs/config`; the real lever is `limit.context` above, which every version honors. |
| `small_model` | `moonshotai/kimi-k3` | Title/summary generation stays on the same provider so you don't need a second key. It's cheap; the proxy answers `/v1/models` from cache so it costs no rate budget. |

### Notes

- **Rate budget is per key, per group**: one NIM key = 40 RPM, and extra
  groups carry their own per-key limits (the TokenRouter keys in this setup
  are set to 8 RPM). Long agentic runs go faster with more keys added in the dashboard
  Settings — the proxy load-balances within a group and never exceeds a
  key's limit. Watch utilization on the dashboard.
- **Unknown fields**: this example omits parameters like
  `reasoning_effort` because an upstream may reject unknown fields with a
  400; add them only after confirming the serving group accepts them.
