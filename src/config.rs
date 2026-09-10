//! The UI-managed configuration store: `DATA_DIR/config.json`.
//!
//! This file is the app's single source of app-level configuration — env
//! vars cover container-level concerns only (HOST/PORT/DATA_DIR/RUST_LOG/
//! TRUST_PROXY). It holds credentials (hashed passwords, NIM keys, client-
//! secret digests), so unlike the telemetry history it gets atomic writes,
//! 0600 permissions, and a **hard boot error** when unreadable or corrupt:
//! silently degrading would let wizard-created credentials vanish on restart
//! and reopen the setup-claim window. A missing file is the one benign case
//! — that's a fresh install, served by the setup wizard.
//!
//! The settings handlers are the only writer; every consumer reads immutable
//! snapshots (see `AppState::cfg`), so there is no file watching or reload.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const FILE: &str = "config.json";

/// The primary (legacy) upstream's endpoint name. It predates named
/// endpoints, so its name is implicit: every pre-multi-upstream store is one
/// group called this, and extra endpoints may not reuse it.
pub const PRIMARY_UPSTREAM: &str = "nvidia";

/// A model id is operator-typed but client-compared: accept exactly the
/// charset the request path treats as inert (`proxy::sanitize_label` keeps
/// these chars), bounded so a junk entry can't explode labels or the store.
pub fn valid_model_id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-' | '/' | ':'))
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StoredConfig {
    #[serde(default = "default_version")]
    pub version: u32,
    #[serde(default = "default_locale")]
    pub default_locale: String,
    #[serde(default)]
    pub upstream: Upstream,
    /// Extra OpenAI-compatible endpoints beyond the primary NIM one. Empty
    /// on stores written before multi-upstream support (backward compatible).
    #[serde(default)]
    pub upstreams: Vec<UpstreamEndpoint>,
    /// Globally toggled-off models: hidden from the merged catalog and
    /// rejected without spending rate budget.
    #[serde(default)]
    pub disabled_models: Vec<String>,
    #[serde(default)]
    pub client_auth: ClientAuth,
    #[serde(default)]
    pub limits: Limits,
    #[serde(default)]
    pub history: HistoryCfg,
    #[serde(default)]
    pub dashboard: DashboardCfg,
    #[serde(default)]
    pub governor: GovernorCfg,
    #[serde(default)]
    pub users: Vec<User>,
}

impl Default for StoredConfig {
    fn default() -> Self {
        serde_json::from_str("{}").expect("all StoredConfig fields have defaults")
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Upstream {
    #[serde(default = "default_base_url")]
    pub base_url: String,
    #[serde(default)]
    pub nim_keys: Vec<NimKey>,
    /// Group toggle: a disabled primary parks its lanes as state carriers
    /// (same mechanism as a disabled key), so re-enabling resumes warm.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Model allowlist for this group; empty serves any model. Requests for
    /// a model not listed here route to another group (or fail as unknown).
    #[serde(default)]
    pub models: Vec<String>,
    /// Whether this provider supports `stream_options.include_usage`.
    /// NIM and OpenAI do; many other OpenAI-compatible providers do not.
    #[serde(default = "default_true")]
    pub supports_stream_options: bool,
}

impl Upstream {
    /// Normalize base URL: strip trailing `/v1` and slashes so downstream
    /// path-appending never produces double-v1 paths.
    pub fn normalize_base_url(url: &str) -> String {
        url.trim_end_matches("/v1")
            .trim_end_matches('/')
            .to_owned()
    }
}

impl Default for Upstream {
    fn default() -> Self {
        Self {
            base_url: default_base_url(),
            nim_keys: Vec::new(),
            enabled: true,
            models: Vec::new(),
            supports_stream_options: true,
        }
    }
}

/// One extra OpenAI-compatible endpoint (a non-NVIDIA API, a self-hosted
/// NIM, a second team account, …). Same lane semantics as the primary
/// group: each key is a rate-limit lane, toggled independently.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UpstreamEndpoint {
    /// Group id (`nvidia` is reserved for the primary). Used in the API,
    /// the dashboard, and per-request routing logs.
    pub name: String,
    pub base_url: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub keys: Vec<NimKey>,
    /// Model allowlist for this group; empty serves any model.
    #[serde(default)]
    pub models: Vec<String>,
    /// Whether this provider supports `stream_options.include_usage`.
    /// NIM and OpenAI do; many other OpenAI-compatible providers do not.
    #[serde(default = "default_true")]
    pub supports_stream_options: bool,
}

/// One endpoint group as the pool, router, and dashboard see it: the
/// stored order flattened with the primary first. Indexes from this view
/// are the `endpoint` tags on pool lanes.
#[derive(Clone, Debug)]
pub struct EndpointView {
    pub name: String,
    pub base_url: String,
    pub enabled: bool,
    pub models: Vec<String>,
    pub supports_stream_options: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NimKey {
    pub key: String,
    pub owner: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_rpm")]
    pub rpm: usize,
}

#[derive(Serialize, Deserialize, Clone, Default, Debug)]
pub struct ClientAuth {
    #[serde(default)]
    pub mode: Mode,
    #[serde(default)]
    pub keys: Vec<ClientKey>,
}

/// Whether `/v1` requires a client API key. `Keyed` with zero keys rejects
/// everything — fail closed; the dashboard prompts to create a key.
#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Default, Debug, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    Open,
    #[default]
    Keyed,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClientKey {
    /// Metric label for this harness (charset-checked by `validate`).
    pub name: String,
    /// SHA-256 hex of the bearer secret. The secret itself is shown exactly
    /// once at creation and never stored — a leaked store leaks no tokens.
    pub secret_sha256: String,
    /// Last four characters of the secret, for masked display only
    /// (a 4-char tail of a 128-bit random token gives away nothing useful).
    #[serde(default)]
    pub last4: String,
    pub owner: String,
}

/// Fields are declared in ASCII order because this struct is served verbatim
/// inside `/api/config`, where declaration order is the wire order — see the
/// module docs in `src/api.rs`.
#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct Limits {
    #[serde(default = "default_heartbeat")]
    pub heartbeat_secs: u64,
    #[serde(default = "default_max_inflight")]
    pub max_inflight: usize,
    #[serde(default = "default_max_wait")]
    pub max_wait_secs: u64,
    #[serde(default = "default_models_ttl")]
    pub models_ttl_secs: u64,
    #[serde(default = "default_request_timeout")]
    pub request_timeout_secs: u64,
    #[serde(default = "default_stream_idle")]
    pub stream_idle_secs: u64,
    #[serde(default)]
    pub strict_passthrough: bool,
}

impl Default for Limits {
    fn default() -> Self {
        serde_json::from_str("{}").expect("all Limits fields have defaults")
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HistoryCfg {
    /// Retention in days; 0 = keep forever.
    #[serde(default = "default_history_days")]
    pub days: u64,
}

impl Default for HistoryCfg {
    fn default() -> Self {
        Self {
            days: default_history_days(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct DashboardCfg {
    #[serde(default = "default_dashboard_window_days")]
    pub default_window_days: u64,
    #[serde(default = "default_slo_target_percent")]
    pub slo_target_percent: f64,
}

impl Default for DashboardCfg {
    fn default() -> Self {
        Self {
            default_window_days: default_dashboard_window_days(),
            slo_target_percent: default_slo_target_percent(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct GovernorCfg {
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Operator-pinned per-model concurrency caps. Ordered (not a `HashMap`)
    /// so both `config.json` and `/api/config` serialize deterministically —
    /// a hash-ordered map made two saves of the same config differ.
    #[serde(default)]
    pub overrides: BTreeMap<String, usize>,
}

impl Default for GovernorCfg {
    fn default() -> Self {
        Self {
            enabled: true,
            overrides: BTreeMap::new(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub username: String,
    /// `pbkdf2-sha256$<iters>$<salt>$<hash>` (see `auth::hash_password`).
    pub password_hash: String,
    pub role: Role,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub locale: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    /// An admin that can never be deleted (so the last admin can't vanish).
    Superuser,
    Admin,
    User,
}

impl Role {
    /// Server settings + user management.
    pub fn is_admin(self) -> bool {
        matches!(self, Role::Superuser | Role::Admin)
    }
}

fn default_version() -> u32 {
    1
}
fn default_locale() -> String {
    crate::presentation::DEFAULT_LOCALE.to_owned()
}
pub(crate) fn default_true() -> bool {
    true
}
fn default_rpm() -> usize {
    40
}
fn default_base_url() -> String {
    "https://integrate.api.nvidia.com".to_owned()
}
fn default_max_wait() -> u64 {
    900
}
fn default_heartbeat() -> u64 {
    10
}
fn default_models_ttl() -> u64 {
    600
}
fn default_stream_idle() -> u64 {
    300
}
fn default_request_timeout() -> u64 {
    300
}
fn default_max_inflight() -> usize {
    512
}
fn default_history_days() -> u64 {
    30
}
fn default_dashboard_window_days() -> u64 {
    30
}
fn default_slo_target_percent() -> f64 {
    99.9
}

impl StoredConfig {
    pub fn superuser(&self) -> Option<&User> {
        self.users.iter().find(|u| u.role == Role::Superuser)
    }

    pub fn user(&self, username: &str) -> Option<&User> {
        self.users.iter().find(|u| u.username == username)
    }

    pub fn user_mut(&mut self, username: &str) -> Option<&mut User> {
        self.users.iter_mut().find(|u| u.username == username)
    }

    /// Every stored key as a pool lane spec, tagged with its endpoint.
    /// Disabled keys — and keys on a disabled endpoint — ride along as
    /// state carriers so a disable→enable cycle can't reset their windows.
    pub fn pool_specs(&self) -> Vec<crate::pool::LaneSpec> {
        let mut specs = Vec::new();
        let mut push_group =
            |idx: usize, name: &str, base_url: &str, group_enabled: bool, keys: &[NimKey], supports_stream_options: bool| {
                let base_url = base_url.trim_end_matches('/').to_owned();
                for k in keys {
                    specs.push(crate::pool::LaneSpec {
                        key: k.key.clone(),
                        rpm: k.rpm,
                        enabled: k.enabled && group_enabled,
                        endpoint: idx,
                        base_url: base_url.clone(),
                        upstream: name.to_owned(),
                        supports_stream_options,
                    });
                }
            };
        push_group(
            0,
            PRIMARY_UPSTREAM,
            &self.upstream.base_url,
            self.upstream.enabled,
            &self.upstream.nim_keys,
            self.upstream.supports_stream_options,
        );
        for (i, ep) in self.upstreams.iter().enumerate() {
            push_group(i + 1, &ep.name, &ep.base_url, ep.enabled, &ep.keys, ep.supports_stream_options);
        }
        specs
    }

    /// The ordered endpoint groups: index 0 is always the primary NIM
    /// group, extras follow in stored order. The pool, the router, and the
    /// dashboard all share these indexes.
    pub fn endpoints(&self) -> Vec<EndpointView> {
        let mut out = vec![EndpointView {
            name: PRIMARY_UPSTREAM.to_owned(),
            base_url: self.upstream.base_url.trim_end_matches('/').to_owned(),
            enabled: self.upstream.enabled,
            models: self.upstream.models.clone(),
            supports_stream_options: self.upstream.supports_stream_options,
        }];
        for ep in &self.upstreams {
            out.push(EndpointView {
                name: ep.name.clone(),
                base_url: ep.base_url.trim_end_matches('/').to_owned(),
                enabled: ep.enabled,
                models: ep.models.clone(),
                supports_stream_options: ep.supports_stream_options,
            });
        }
        out
    }

    /// Endpoint index by group name (`nvidia` = primary). `None` = no group.
    pub fn endpoint_index(&self, name: &str) -> Option<usize> {
        if name == PRIMARY_UPSTREAM {
            return Some(0);
        }
        self.upstreams
            .iter()
            .position(|ep| ep.name == name)
            .map(|i| i + 1)
    }

    /// Mutable key lists per group (`nvidia` first): the settings layer's
    /// add/remove/set needs one search across every group.
    pub fn key_groups_mut(&mut self) -> Vec<(String, &mut Vec<NimKey>)> {
        let mut out = Vec::with_capacity(1 + self.upstreams.len());
        out.push((PRIMARY_UPSTREAM.to_owned(), &mut self.upstream.nim_keys));
        for ep in &mut self.upstreams {
            out.push((ep.name.clone(), &mut ep.keys));
        }
        out
    }

    /// The key list of one group by name (`nvidia` = primary).
    pub fn group_keys_mut(&mut self, name: &str) -> Option<&mut Vec<NimKey>> {
        if name == PRIMARY_UPSTREAM {
            return Some(&mut self.upstream.nim_keys);
        }
        self.upstreams
            .iter_mut()
            .find(|ep| ep.name == name)
            .map(|ep| &mut ep.keys)
    }

    /// Derive the immutable runtime snapshot the request paths consume.
    pub fn runtime(&self) -> crate::Config {
        crate::Config {
            base_url: self.upstream.base_url.trim_end_matches('/').to_owned(),
            endpoints: self
                .endpoints()
                .into_iter()
                .map(|e| crate::EndpointRuntime {
                    name: e.name,
                    base_url: e.base_url,
                    enabled: e.enabled,
                    models: e.models,
                })
                .collect(),
            disabled_models: self.disabled_models.clone(),
            max_wait: Duration::from_secs(self.limits.max_wait_secs),
            heartbeat: Duration::from_secs(self.limits.heartbeat_secs),
            models_ttl: Duration::from_secs(self.limits.models_ttl_secs),
            stream_idle: Duration::from_secs(self.limits.stream_idle_secs),
            request_timeout: Duration::from_secs(self.limits.request_timeout_secs),
            strict_passthrough: self.limits.strict_passthrough,
            clients: match self.client_auth.mode {
                Mode::Open => None,
                Mode::Keyed => Some(
                    self.client_auth
                        .keys
                        .iter()
                        .map(|k| (k.secret_sha256.clone(), k.name.clone()))
                        .collect(),
                ),
            },
            max_inflight: self.limits.max_inflight,
            governor: crate::GovernorSettings {
                enabled: self.governor.enabled,
                overrides: self.governor.overrides.clone(),
            },
        }
    }
}

pub fn store_path(dir: &Path) -> PathBuf {
    dir.join(FILE)
}

fn tmp_path(dir: &Path) -> PathBuf {
    dir.join("config.json.tmp")
}

/// Load the store. `Ok(None)` means no store exists (fresh install — the
/// setup wizard takes it from here). Any other failure is fatal: corruption
/// must never silently fall through to setup mode (that would discard keys).
pub fn load(dir: &Path) -> Result<Option<StoredConfig>, String> {
    // A stale tmp file is a crashed save that never committed; drop it.
    let _ = fs::remove_file(tmp_path(dir));
    let path = store_path(dir);
    let raw = match fs::read_to_string(&path) {
        Ok(raw) => raw,
        Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(format!("cannot read {}: {e}", path.display())),
    };
    let sc: StoredConfig = serde_json::from_str(&raw).map_err(|e| {
        format!(
            "{} is corrupt ({e}); restore it from backup, or delete it to re-run first-time setup (this discards all settings and keys)",
            path.display()
        )
    })?;
    if sc.version > 1 {
        return Err(format!(
            "{} has version {} but this build understands version 1; upgrade open-proxy",
            path.display(),
            sc.version
        ));
    }
    validate(&sc)?;
    Ok(Some(sc))
}

/// Persist atomically with owner-only permissions: write config.json.tmp
/// (0600), fsync, rename over config.json, fsync the directory. A crash at
/// any point leaves either the old file or the new one, never a torn mix.
pub fn save(dir: &Path, sc: &StoredConfig) -> io::Result<()> {
    fs::create_dir_all(dir)?;
    let tmp = tmp_path(dir);
    // Recreate rather than truncate so the 0600 mode always applies.
    let _ = fs::remove_file(&tmp);
    let data = serde_json::to_vec_pretty(sc).expect("config serializes");
    {
        let mut opts = fs::OpenOptions::new();
        opts.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            opts.mode(0o600);
        }
        let mut f = opts.open(&tmp)?;
        io::Write::write_all(&mut f, &data)?;
        f.sync_all()?;
    }
    fs::rename(&tmp, store_path(dir))?;
    #[cfg(unix)]
    if let Ok(d) = fs::File::open(dir) {
        let _ = d.sync_all();
    }
    Ok(())
}

/// The label charset shared by client-key names and usernames — they appear
/// in metrics and logs, so they get the same conservative treatment as
/// model labels (see `proxy::sanitize_label`).
fn label_ok(s: &str, max: usize) -> bool {
    !s.is_empty()
        && s.len() <= max
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
}

/// Guard an upstream URL: require an http(s) scheme, and refuse the
/// link-local range (169.254.0.0/16 and IPv6 fe80::/10) — that's the cloud
/// metadata endpoint (169.254.169.254) and has no legitimate NIM use, so
/// blocking it defangs the setup-probe SSRF while still allowing loopback
/// and RFC1918 hosts (local and LAN self-hosted NIM are real use cases).
pub fn check_base_url(base: &str) -> Result<(), String> {
    let rest = base
        .strip_prefix("http://")
        .or_else(|| base.strip_prefix("https://"))
        .ok_or("upstream base_url must start with http:// or https://")?;
    let authority = rest.split('/').next().unwrap_or("");
    // A bracketed IPv6 literal keeps its inner colons; otherwise the host is
    // everything up to the port separator.
    let host = if let Some(inner) = authority.strip_prefix('[') {
        inner.split(']').next().unwrap_or("")
    } else {
        authority.split(':').next().unwrap_or("")
    };
    let host = host.to_ascii_lowercase();
    if host.starts_with("169.254.") || host.starts_with("fe80:") {
        return Err("upstream base_url must not point at a link-local address".into());
    }
    Ok(())
}

/// One shared rulebook for the wizard, every settings endpoint, and boot.
pub fn validate(sc: &StoredConfig) -> Result<(), String> {
    if sc.version != 1 {
        return Err(format!("version must be 1, got {}", sc.version));
    }
    validate_stored_locale("default_locale", &sc.default_locale)?;
    let l = &sc.limits;
    if l.heartbeat_secs == 0 {
        return Err("heartbeat_secs must be >= 1".into());
    }
    if l.max_wait_secs <= l.heartbeat_secs {
        return Err("max_wait_secs must be greater than heartbeat_secs".into());
    }
    if l.request_timeout_secs == 0 {
        return Err("request_timeout_secs must be >= 1".into());
    }
    if l.max_inflight == 0 {
        return Err("max_inflight must be >= 1".into());
    }
    if sc.dashboard.default_window_days == 0 {
        return Err("default_window_days must be >= 1".into());
    }
    if sc.history.days != 0 && sc.history.days < sc.dashboard.default_window_days {
        return Err("history days must be 0 or at least default_window_days".into());
    }
    if !(sc.dashboard.slo_target_percent.is_finite()
        && 0.0 < sc.dashboard.slo_target_percent
        && sc.dashboard.slo_target_percent <= 100.0)
    {
        return Err("slo_target_percent must be a number greater than 0 and at most 100".into());
    }
    check_base_url(&sc.upstream.base_url)?;
    validate_models_list("upstream models", &sc.upstream.models)?;

    // Extra endpoint groups: unique names (`nvidia` is the primary),
    // reachable-looking URLs, well-formed allowlists.
    let mut names = std::collections::HashSet::new();
    names.insert(PRIMARY_UPSTREAM);
    for ep in &sc.upstreams {
        if !label_ok(&ep.name, 64) {
            return Err(format!(
                "upstream name {:?} must be 1-64 chars of letters, digits, '.', '_' or '-'",
                ep.name
            ));
        }
        if ep.name == PRIMARY_UPSTREAM {
            return Err(format!(
                "upstream name {PRIMARY_UPSTREAM:?} is reserved for the primary group"
            ));
        }
        if !names.insert(ep.name.as_str()) {
            return Err(format!("duplicate upstream name {:?}", ep.name));
        }
        check_base_url(&ep.base_url)?;
        validate_models_list(&format!("upstream {:?} models", ep.name), &ep.models)?;
    }

    validate_disabled_models(&sc.disabled_models)?;

    let mut names = std::collections::HashSet::new();
    for u in &sc.users {
        if !label_ok(&u.username, 32) {
            return Err(format!(
                "username {:?} must be 1-32 chars of letters, digits, '.', '_' or '-'",
                u.username
            ));
        }
        if !names.insert(u.username.as_str()) {
            return Err(format!("duplicate username {:?}", u.username));
        }
        if u.password_hash.is_empty() {
            return Err(format!("user {:?} has an empty password hash", u.username));
        }
        if let Some(locale) = &u.locale {
            validate_stored_locale(&format!("user {:?} locale", u.username), locale)?;
        }
    }
    if sc
        .users
        .iter()
        .filter(|u| u.role == Role::Superuser)
        .count()
        > 1
    {
        return Err("only one superuser may exist".into());
    }

    let mut keys = std::collections::HashSet::new();
    let mut check_key = |group: &str, key: &NimKey| -> Result<(), String> {
        if key.key.trim().is_empty() {
            return Err(format!("a NIM key in group {group:?} is empty"));
        }
        if !keys.insert(key.key.clone()) {
            return Err("duplicate NIM key".into());
        }
        if !(1..=10_000).contains(&key.rpm) {
            return Err(format!("NIM key rpm {} out of range 1-10000", key.rpm));
        }
        Ok(())
    };
    for k in &sc.upstream.nim_keys {
        check_key(PRIMARY_UPSTREAM, k)?;
    }
    for ep in &sc.upstreams {
        for k in &ep.keys {
            check_key(&ep.name, k)?;
        }
    }

    let mut client_names = std::collections::HashSet::new();
    for c in &sc.client_auth.keys {
        if !label_ok(&c.name, 64) {
            return Err(format!(
                "client key name {:?} must be 1-64 chars of letters, digits, '.', '_' or '-'",
                c.name
            ));
        }
        if !client_names.insert(c.name.as_str()) {
            return Err(format!("duplicate client key name {:?}", c.name));
        }
        if c.secret_sha256.len() != 64 || !c.secret_sha256.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(format!(
                "client key {:?} secret digest is not 64 hex chars",
                c.name
            ));
        }
    }

    for (model, cap) in &sc.governor.overrides {
        if model.trim().is_empty() || !(1..=10_000).contains(cap) {
            return Err(format!(
                "governor override for {model:?} out of range 1-10000"
            ));
        }
    }

    // Ownership + the pool-floor invariant apply once the store is claimed
    // (has a superuser). A recovery store — users hand-emptied on the volume
    // — legitimately holds orphan-owned keys until the wizard reassigns them.
    if let Some(su) = sc.superuser() {
        let mut floor = sc.upstream.enabled
            && sc
                .upstream
                .nim_keys
                .iter()
                .any(|k| k.enabled && k.owner == su.username);
        for k in &sc.upstream.nim_keys {
            if sc.user(&k.owner).is_none() {
                return Err(format!("NIM key owner {:?} is not a user", k.owner));
            }
        }
        for ep in &sc.upstreams {
            for k in &ep.keys {
                if sc.user(&k.owner).is_none() {
                    return Err(format!(
                        "NIM key in group {:?} owner {:?} is not a user",
                        ep.name, k.owner
                    ));
                }
            }
            if ep.enabled && ep.keys.iter().any(|k| k.enabled && k.owner == su.username) {
                floor = true;
            }
        }
        for c in &sc.client_auth.keys {
            if sc.user(&c.owner).is_none() {
                return Err(format!(
                    "client key {:?} owner {:?} is not a user",
                    c.name, c.owner
                ));
            }
        }
        if !floor {
            return Err(
                "the superuser must own at least one enabled NIM key on an enabled upstream (the pool floor)"
                    .into(),
            );
        }
    }
    Ok(())
}

/// A per-group model allowlist: every entry must be a plausible model id
/// (the request path compares these verbatim against the `model` field),
/// with no duplicates. Empty means "serves any model".
fn validate_models_list(label: &str, models: &[String]) -> Result<(), String> {
    let mut seen = std::collections::HashSet::new();
    for m in models {
        if !valid_model_id(m) {
            return Err(format!(
                "{label} entry {m:?} must be 1-128 chars of letters, digits, '.', '_', '-', '/' or ':'"
            ));
        }
        if !seen.insert(m.as_str()) {
            return Err(format!("{label} has a duplicate entry {m:?}"));
        }
    }
    Ok(())
}

/// The global model kill-switch list: same shape rules as allowlists, plus
/// a cardinality cap mirroring the metric-label bound so the list itself
/// can't become the cardinality explosion it guards against.
fn validate_disabled_models(models: &[String]) -> Result<(), String> {
    if models.len() > 256 {
        return Err("disabled_models holds at most 256 entries".into());
    }
    validate_models_list("disabled_models", models)
}

fn validate_stored_locale(label: &str, locale: &str) -> Result<(), String> {
    match crate::presentation::canonical_locale(locale) {
        Ok(canonical) if canonical != locale => Err(format!(
            "{label} must use canonical locale spelling {canonical}"
        )),
        Ok(canonical) if crate::presentation::installed_locale(&canonical).is_ok() => Ok(()),
        Ok(canonical) => Err(format!("{label} locale {canonical} is not installed")),
        Err(_) => Err(format!("{label} is not a valid locale")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    /// A unique per-test scratch dir (std-only; removed on drop).
    struct TestDir(PathBuf);
    impl TestDir {
        fn new() -> Self {
            static N: AtomicU32 = AtomicU32::new(0);
            let dir = std::env::temp_dir().join(format!(
                "nimproxy-config-test-{}-{}",
                std::process::id(),
                N.fetch_add(1, Ordering::SeqCst)
            ));
            fs::create_dir_all(&dir).unwrap();
            Self(dir)
        }
    }
    impl Drop for TestDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn claimed() -> StoredConfig {
        StoredConfig {
            users: vec![User {
                username: "root".into(),
                password_hash: "pbkdf2-sha256$1000$aa$bb".into(),
                role: Role::Superuser,
                locale: None,
            }],
            upstream: Upstream {
                base_url: default_base_url(),
                nim_keys: vec![NimKey {
                    key: "nvapi-one".into(),
                    owner: "root".into(),
                    enabled: true,
                    rpm: 40,
                }],
                ..Default::default()
            },
            ..Default::default()
        }
    }

    #[test]
    fn check_base_url_blocks_link_local_but_allows_local_and_lan() {
        // Legitimate NIM locations pass.
        for ok in [
            "https://integrate.api.nvidia.com",
            "http://127.0.0.1:9999",
            "http://localhost:8000",
            "http://192.168.1.50:8000", // LAN self-hosted NIM
            "http://10.0.0.4",
        ] {
            assert!(check_base_url(ok).is_ok(), "{ok} should be allowed");
        }
        // Link-local (cloud metadata) and non-http schemes are refused.
        for bad in [
            "http://169.254.169.254/latest/meta-data",
            "http://169.254.169.254",
            "http://[fe80::1]/x",
            "file:///etc/passwd",
            "gopher://169.254.169.254",
            "integrate.api.nvidia.com", // no scheme
        ] {
            assert!(check_base_url(bad).is_err(), "{bad} should be rejected");
        }
    }

    #[test]
    fn empty_object_parses_to_defaults() {
        let sc: StoredConfig = serde_json::from_str("{}").unwrap();
        assert_eq!(sc.version, 1);
        assert_eq!(sc.limits.max_wait_secs, 900);
        assert_eq!(sc.limits.heartbeat_secs, 10);
        assert_eq!(sc.client_auth.mode, Mode::Keyed, "fail closed by default");
        assert!(sc.governor.enabled);
        assert!(sc.superuser().is_none(), "no users -> setup mode");
        validate(&sc).expect("a fresh store is valid");
    }

    #[test]
    fn save_load_round_trips() {
        let dir = TestDir::new();
        let sc = claimed();
        save(&dir.0, &sc).unwrap();
        let loaded = load(&dir.0).unwrap().expect("store exists");
        assert_eq!(loaded.users[0].username, "root");
        assert_eq!(loaded.upstream.nim_keys[0].rpm, 40);
        let specs = loaded.pool_specs();
        assert_eq!(specs.len(), 1);
        assert!(specs[0].enabled && specs[0].key == "nvapi-one" && specs[0].rpm == 40);
    }

    #[cfg(unix)]
    #[test]
    fn saved_store_is_owner_only() {
        use std::os::unix::fs::PermissionsExt;
        let dir = TestDir::new();
        save(&dir.0, &claimed()).unwrap();
        let mode = fs::metadata(store_path(&dir.0))
            .unwrap()
            .permissions()
            .mode();
        assert_eq!(mode & 0o777, 0o600, "credentials file must be 0600");
    }

    #[test]
    fn missing_store_is_setup_mode_not_error() {
        let dir = TestDir::new();
        assert!(load(&dir.0).unwrap().is_none());
    }

    #[test]
    fn corrupt_store_is_a_hard_error() {
        let dir = TestDir::new();
        fs::write(store_path(&dir.0), "{ not json").unwrap();
        let err = load(&dir.0).unwrap_err();
        assert!(err.contains("corrupt"), "{err}");
    }

    #[test]
    fn unreadable_store_is_a_hard_error() {
        let dir = TestDir::new();
        // Invalid UTF-8 is a read error (not the corrupt-but-valid-UTF-8 JSON
        // path) — it must still fail closed, never fall through to setup mode.
        fs::write(store_path(&dir.0), [0xff, 0xfe, 0xfd]).unwrap();
        let err = load(&dir.0).unwrap_err();
        assert!(err.contains("cannot read"), "{err}");
    }

    #[test]
    fn serde_defaults_fill_omitted_fields() {
        // A NIM key missing enabled/rpm inherits the documented defaults
        // (backward compat for stores written before those fields existed).
        let k: NimKey = serde_json::from_str(r#"{"key":"k","owner":"o"}"#).unwrap();
        assert!(k.enabled);
        assert_eq!(k.rpm, 40);
        let g: GovernorCfg = serde_json::from_str("{}").unwrap();
        assert!(g.enabled);
    }

    #[test]
    fn dashboard_defaults_are_backward_compatible() {
        let sc: StoredConfig = serde_json::from_str(r#"{"version":1}"#).unwrap();
        assert_eq!(sc.history.days, 30);
        assert_eq!(sc.dashboard.default_window_days, 30);
        assert_eq!(sc.dashboard.slo_target_percent, 99.9);
        validate(&sc).unwrap();
    }

    #[test]
    fn dashboard_window_must_fit_finite_retention() {
        let mut sc = StoredConfig::default();
        sc.dashboard.default_window_days = 31;
        assert_eq!(
            validate(&sc).unwrap_err(),
            "history days must be 0 or at least default_window_days"
        );
        sc.history.days = 0;
        validate(&sc).unwrap();
    }

    #[test]
    fn dashboard_and_slo_bounds_are_validated() {
        let mut sc = StoredConfig::default();
        sc.dashboard.default_window_days = 0;
        assert_eq!(
            validate(&sc).unwrap_err(),
            "default_window_days must be >= 1"
        );
        sc.dashboard.default_window_days = 30;
        for target in [0.0, -1.0, 100.1, f64::NAN] {
            sc.dashboard.slo_target_percent = target;
            assert_eq!(
                validate(&sc).unwrap_err(),
                "slo_target_percent must be a number greater than 0 and at most 100"
            );
        }
    }

    /// 0.6.6 removed the `pricing` block. Stores written by 0.6.5 and earlier
    /// still carry it; `StoredConfig` has no `deny_unknown_fields`, so the
    /// orphan key must load and be ignored rather than fail the boot.
    #[test]
    fn config_with_a_legacy_pricing_block_still_loads() {
        let dir = TestDir::new();
        let mut raw = serde_json::to_value(claimed()).unwrap();
        raw.as_object_mut().unwrap().insert(
            "pricing".into(),
            serde_json::json!({"ref_price_in": 0.5, "ref_price_out": 2.0}),
        );
        fs::write(store_path(&dir.0), serde_json::to_string(&raw).unwrap()).unwrap();

        let sc = load(&dir.0).unwrap().expect("legacy store must load");
        validate(&sc).expect("a legacy pricing block must not fail validation");
    }

    /// A verbatim `config.json` as 0.6.5 wrote it: `limits` in the pre-reorder
    /// key order and `governor.overrides` written by a `HashMap` (so, arbitrary
    /// order). Neither the field reorder nor the `HashMap -> BTreeMap` switch
    /// may change what loads — serde matches by name, not position.
    #[test]
    fn a_0_6_5_config_json_loads_unchanged() {
        let dir = TestDir::new();
        // Hand-written, NOT round-tripped through the current structs: this is
        // the byte shape an installed 0.6.5 has on disk.
        let raw = r#"{
          "version": 1,
          "upstream": {
            "base_url": "https://integrate.api.nvidia.com",
            "nim_keys": [{"key":"nvapi-one","owner":"root","enabled":true,"rpm":40}]
          },
          "client_auth": {"mode":"keyed","keys":[]},
          "limits": {
            "max_wait_secs": 111,
            "heartbeat_secs": 22,
            "models_ttl_secs": 333,
            "stream_idle_secs": 44,
            "request_timeout_secs": 555,
            "max_inflight": 66,
            "strict_passthrough": true
          },
          "history": {"days": 7},
          "dashboard": {"default_window_days": 3, "slo_target_percent": 95.5},
          "governor": {
            "enabled": false,
            "overrides": {"zzz/model": 9, "aaa/model": 1, "mmm/model": 5}
          },
          "users": [{"username":"root","password_hash":"pbkdf2-sha256$1000$aa$bb","role":"superuser"}],
          "pricing": {"ref_price_in": 0.5, "ref_price_out": 2.0}
        }"#;
        fs::write(store_path(&dir.0), raw).unwrap();

        let sc = load(&dir.0).unwrap().expect("a 0.6.5 store must load");
        validate(&sc).expect("a 0.6.5 store must stay valid");

        // Every `limits` field landed on the right key despite the reorder.
        assert_eq!(sc.limits.max_wait_secs, 111);
        assert_eq!(sc.limits.heartbeat_secs, 22);
        assert_eq!(sc.limits.models_ttl_secs, 333);
        assert_eq!(sc.limits.stream_idle_secs, 44);
        assert_eq!(sc.limits.request_timeout_secs, 555);
        assert_eq!(sc.limits.max_inflight, 66);
        assert!(sc.limits.strict_passthrough);

        // Nothing else drifted.
        assert_eq!(sc.history.days, 7);
        assert_eq!(sc.dashboard.default_window_days, 3);
        assert_eq!(sc.dashboard.slo_target_percent, 95.5);
        assert_eq!(sc.upstream.nim_keys[0].rpm, 40);
        assert_eq!(sc.users[0].role, Role::Superuser);

        // The HashMap -> BTreeMap switch drops no entry and rewrites no value.
        assert!(!sc.governor.enabled);
        assert_eq!(sc.governor.overrides.len(), 3);
        assert_eq!(sc.governor.overrides["aaa/model"], 1);
        assert_eq!(sc.governor.overrides["mmm/model"], 5);
        assert_eq!(sc.governor.overrides["zzz/model"], 9);

        // Re-saving keeps every value, and is now byte-deterministic.
        save(&dir.0, &sc).unwrap();
        let first = fs::read_to_string(store_path(&dir.0)).unwrap();
        let again = load(&dir.0).unwrap().expect("round-trip");
        save(&dir.0, &again).unwrap();
        let second = fs::read_to_string(store_path(&dir.0)).unwrap();
        assert_eq!(first, second, "two saves of one config must be identical");
        assert_eq!(again.governor.overrides, sc.governor.overrides);
        assert_eq!(again.limits.max_wait_secs, 111);
        assert_eq!(again.limits.max_inflight, 66);
    }

    #[test]
    fn locale_current_store_migrates_on_read_and_persists_defaults() {
        let dir = TestDir::new();
        // This is a current-version store from before locale preferences. It
        // is hand-authored so the current serializer cannot smuggle the new
        // fields into the migration input.
        let raw = r#"{
          "version": 1,
          "upstream": {
            "base_url": "https://integrate.api.nvidia.com",
            "nim_keys": [{"key":"nvapi-one","owner":"root","enabled":true,"rpm":40}]
          },
          "client_auth": {"mode":"keyed","keys":[]},
          "users": [
            {"username":"root","password_hash":"pbkdf2-sha256$1000$aa$bb","role":"superuser"}
          ]
        }"#;
        fs::write(store_path(&dir.0), raw).unwrap();

        let sc = load(&dir.0)
            .expect("current-version store must load")
            .expect("store exists");
        save(&dir.0, &sc).expect("ordinary save persists additive defaults");

        let persisted = fs::read_to_string(store_path(&dir.0)).unwrap();
        let value: serde_json::Value = serde_json::from_str(&persisted).unwrap();
        assert_eq!(
            value.get("default_locale"),
            Some(&serde_json::Value::String("en-US".into())),
            "locale-store:migration: a current v1 store defaults and persists server locale"
        );
        assert_eq!(
            value["users"][0].get("locale"),
            None,
            "locale-store:migration: absent user preference stays absent"
        );

        let version_at = persisted.find("\"version\"").expect("version field");
        let default_at = persisted
            .find("\"default_locale\"")
            .expect("default_locale field");
        let upstream_at = persisted.find("\"upstream\"").expect("upstream field");
        assert!(
            version_at < default_at && default_at < upstream_at,
            "locale-store:serialization-order: expected version, default_locale, upstream; got {persisted}"
        );
    }

    #[test]
    fn locale_store_migration_refuses_corrupt_and_future_bytes_without_mutation() {
        for (label, raw) in [
            ("corrupt", b"{ not json".as_slice()),
            ("future", br#"{"version":2}"#.as_slice()),
        ] {
            let dir = TestDir::new();
            fs::write(store_path(&dir.0), raw).unwrap();
            let before = fs::read(store_path(&dir.0)).unwrap();

            assert!(
                load(&dir.0).is_err(),
                "locale-store:fail-closed: {label} store loaded"
            );
            assert_eq!(
                fs::read(store_path(&dir.0)).unwrap(),
                before,
                "locale-store:non-mutation: {label} load changed durable bytes"
            );
        }
    }

    #[test]
    fn locale_store_refuses_invalid_noncanonical_and_uninstalled_values_without_mutation() {
        for (scope, class, locale) in [
            ("default", "invalid", "en_US"),
            ("default", "noncanonical", "EN-us"),
            ("default", "uninstalled", "fr-FR"),
            ("user", "invalid", "en_US"),
            ("user", "noncanonical", "EN-us"),
            ("user", "uninstalled", "fr-FR"),
        ] {
            let dir = TestDir::new();
            let mut value = serde_json::to_value(claimed()).unwrap();
            match scope {
                "default" => {
                    value
                        .as_object_mut()
                        .unwrap()
                        .insert("default_locale".into(), serde_json::json!(locale));
                }
                "user" => {
                    value["users"][0]
                        .as_object_mut()
                        .unwrap()
                        .insert("locale".into(), serde_json::json!(locale));
                }
                _ => unreachable!(),
            }
            fs::write(
                store_path(&dir.0),
                serde_json::to_vec_pretty(&value).unwrap(),
            )
            .unwrap();
            let before = fs::read(store_path(&dir.0)).unwrap();

            assert!(
                load(&dir.0).is_err(),
                "locale-store:fail-closed:{scope}:{class}: {locale} loaded"
            );
            assert_eq!(
                fs::read(store_path(&dir.0)).unwrap(),
                before,
                "locale-store:non-mutation:{scope}:{class}: load changed durable bytes"
            );
        }
    }

    #[test]
    fn future_version_refuses_to_load() {
        let dir = TestDir::new();
        fs::write(store_path(&dir.0), r#"{"version": 2}"#).unwrap();
        let err = load(&dir.0).unwrap_err();
        assert!(err.contains("version 2"), "{err}");
    }

    #[test]
    fn stale_tmp_from_a_crashed_save_is_cleaned_up() {
        let dir = TestDir::new();
        save(&dir.0, &claimed()).unwrap();
        fs::write(dir.0.join("config.json.tmp"), "half a save").unwrap();
        assert!(load(&dir.0).unwrap().is_some());
        assert!(!dir.0.join("config.json.tmp").exists());
    }

    #[test]
    fn validate_rejects_bad_shapes() {
        type Mutation = Box<dyn Fn(&mut StoredConfig)>;
        let cases: Vec<(&str, Mutation)> = vec![
            (
                "dup user",
                Box::new(|sc| sc.users.push(sc.users[0].clone())),
            ),
            (
                "two superusers",
                Box::new(|sc| {
                    let mut u = sc.users[0].clone();
                    u.username = "root2".into();
                    sc.users.push(u);
                }),
            ),
            (
                "bad username",
                Box::new(|sc| sc.users[0].username = "a b".into()),
            ),
            (
                "empty hash",
                Box::new(|sc| sc.users[0].password_hash.clear()),
            ),
            ("rpm zero", Box::new(|sc| sc.upstream.nim_keys[0].rpm = 0)),
            (
                "rpm huge",
                Box::new(|sc| sc.upstream.nim_keys[0].rpm = 10_001),
            ),
            (
                "dup nim key",
                Box::new(|sc| {
                    let k = sc.upstream.nim_keys[0].clone();
                    sc.upstream.nim_keys.push(k);
                }),
            ),
            (
                "dangling owner",
                Box::new(|sc| sc.upstream.nim_keys[0].owner = "ghost".into()),
            ),
            (
                "superuser without enabled key",
                Box::new(|sc| sc.upstream.nim_keys[0].enabled = false),
            ),
            (
                "heartbeat >= max_wait",
                Box::new(|sc| sc.limits.heartbeat_secs = 900),
            ),
            ("zero inflight", Box::new(|sc| sc.limits.max_inflight = 0)),
            (
                "bad base_url",
                Box::new(|sc| sc.upstream.base_url = "ftp://x".into()),
            ),
            (
                "bad governor cap",
                Box::new(|sc| {
                    sc.governor.overrides.insert("m".into(), 0);
                }),
            ),
            ("version not 1", Box::new(|sc| sc.version = 2)),
            (
                "heartbeat zero",
                Box::new(|sc| sc.limits.heartbeat_secs = 0),
            ),
            (
                "request timeout zero",
                Box::new(|sc| sc.limits.request_timeout_secs = 0),
            ),
            (
                "empty nim key",
                Box::new(|sc| sc.upstream.nim_keys[0].key = "   ".into()),
            ),
            (
                "bad client key name",
                Box::new(|sc| {
                    sc.client_auth.keys.push(ClientKey {
                        name: "a b".into(),
                        secret_sha256: "a".repeat(64),
                        last4: "aaaa".into(),
                        owner: "root".into(),
                    })
                }),
            ),
            (
                "duplicate client key name",
                Box::new(|sc| {
                    for _ in 0..2 {
                        sc.client_auth.keys.push(ClientKey {
                            name: "dup".into(),
                            secret_sha256: "b".repeat(64),
                            last4: "bbbb".into(),
                            owner: "root".into(),
                        });
                    }
                }),
            ),
            (
                "client key dangling owner",
                Box::new(|sc| {
                    sc.client_auth.keys.push(ClientKey {
                        name: "ck".into(),
                        secret_sha256: "c".repeat(64),
                        last4: "cccc".into(),
                        owner: "ghost".into(),
                    })
                }),
            ),
        ];
        for (name, mutate) in cases {
            let mut sc = claimed();
            mutate(&mut sc);
            assert!(validate(&sc).is_err(), "{name} should be rejected");
        }
    }

    #[test]
    fn validate_accepts_client_keys_and_rejects_bad_digests() {
        let mut sc = claimed();
        sc.client_auth.keys.push(ClientKey {
            name: "opencode".into(),
            secret_sha256: "a".repeat(64),
            last4: "aaaa".into(),
            owner: "root".into(),
        });
        validate(&sc).expect("well-formed client key");
        sc.client_auth.keys[0].secret_sha256 = "nothex".into();
        assert!(validate(&sc).is_err());
    }

    fn extra(name: &str) -> UpstreamEndpoint {
        UpstreamEndpoint {
            name: name.into(),
            base_url: "https://extra.invalid".into(),
            enabled: true,
            keys: vec![NimKey {
                key: format!("key-{name}"),
                owner: "root".into(),
                enabled: true,
                rpm: 40,
            }],
            models: Vec::new(),
            supports_stream_options: true,
        }
    }

    #[test]
    fn extra_upstreams_validate_names_urls_and_models() {
        let mut sc = claimed();
        sc.upstreams.push(extra("openai"));
        validate(&sc).expect("a well-formed extra group");

        // The primary's name is reserved for the primary.
        let mut bad = claimed();
        let mut ep = extra("nvidia");
        ep.keys[0].key = "other-key".into();
        bad.upstreams.push(ep);
        assert!(validate(&bad).is_err(), "reserved name rejected");

        // Non-http(s) URLs are refused, like the primary's.
        let mut bad = claimed();
        let mut ep = extra("bad");
        ep.base_url = "ftp://x".into();
        bad.upstreams.push(ep);
        assert!(validate(&bad).is_err(), "bad url rejected");

        // Model entries use the model-id charset, with no duplicates.
        for models in [
            vec!["has space".to_owned()],
            vec!["m".to_owned(), "m".to_owned()],
        ] {
            let mut bad = claimed();
            let mut ep = extra("bad");
            ep.models = models;
            bad.upstreams.push(ep);
            assert!(validate(&bad).is_err(), "bad allowlist rejected");
        }

        // Duplicate group names are rejected.
        let mut dup = claimed();
        dup.upstreams.push(extra("openai"));
        dup.upstreams.push(extra("openai"));
        assert!(validate(&dup).is_err(), "duplicate names rejected");
    }

    #[test]
    fn nim_keys_are_unique_across_groups() {
        let mut sc = claimed();
        let mut ep = extra("openai");
        ep.keys[0].key = "nvapi-one".into(); // collides with the primary key
        sc.upstreams.push(ep);
        assert_eq!(validate(&sc).unwrap_err(), "duplicate NIM key");
    }

    #[test]
    fn disabled_models_validate_shape_and_cap() {
        let mut sc = claimed();
        sc.disabled_models = vec!["org/model-1".into()];
        validate(&sc).expect("a well-formed disabled list");
        sc.disabled_models.push("org/model-1".into());
        assert!(validate(&sc).is_err(), "duplicate disabled model rejected");
        sc.disabled_models = vec!["has space".into()];
        assert!(validate(&sc).is_err(), "bad disabled model rejected");
        sc.disabled_models = (0..257).map(|i| format!("m/{i}")).collect();
        assert!(validate(&sc).is_err(), "disabled list is capped");
    }

    #[test]
    fn valid_model_id_matches_the_request_path_charset() {
        assert!(valid_model_id("meta/llama-3.3-70b"));
        assert!(valid_model_id("org/gpt-4:free"));
        assert!(!valid_model_id(""));
        assert!(!valid_model_id("has space"));
        assert!(!valid_model_id(&"a".repeat(129)));
    }

    #[test]
    fn pool_specs_tag_lanes_with_their_group() {
        let mut sc = claimed();
        sc.upstreams.push(extra("openai"));
        let specs = sc.pool_specs();
        assert_eq!(specs.len(), 2);
        assert_eq!(specs[0].endpoint, 0);
        assert_eq!(specs[0].upstream, PRIMARY_UPSTREAM);
        assert_eq!(specs[1].endpoint, 1);
        assert_eq!(specs[1].upstream, "openai");
        assert_eq!(specs[1].base_url, "https://extra.invalid");
        // A disabled group parks its lanes as carriers (never granted).
        sc.upstreams[0].enabled = false;
        let specs = sc.pool_specs();
        assert!(specs[0].enabled, "primary lane stays enabled");
        assert!(!specs[1].enabled, "disabled-group lane parks as carrier");
    }

    #[test]
    fn pool_floor_counts_enabled_keys_on_enabled_groups() {
        let mut sc = claimed();
        // Disabling the primary group drops the floor unless another
        // enabled group carries a superuser key.
        sc.upstream.enabled = false;
        assert!(validate(&sc).is_err(), "floor lost with primary disabled");
        sc.upstreams.push(extra("openai"));
        validate(&sc).expect("extra group restores the floor");
    }

    #[test]
    fn legacy_stores_default_to_a_single_enabled_group() {
        // Stores written before multi-upstream support carry no new fields:
        // they load as one enabled catch-all group with no disabled models.
        let sc: StoredConfig = serde_json::from_str("{}").unwrap();
        assert!(sc.upstreams.is_empty());
        assert!(sc.disabled_models.is_empty());
        assert!(sc.upstream.enabled);
        assert!(sc.upstream.models.is_empty());
        assert_eq!(sc.pool_specs().len(), 0);
        let rt = sc.runtime();
        assert_eq!(rt.endpoints.len(), 1);
        assert_eq!(rt.endpoints[0].name, PRIMARY_UPSTREAM);
        assert!(rt.disabled_models.is_empty());
    }

    #[test]
    fn recovery_store_with_orphan_keys_is_valid_until_claimed() {
        // users hand-emptied on the volume: keys keep dangling owners and the
        // store must still load so the wizard can reassign them.
        let mut sc = claimed();
        sc.users.clear();
        validate(&sc).expect("recovery store loads");
    }

    #[test]
    fn runtime_maps_mode_and_trims_base_url() {
        let mut sc = claimed();
        sc.upstream.base_url = "http://mock:9999/".into();
        sc.client_auth.keys.push(ClientKey {
            name: "opencode".into(),
            secret_sha256: "b".repeat(64),
            last4: "bbbb".into(),
            owner: "root".into(),
        });
        let rt = sc.runtime();
        assert_eq!(rt.base_url, "http://mock:9999");
        assert_eq!(
            rt.clients.as_ref().unwrap().get(&"b".repeat(64)).unwrap(),
            "opencode"
        );
        sc.client_auth.mode = Mode::Open;
        assert!(sc.runtime().clients.is_none());
    }
}

/// Fuzzing-only surface (see fuzz/): the store parser must never panic on
/// arbitrary operator-edited JSON, and a parsed config must round-trip to a
/// serialization fixpoint (what we save is what we load).
#[cfg(fuzzing)]
#[doc(hidden)]
pub mod fuzz {
    pub fn config_roundtrip(data: &[u8]) {
        let Ok(text) = std::str::from_utf8(data) else {
            return;
        };
        if let Ok(cfg) = serde_json::from_str::<super::StoredConfig>(text) {
            let ser = serde_json::to_string(&cfg).expect("a parsed config must serialize");
            let re: super::StoredConfig =
                serde_json::from_str(&ser).expect("a saved config must parse back");
            let ser2 = serde_json::to_string(&re).expect("re-serialize");
            assert_eq!(
                ser, ser2,
                "serialize -> parse -> serialize must be a fixpoint"
            );
        }
    }
}
