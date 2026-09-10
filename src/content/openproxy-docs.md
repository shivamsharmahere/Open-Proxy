# OPENPROXY — Documentation

> Connect any AI coding agent to rate-limited NIM models in 60 seconds.

---

## What is OPENPROXY?

OPENPROXY is an OpenAI-compatible reverse proxy that makes NVIDIA NIM's free tier usable for AI agent harnesses. It paces requests to per-key rate limits, load-balances across multiple keys, and keeps client connections alive while they wait.

**What it does:**
- Exposes a standard `/v1` OpenAI-compatible API
- Paces requests so you never hit NIM's per-key rate limit (40 RPM default)
- Load-balances across multiple API keys automatically
- Retries on 429 and 5xx with `Retry-After` honor
- Sends SSE heartbeats so streaming agents don't timeout
- Injects `stream_options` for accurate token usage reporting
- Provides a full operator dashboard with analytics

---

## Quick Start

### 1. Run the proxy

```bash
# Docker
docker run -d --name openproxy -p 8000:8000 \
  -v openproxy-data:/data \
  ghcr.io/openproxy/open-proxy:latest

# Or build from source
cargo build --release
./target/release/open-proxy --data /tmp/openproxy-data
```

### 2. Complete first-run wizard

Open `http://localhost:8000` in your browser. The wizard will:
1. Ask you to create a superuser account
2. Prompt for your NIM API key(s) (get one at [build.nvidia.com](https://build.nvidia.com))
3. Mint a client API key (`npk_...`) — shown once, copy it

### 3. Point your agent at the proxy

Set two environment variables (or equivalent config):

```bash
export OPENAI_API_KEY="npk_your_client_key_here"
export OPENAI_BASE_URL="http://localhost:8000/v1"
```

That's it. Your agent now uses rate-limited NIM models through the proxy.

---

## Integration Guides

### Codex CLI

**Method:** Environment variables or config file

**Environment variables (quickest):**
```bash
export OPENAI_API_KEY="npk_..."
export OPENAI_BASE_URL="http://localhost:8000/v1"
```

**Config file (`~/.codex/config.toml`):**
```toml
openai_base_url = "http://localhost:8000/v1"
```

**Custom provider in `~/.codex/config.toml`:**
```toml
model = "deepseek-ai/deepseek-r1"
model_provider = "openproxy"

[model_providers.openproxy]
name = "OpenProxy"
base_url = "http://localhost:8000/v1"
env_key = "OPENAI_API_KEY"
```

> **Note:** You cannot override the built-in `openai` provider by defining `[model_providers.openai]`. Use `openai_base_url` instead.

**Docs:** https://developers.openai.com/codex/config-advanced

---

### OpenCode

**Method:** Config file (`opencode.json` or `opencode.jsonc`)

**Global config (`~/.config/opencode/opencode.json`):**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "providers": {
    "openproxy": {
      "package": "@opencode-ai/ai/providers/openai-compatible",
      "name": "OpenProxy",
      "env": ["OPENAI_API_KEY"],
      "settings": {
        "baseURL": "http://localhost:8000/v1"
      },
      "models": {
        "deepseek-ai/deepseek-r1": {
          "name": "DeepSeek R1"
        },
        "meta-llama/llama-3.1-70b-instruct": {
          "name": "Llama 3.1 70B"
        }
      }
    }
  }
}
```

**Per-project config (`opencode.json` in project root):**
```json
{
  "provider": {
    "openproxy": {
      "package": "@opencode-ai/ai/providers/openai-compatible",
      "name": "OpenProxy",
      "env": ["OPENAI_API_KEY"],
      "settings": {
        "baseURL": "http://localhost:8000/v1"
      },
      "models": {
        "deepseek-ai/deepseek-r1": {
          "name": "DeepSeek R1"
        }
      }
    }
  }
}
```

**Docs:** https://opencode.ai/docs/providers

---

### Hermes Agent (Nous Research)

**Method:** Environment variables or config file

**Environment variables:**
```bash
export OPENAI_API_KEY="npk_..."
export OPENAI_BASE_URL="http://localhost:8000/v1"
```

**Config file (`~/.hermes/config.yaml`):**
```yaml
model:
  default: deepseek-ai/deepseek-r1
  provider: custom
  base_url: http://localhost:8000/v1
  context_length: 64000
```

**Interactive CLI:**
```
hermes model
# Select "Custom endpoint (self-hosted / VLLM / etc.)"
# Enter URL: http://localhost:8000/v1
# Enter API key (or skip if none)
# Enter model name: deepseek-ai/deepseek-r1
```

**Docs:** https://hermes-agent.nousresearch.com/docs/integrations/providers

---

### Claude Code (Anthropic)

**Method:** Environment variables or settings file

**Environment variables:**
```bash
export ANTHROPIC_BASE_URL="http://localhost:8000/v1"
export ANTHROPIC_API_KEY="npk_..."
```

**Settings file (`~/.claude/settings.json`):**
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8000/v1",
    "ANTHROPIC_API_KEY": "npk_..."
  }
}
```

> **Important:** Claude Code uses the **Anthropic Messages API** protocol, not OpenAI chat completions. OPENPROXY proxies OpenAI-compatible endpoints. For Anthropic protocol support, you'd need a translation layer upstream.

**Docs:** https://code.claude.com/docs/en/env-vars

---

### Cursor

**Method:** GUI only

1. Open **Cursor Settings > Models**
2. Find **OpenAI API Key** — enable and paste your `npk_...` key
3. Enable **Override OpenAI Base URL** — enter `http://localhost:8000/v1`
4. Click **+ Add Custom Model** — enter the model name (e.g., `deepseek-ai/deepseek-r1`)
5. Enable the model toggle and verify

> **Limitations:** Agent mode does NOT support custom API keys (only Ask/Plan modes work). Tab autocomplete uses Cursor's proprietary model.

**Docs:** https://cursor.com/docs/settings/api-keys

---

### Continue.dev

**Method:** Config file

**YAML (`~/.continue/config.yaml`):**
```yaml
name: My Config
version: 0.0.1
schema: v1
models:
  - name: DeepSeek R1
    provider: openai
    model: deepseek-ai/deepseek-r1
    apiBase: http://localhost:8000/v1
    apiKey: npk_...
    roles:
      - chat
      - edit
  - name: Llama 3.1 70B
    provider: openai
    model: meta-llama/llama-3.1-70b-instruct
    apiBase: http://localhost:8000/v1
    apiKey: npk_...
    roles:
      - chat
      - edit
```

**JSON (`~/.continue/config.json`):**
```json
{
  "models": [
    {
      "name": "DeepSeek R1",
      "provider": "openai",
      "model": "deepseek-ai/deepseek-r1",
      "apiBase": "http://localhost:8000/v1",
      "apiKey": "npk_...",
      "roles": ["chat", "edit"]
    }
  ]
}
```

**Docs:** https://docs.continue.dev/customize/model-providers/top-level/openai

---

### Aider

**Method:** Environment variables, CLI flags, or config file

**Environment variables:**
```bash
export OPENAI_API_BASE="http://localhost:8000/v1"
export OPENAI_API_KEY="npk_..."
```

> **Note:** Aider uses `OPENAI_API_BASE`, not `OPENAI_BASE_URL`.

**CLI flags:**
```bash
aider --model openai/deepseek-ai/deepseek-r1 \
  --openai-api-base http://localhost:8000/v1 \
  --openai-api-key npk_...
```

**Config file (`~/.aider.conf.yml`):**
```yaml
model: openai/deepseek-ai/deepseek-r1
openai-api-base: http://localhost:8000/v1
openai-api-key: npk_...
```

**Docs:** https://aider.chat/docs/llms/openai-compat.html

---

### Cline (VS Code Extension)

**Method:** GUI only

1. Open **Cline Settings** (gear icon in the Cline panel)
2. Select **API Provider**: choose "OpenAI Compatible"
3. Enter **Base URL**: `http://localhost:8000/v1`
4. Enter **API Key**: your `npk_...` key
5. Enter **Model**: your model ID (e.g., `deepseek-ai/deepseek-r1`)
6. Click **Verify**

**Docs:** https://docs.cline.bot/provider-config/openai-compatible

---

### Roo Code (VS Code Extension)

**Method:** GUI only

1. Open **Roo Code Settings** (gear icon)
2. Select **API Provider**: choose "OpenAI Compatible" (uses `/v1/chat/completions`)
3. Enter **Base URL**: `http://localhost:8000/v1`
4. Enter **API Key**: your `npk_...` key
5. Select or enter **Model ID**

> **Key distinction:** "OpenAI" provider uses the Responses API endpoint; "OpenAI Compatible" uses `/v1/chat/completions`. For OPENPROXY, use **"OpenAI Compatible"**.

**Docs:** https://docs.roocode.com/providers/openai-compatible

---

### Kilo Code (VS Code Extension)

**Method:** GUI or config file

**GUI:**
1. Open **Settings (gear icon) > Providers tab**
2. Click **Custom provider**
3. Fill in:
   - **Provider ID**: `openproxy`
   - **Provider API**: select "OpenAI Compatible"
   - **Base URL**: `http://localhost:8000/v1`
   - **API Key**: your `npk_...` key
4. Kilo auto-fetches models from `/v1/models`

**Config file (`kilo.json`):**
```json
{
  "provider": {
    "openproxy": {
      "npm": "@ai-sdk/openai-compatible",
      "models": {
        "deepseek-ai/deepseek-r1": {
          "name": "DeepSeek R1",
          "limit": {
            "context": 262144,
            "output": 16384
          }
        }
      },
      "options": {
        "baseURL": "http://localhost:8000/v1",
        "apiKey": "npk_..."
      }
    }
  },
  "model": "openproxy/deepseek-ai/deepseek-r1"
}
```

**Docs:** https://kilo.ai/docs/ai-providers/openai-compatible

---

### Windsurf (Codeium IDE)

**Method:** GUI (version-dependent)

1. Open **Windsurf Settings**
2. Look for "Models", "BYOK", or "Base URL" fields
3. Enter **Base URL**: `http://localhost:8000/v1`
4. Enter **API Key**: your `npk_...` key
5. Enter **Model ID**

> **Caveat:** Not all Windsurf versions expose a custom base URL field. If your version only accepts official API keys without a base URL override, it cannot be pointed at a custom endpoint.

**Docs:** https://docs.windsurf.com/windsurf/models

---

## Quick Reference Table

| Tool | Config Method | Base URL Setting | Env Var |
|---|---|---|---|
| **Codex CLI** | `~/.codex/config.toml` | `openai_base_url` | `OPENAI_BASE_URL` |
| **OpenCode** | `opencode.json` | `providers.<id>.settings.baseURL` | — |
| **Hermes** | `~/.hermes/config.yaml` | `model.base_url` | `OPENAI_BASE_URL` |
| **Claude Code** | `~/.claude/settings.json` | `env.ANTHROPIC_BASE_URL` | `ANTHROPIC_BASE_URL` |
| **Cursor** | GUI | Override OpenAI Base URL | — |
| **Continue.dev** | `~/.continue/config.yaml` | `apiBase` per model | — |
| **Aider** | `~/.aider.conf.yml` or CLI | `openai-api-base` | `OPENAI_API_BASE` |
| **Cline** | GUI | Base URL in OpenAI Compatible | — |
| **Roo Code** | GUI | Base URL in OpenAI Compatible | — |
| **Kilo Code** | GUI or `kilo.json` | `options.baseURL` | — |
| **Windsurf** | GUI | Base URL field (version-dependent) | — |

---

## API Reference

### Base URL

```
http://localhost:8000/v1
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/models` | List available models (cached, no rate-limit cost) |
| `POST` | `/v1/chat/completions` | Chat completions (streaming and buffered) |
| `POST` | `/v1/completions` | Text completions |
| `POST` | `/v1/embeddings` | Embeddings |
| `POST` | `/v1/rankings` | Rankings |
| `GET` | `/health` | Health check (returns `"ok"`) |
| `GET` | `/metrics` | Prometheus metrics (requires auth) |

### Authentication

All `/v1` requests require a client API key in the `Authorization` header:

```
Authorization: Bearer npk_your_client_key_here
```

Client keys are created during setup or via the dashboard Settings > Clients tab. They look like `npk_` followed by a random string.

### Request Example

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer npk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/deepseek-r1",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

### Response Format

Standard OpenAI chat completion response. When `stream: true`, standard SSE streaming with `: heartbeat\n\n` comments every 10 seconds to keep connections alive.

Token usage is accurate — the proxy injects `stream_options: { include_usage: true }` automatically.

---

## Configuration

### Config File Location

```
$DATA_DIR/config.json
```

Default data directory: `/data` (Docker) or `--data` flag.

### Config Format

```json
{
  "version": 1,
  "default_locale": "en-US",
  "upstream": {
    "base_url": "https://integrate.api.nvidia.com",
    "enabled": true,
    "models": [],
    "nim_keys": [
      {
        "key": "nvapi-...",
        "owner": "root",
        "enabled": true,
        "rpm": 40
      }
    ]
  },
  "upstreams": [],
  "disabled_models": [],
  "client_auth": {
    "mode": "keyed",
    "keys": [
      {
        "name": "my-agent",
        "secret_sha256": "<64 hex chars>",
        "last4": "a1b2",
        "owner": "root"
      }
    ]
  },
  "limits": {
    "heartbeat_secs": 10,
    "max_inflight": 512,
    "max_wait_secs": 900,
    "models_ttl_secs": 600,
    "request_timeout_secs": 300,
    "stream_idle_secs": 300,
    "strict_passthrough": false
  },
  "history": { "days": 30 },
  "dashboard": {
    "default_window_days": 30,
    "slo_target_percent": 99.9
  },
  "governor": {
    "enabled": true,
    "overrides": {}
  },
  "users": [
    {
      "username": "admin",
      "password_hash": "pbkdf2-sha256$600000$...",
      "role": "superuser",
      "locale": null
    }
  ]
}
```

### Key Settings

| Setting | Default | Description |
|---|---|---|
| `upstream.base_url` | `https://integrate.api.nvidia.com` | Primary NIM provider URL |
| `upstream.nim_keys[].rpm` | `40` | Requests per minute per key |
| `client_auth.mode` | `"keyed"` | `"keyed"` (requires API key) or `"open"` (no auth) |
| `limits.heartbeat_secs` | `10` | Seconds between SSE heartbeats |
| `limits.max_inflight` | `512` | Max concurrent in-flight requests |
| `limits.max_wait_secs` | `900` | Max seconds a request waits in queue |
| `limits.strict_passthrough` | `false` | Disable `stream_options` injection |
| `history.days` | `30` | Metrics retention (0 = forever) |
| `dashboard.slo_target_percent` | `99.9` | SLO target for availability |

### Multiple Providers

Add extra endpoint groups via the dashboard Settings > Upstreams or directly in config:

```json
{
  "upstreams": [
    {
      "name": "openrouter",
      "base_url": "https://openrouter.ai/api/v1",
      "enabled": true,
      "keys": [
        { "key": "sk-or-...", "owner": "root", "enabled": true, "rpm": 40 }
      ],
      "models": []
    }
  ]
}
```

---

## How It Works

### Rate-Limit Pacing

Each API key is a "lane" with a sliding-window limiter (default 40 RPM). A global FIFO dispatcher grants one request at a time per lane. No client can starve another.

### Sticky Conversations

Requests are "sticky" to the same lane via a hash of `model` + first two messages. This preserves NIM's prefix-cache affinity. If the sticky lane is full, the request spills to the least-loaded ready lane.

### Retry on Failure

On 429 or 5xx responses, the proxy:
1. Puts the failing lane into cooldown (honoring `Retry-After` header)
2. Releases the slot
3. Retries on another lane

If all lanes are exhausted within `max_wait`, the client gets a `504 gateway_timeout`.

### SSE Heartbeats

For streaming requests, the proxy sends `: heartbeat\n\n` every `heartbeat_secs` (default 10s). These are ignored by all OpenAI clients but keep connections alive during queue waits.

### Stream Options Injection

For streaming chat completions, the proxy injects `"stream_options": {"include_usage": true}` so token usage is exact. If a model rejects this (400), the proxy retries without it and disables injection for that model.

### Governor (Concurrency Cap)

Optional per-model concurrency limits. When enabled, limits how many requests can be in-flight simultaneously for a specific model. Prevents overloading smaller models.

---

## Dashboard

The operator dashboard is available at `http://localhost:8000` after setup.

### Tabs

| Tab | What it shows |
|---|---|
| **Overview** | KPI tiles, traffic sparkline, capacity/reliability gauges, top models, top clients |
| **Models** | Per-model analytics: tokens/min, TTFT, generation speed, finish reasons |
| **Clients** | Per-client analytics: tool intensity, conversation depth, streaming share |
| **Reliability** | SLO tracking, error budget, outcome charts, queue wait breakdown |
| **Capacity** | Rate-limit health, per-key utilization, 429 hits |
| **Settings** | Endpoint groups, API keys, model routing, limits, users |

### Time Range

Global time selector at the top: 1h / 6h / 24h / 7d / 30d / All time / Custom range.

---

## Security

- **Client keys:** `npk_...` tokens, SHA-256 hashed, shown once at creation
- **Dashboard users:** PBKDF2-HMAC-SHA256 passwords (600k iterations)
- **Sessions:** HttpOnly, SameSite=Strict cookies, random key per boot
- **Config file:** Stored with 0600 permissions, fsynced before rename
- **No secrets in responses:** API keys are never exposed in any endpoint

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `503 setup_required` | Complete the first-run wizard at `http://localhost:8000` |
| `401 unauthorized` | Check your client API key is correct and included in `Authorization: Bearer npk_...` |
| `404 model not found` | Model may be disabled or not in any endpoint group's allowlist |
| `504 gateway_timeout` | All lanes are full; add more keys or increase `rpm` |
| Agent disconnects during long tasks | Check `heartbeat_secs` is not too high; default 10s works for most agents |
| Models not showing in dashboard | Wait for `models_ttl_secs` (default 10 min) cache refresh |

---

## Getting NIM API Keys

1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Sign in or create an account
3. Navigate to your profile > API Keys
4. Create a new key (starts with `nvapi-...`)
5. Free tier includes 1000 credits; each model costs different credits per request

---

## Environment Variables

| Variable | Description |
|---|---|
| `OPENPROXY_DATA` | Data directory path (default: `/data`) |
| `OPENPROXY_HOST` | Listen address (default: `0.0.0.0:8000`) |
| `RUST_LOG` | Log level: `info`, `debug`, `warn`, `error` |

---

## License

See repository for license details.
