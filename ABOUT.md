<div align="center">

<img src="docs/assets/logo.png" alt="open-proxy" width="140">

# open-proxy

**A self-hosted, rate-limit-aware OpenAI-compatible proxy for NVIDIA NIM and other compatible APIs.**

Make upstream limits predictable for agent clients without changing the API they already speak.

</div>

## What it is

open-proxy sits between your clients and one or more OpenAI-compatible
providers. It accepts normal OpenAI API requests, schedules them across your
own upstream keys, waits through temporary provider pressure, and exposes the
whole system through a built-in operator dashboard and Prometheus metrics.

It was designed around NVIDIA NIM's free-tier experience: each API key has a
strict rolling request limit, while agent harnesses tend to send bursts,
stream long responses, and retry aggressively when they see a `429`. The
proxy makes those clients patient. It never exists to exceed a provider's
limit: every configured key remains inside its own budget.

## What you can do with it

- Point OpenCode, Codex CLI, n8n, curl, or any OpenAI-compatible client at one
  stable base URL.
- Pool multiple keys you control and increase aggregate throughput while each
  key is paced independently.
- Front NVIDIA NIM, self-hosted NIM, or any other compatible API from the same
  process.
- Route models to specific provider groups, or let catch-all groups handle
  models without an explicit route.
- Share a private installation with other users while keeping client keys and
  upstream keys owned and visible only to the right people.
- Inspect request health, model behavior, client behavior, capacity, and
  historical performance without installing Grafana or a frontend build.
- Scrape Prometheus metrics directly, or send them to an OpenTelemetry
  collector through its Prometheus receiver.

## Why it exists

Without a proxy, a burst from several agents can exhaust one upstream key's
window. The provider returns `429`, the client often gives up, and useful work
is lost. open-proxy turns that burst into an orderly queue:

```text
OpenCode / Codex / n8n / curl
              |
              v
        open-proxy
        |    |    |
        v    v    v
     NIM key  NIM key  Other OpenAI-compatible provider
```

The proxy controls admission, retry, failover, and observability. Successful
upstream response bodies remain transparent to the client, apart from the
documented streaming usage option that enables exact token accounting.

## Core capabilities

### Strict pacing and fair scheduling

- **Exact rolling-window pacing:** each key uses a sliding request window,
  not a burstable token bucket. A small safety margin protects against timing
  jitter at the provider boundary.
- **Global FIFO dispatch:** all clients share one fair queue. A client that
  disconnects while waiting gives its reservation back.
- **Multi-key balancing:** ready keys are selected by load, so a pool can use
  its available capacity instead of hammering one key.
- **Conversation affinity:** a conversation prefers the same key to preserve
  provider-side prefix-cache locality, then spills to the least-loaded ready
  key when necessary.

### Resilient streaming and retries

- Retries upstream `429` and transient `5xx` responses, honoring
  `Retry-After` when present.
- Fails over between healthy keys without making the client implement its own
  provider pool.
- Commits streaming requests as `200 text/event-stream` and sends SSE
  heartbeat comments while work is waiting, so compatible clients stay
  connected instead of treating queue time as a failure.
- Detects stalled streams and releases resources cleanly.
- Supports an optional `X-Nim-Proxy-Deadline-Ms` absolute deadline covering
  queueing, retries, and generation. Buffered requests receive a `504`; an
  already-committed stream receives a terminal SSE error event.

### Model-aware admission

NIM can impose a per-model worker-concurrency ceiling independently of a key's
request-rate limit. open-proxy detects that condition, backs off the affected
model adaptively, and avoids wasting healthy key capacity on retries that the
model cannot accept.

### Multiple upstream groups

Each endpoint group has its own base URL, keys, per-key rate limits, enable
state, and model allowlist. Model routing is explicit and predictable:

- A model in a group's allowlist uses that group.
- An empty allowlist makes a group a catch-all.
- Globally disabled models are rejected before queueing.
- A model no enabled group provides returns `404 model_not_found`, rather than
  waiting until a timeout.
- `GET /v1/models` is cached, refreshed single-flight, merged across groups,
  and filtered for disabled models.

## The operator console

The dashboard is served at `GET /`. It is embedded in the Rust binary and
uses same-origin HTML, CSS, JavaScript, and locale assets. There is no Grafana
installation, Node build, CDN font, runtime translation service, or external
database to maintain.

Every authenticated role sees the same analytical dashboard. Its five tabs
are designed for different questions:

- **Overview:** current capacity and availability, request and token trends,
  health signals, and the busiest models and clients.
- **Models:** TTFT, generation speed, inter-token latency, upstream latency,
  tokens per minute, finish reasons, truncation, reasoning share, tool calls,
  and model comparisons.
- **Clients:** streaming mix, conversation depth, offered tools, sampling
  fingerprints, output budgets, structured-output usage, and client rankings.
- **Reliability:** availability against the configured SLO, error budget,
  outcome taxonomy, queue/first-token/generation latency, time heatmaps, and
  model-pressure state.
- **Capacity:** current saturation, historical capacity, exact peak-RPM
  shortfall, per-key utilization, and upstream cooldowns.

Charts share one time-range selection. Presets follow the current time, custom
ranges can be fixed, and current operational values are clearly marked
**Now**. Exact range totals do not depend on chart point density.

### Observability without content collection

The dashboard and metrics answer how the system behaves without recording
prompts or generated text. Request-shape telemetry contains bounded counts and
sizes only, including:

- message and tool counts;
- requested output limits and temperature;
- streaming versus buffered requests;
- tool-choice mode and JSON-mode usage;
- conversation depth and client/model dimensions.

Model ids, client names, paths, reasons, and modes are sanitized or bounded
before entering metric labels. Raw message content, response content, and
secrets never become dashboard telemetry.

### Prometheus metrics

Authenticated `GET /metrics` exposes metrics for:

- request totals, deadlines, status outcomes, unauthorized requests, failed
  logins, shed requests, and stream types;
- prompt, completion, cached, reasoning, and total-token observations;
- exact versus estimated completion-token sources;
- TTFT, tokens per second, inter-token latency, upstream latency, and queue
  wait histograms;
- finish reasons, truncation, tool calls, and usage-observation quality;
- queue depth, active requests, model in-flight counts, and model limits;
- per-key requests, cooldowns, affinity results, and upstream backpressure;
- request-shape histograms for messages, tools, output limits, and sampling;
- model-concurrency exhaustion and authentication/security events.

The `nimproxy_usage_observations_total` series distinguishes measured,
estimated, unavailable, and invalid upstream usage fields. A valid numeric
zero is kept as a measured zero; missing or malformed upstream data is not
quietly turned into a made-up value.

### Durable history

The dashboard rebuilds analytical views from a canonical JSONL history store.
The default view and retention are both 30 days; retention can be extended or
set to unlimited with `0`. History records boot boundaries, capacity, metric
state, and compact checkpoints. Idle periods do not repeatedly write full
metric snapshots, and incomplete or recovered ranges are labeled as partial
instead of being presented as complete.

History and configuration live on the persistent data volume. The current
canonical file is `history-v1.jsonl`; older experimental history is never
silently migrated or destroyed during upgrade.

## Setup

The normal setup is intentionally small.

### Docker Compose

```sh
docker compose up -d
```

The published multi-architecture image is a small static `FROM scratch`
binary. It runs as a non-root user, has no shell, and writes only to the
mounted data volume. The default Compose publish address is loopback:
`127.0.0.1:8000`.

### Build and run locally

```sh
cargo run --release
```

Or build the image yourself:

```sh
docker build -t open-proxy .
docker run -d --name open-proxy \
  -p 127.0.0.1:8000:8000 \
  -v open-proxy-data:/data \
  open-proxy
```

### First-run wizard

Open `http://localhost:8000/`. On a fresh data volume, the wizard:

1. creates the first superuser;
2. validates and stores at least one upstream key;
3. persists the configuration atomically;
4. creates the first client API key by default; and
5. shows the client base URL and one-time client secret.

The first visitor claims a fresh installation, so complete setup as soon as
the service becomes reachable. Before setup, `/v1` is closed with
`setup_required`; the proxy does not enter a half-configured serving state.

After setup, point clients at:

```text
http://localhost:8000/v1
```

In the default `keyed` mode, send the generated `npk_...` secret as a Bearer
token. For a trusted loopback or private network, Settings can switch only the
`/v1` data plane to `open`; the dashboard and observability remain protected.

## Client compatibility

The proxy speaks the OpenAI-compatible API shape clients already understand.
Model ids pass through verbatim.

**OpenCode** uses a provider with `baseURL: http://localhost:8000/v1`, the
client key, and a disabled client timeout so it can wait through pacing.

**Codex CLI** uses `base_url = "http://localhost:8000/v1"`,
`wire_api = "chat"`, and an environment variable for the client key.

**n8n** uses an OpenAI credential with the proxy base URL and client key.

**curl** works directly:

```sh
curl http://localhost:8000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer npk_your-key-here' \
  -d '{"model":"deepseek-ai/deepseek-r1","stream":true,"messages":[{"role":"user","content":"hello"}]}'
```

See the [README](README.md) and [examples](examples/README.md) for complete
client configuration recipes.

## Configuration and administration

App-level configuration is managed in Settings and stored in
`DATA_DIR/config.json`; saves validate the complete candidate, write it
atomically, and apply without a restart. Environment variables are limited to
deployment concerns:

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Listen port |
| `DATA_DIR` | `data` (`/data` in Docker) | Config and history location |
| `TRUST_PROXY` | `false` | Trust forwarded HTTPS and mark cookies Secure |
| `RUST_LOG` | `nim_proxy=info` | Log filtering |

Settings controls endpoint groups, upstream keys, per-key RPM, model routing,
global model toggles, client keys, API authentication mode, queue and stream
limits, history, SLO targets, model limits, and users.

The multi-user model has three roles:

- **Superuser:** the undeletable first admin and owner of at least one enabled
  upstream key.
- **Admin:** manages server settings and users.
- **User:** manages their own account and keys; the dashboard remains fully
  visible, but ownership-sensitive settings are filtered server-side.

Client secrets are shown once. Only their SHA-256 digests and masked suffixes
are stored. Upstream keys are never forwarded to clients, and client keys are
never forwarded upstream.

## Security and deployment posture

open-proxy is deliberately fail-closed:

- corrupt or future-version configuration/auth stores refuse to boot;
- setup closes the data plane until a complete initial claim is persisted;
- the dashboard, Settings, and `/metrics` require an authenticated session;
- API key mode rejects requests when no client keys exist;
- role and ownership checks happen on the server, not only in the UI;
- sessions use signed, HttpOnly, SameSite cookies;
- password hashes use PBKDF2-HMAC-SHA256 with per-hash salts;
- login failures are throttled and recorded;
- strict CSP and anti-framing/sniffing headers protect the embedded console;
- the image is rootless, read-only, capability-dropped, and shell-free by
  default.

TLS is not built in. For a VPS, LAN, or public deployment, terminate TLS at
nginx, Caddy, or the platform edge, keep `/v1` in keyed mode, and set
`TRUST_PROXY=true` only when the proxy overwrites forwarded headers correctly.
Back up the data volume as a secret: it contains configuration, upstream key
material, password hashes, client-key digests, and history.

## Operational notes

- `/health` is public and doubles as the container health probe.
- Logs contain startup detail and one compact access line per request.
- SIGTERM and SIGINT drain gracefully.
- Rate-limit state is in memory: run one instance per key set. Replicas must
  not share the same keys while independently pacing them.
- Rate windows reset on restart; retry and failover absorb temporary upstream
  pressure.
- Non-streaming requests cannot receive wire-level heartbeats, so they wait
  silently up to the configured wait limit.
- Dashboard history is sample-precise, not event-precise. Current **Now**
  values continue refreshing independently of a paused analytical range.

## Verification and project quality

The repository includes unit, end-to-end, load, and fuzz coverage. The
end-to-end suite exercises setup/authentication, role and ownership rules,
configuration durability, pacing, failover, Retry-After, model governing,
affinity, model caching, usage observation, stalled streams, security headers,
metrics, history recovery, and graceful shutdown.

Run the core suite with:

```sh
cargo test
cargo fmt --check
```

The strict mock-upstream load test proves that a burst of 100 concurrent
clients produces zero upstream rate violations. See
the [test strategy](knowledge/testing/test-strategy.md) for the complete
validation model.

## Project documentation

- [README](README.md): quick start and copy-paste recipes.
- [Architecture notes](knowledge/architecture/index.md): request flow,
  scheduling, metrics, history, dashboard, auth, and routing.
- [Deployment runbook](knowledge/ops/deploy-docker.md): Compose, hardening,
  health checks, and upgrades.
- [Configuration runbook](knowledge/ops/configure-env.md): environment
  variables, Settings, retention, and lockout recovery.
- [OpenAPI contract](openapi.json): generated control-plane API description.
- [Contributing](CONTRIBUTING.md), [security policy](SECURITY.md), and
  [support](SUPPORT.md).

## License

MIT. See [LICENSE](LICENSE).
