"use strict";
/* theme: respect saved preference or OS */
(function(){var s=localStorage.getItem('theme');if(s==='light'||s==='dark')document.documentElement.setAttribute('data-theme',s);else if(window.matchMedia('(prefers-color-scheme:light)').matches)document.documentElement.setAttribute('data-theme','light');else document.documentElement.setAttribute('data-theme','dark')})();
const $ = (id) => document.getElementById(id);
const setErrorText = (text) => { $("err").textContent = text || ""; };
const EMERGENCY_MESSAGE = "Open Proxy interface failed to load.";
let MSG;
function failInterface() {
  document.body.replaceChildren(document.createTextNode(EMERGENCY_MESSAGE));
  document.body.hidden = false;
}
function presentationStylesheetReady() {
  const sheet = document.getElementById("presentation-stylesheet")?.sheet;
  try { return Boolean(sheet?.cssRules.length); }
  catch { return false; }
}
function validBootstrap(value) {
  return value
    && Object.keys(value).sort().join(",") === "installed_locales,server_default"
    && Array.isArray(value.installed_locales)
    && value.installed_locales.length > 0
    && value.installed_locales.every(locale => typeof locale === "string")
    && typeof value.server_default === "string"
    && value.installed_locales.includes(value.server_default);
}
function validCatalog(value, locale) {
  return value
    && Object.keys(value).sort().join(",") === "locale,messages"
    && value.locale === locale
    && value.messages
    && !Array.isArray(value.messages)
    && typeof value.messages === "object"
    && Object.values(value.messages).every(value => typeof value === "string");
}
async function responseJson(path) {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("startup request failed");
  return response.json();
}
const catalogReady = (async () => {
  if (!presentationStylesheetReady()) return;
  const bootstrap = await responseJson("/api/locale-bootstrap");
  if (!validBootstrap(bootstrap)) throw new Error("invalid locale bootstrap");
  const locale = bootstrap.server_default;
  const catalog = await responseJson(
    `/assets/public/locales/${encodeURIComponent(locale)}.json`,
  );
  if (!validCatalog(catalog, locale)) throw new Error("invalid locale catalog");
  MSG = catalog.messages;
  document.documentElement.lang = locale;
})().catch(() => {
  failInterface();
});

/* ---------- i18n ----------
   Catalog values remain plain Unicode text. Native DOM sinks own ordinary
   element and text-bearing attribute contexts. Structured messages splice
   fixed caller-created nodes between text nodes; catalog text is never HTML. */
const message = (id, params = {}) => {
  let text = MSG[id] === undefined ? id : MSG[id];
  for (const key in params)
    text = text.split("{" + key + "}").join(String(params[key]));
  return text;
};
const I18N_TEXT_ATTRS = new Set(["title", "placeholder", "aria-label", "alt"]);
function assertMessageTextTarget(node) {
  const context = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  if (!context ||
      context instanceof HTMLScriptElement ||
      context instanceof HTMLStyleElement ||
      context instanceof SVGElement ||
      context.closest?.("script,style,svg"))
    throw new Error("forbidden catalog text target");
}
function setMessageText(node, id, params = {}) {
  assertMessageTextTarget(node);
  node.textContent = message(id, params);
}
function setMessageAttr(node, attr, id, params = {}) {
  if (!I18N_TEXT_ATTRS.has(attr))
    throw new Error(`forbidden catalog attribute: ${attr}`);
  node.setAttribute(attr, message(id, params));
}
function setMessageWithNodes(node, id, replacements) {
  assertMessageTextTarget(node);
  for (const [, replacement] of replacements) {
    assertMessageTextTarget(replacement);
    if (replacement.querySelector?.("script,style,svg"))
      throw new Error("forbidden catalog text target");
  }
  let text = message(id);
  const children = [];
  while (text) {
    let next = null;
    for (const [token, replacement] of replacements) {
      const at = text.indexOf(token);
      if (at >= 0 && (!next || at < next.at))
        next = { at, replacement, token };
    }
    if (!next) {
      children.push(document.createTextNode(text));
      break;
    }
    if (next.at) children.push(document.createTextNode(text.slice(0, next.at)));
    children.push(next.replacement.cloneNode(true));
    text = text.slice(next.at + next.token.length);
  }
  node.replaceChildren(...children);
}
function setEmphasizedMessage(node, id, emphasis) {
  assertMessageTextTarget(node);
  assertMessageTextTarget(emphasis);
  if (emphasis.querySelector?.("script,style,svg"))
    throw new Error("forbidden catalog text target");
  const text = message(id);
  const open = text.indexOf("{b}");
  const close = text.indexOf("{/b}", open + 3);
  if (open < 0 || close < 0)
    throw new Error(`invalid emphasis placeholders: ${id}`);
  emphasis.textContent = text.slice(open + 3, close);
  node.replaceChildren(
    document.createTextNode(text.slice(0, open)),
    emphasis,
    document.createTextNode(text.slice(close + 4)),
  );
}
function applyStatic(root) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    setMessageText(el, el.dataset.i18n);
  });
  // Own first text node — used for <title>, whose content is plain text.
  root.querySelectorAll("[data-i18n-text]").forEach(el => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.textContent.trim()) { setMessageText(n, el.dataset.i18nText); break; }
    }
  });
  root.querySelectorAll("[data-i18n-attr]").forEach(el => {
    el.dataset.i18nAttr.split(",").forEach(pair => {
      const i = pair.indexOf(":");
      const attr = pair.slice(0, i);
      setMessageAttr(el, attr, pair.slice(i + 1));
    });
  });
}
function initializeSetup() {
  applyStatic(document);
  const keyLiteral = document.createElement("code");
  keyLiteral.textContent = "npk_\u2026";
  const endpointLiteral = document.createElement("code");
  endpointLiteral.textContent = "/v1";
  setMessageWithNodes($("mintkey-label"), "setup.step3.mintkey", [
    ["{key}", keyLiteral],
    ["{endpoint}", endpointLiteral],
  ]);
  setEmphasizedMessage(
    $("mintwarn"),
    "setup.step3.mintwarn",
    document.createElement("b"),
  );
  setEmphasizedMessage(
    $("setup-complete-intro"),
    "setup.step4.intro",
    document.createElement("b"),
  );
  document.body.hidden = false;
}

/* ========== Multi-provider groups ========== */

let groups = []; // [{name, base_url, keys: [{key, rpm, models}]}]

function createDefaultGroup() {
  return { name: "", base_url: "", keys: [] };
}

// Ensure at least one group exists.
if (groups.length === 0) groups.push(createDefaultGroup());

function show(n) {
  [1,2,3].forEach(i => { $("step"+i).hidden = i !== n; $("s"+i).classList.toggle("on", i <= n); });
  setErrorText("");
}
function mask(k) { return k.length > 8 ? k.slice(0,6) + "\u2022\u2022\u2022\u2022" + k.slice(-4) : "\u2022\u2022\u2022\u2022"; }

/* --- Render group cards --- */
function renderGroups() {
  const container = $("groups");
  container.innerHTML = "";
  groups.forEach((group, gi) => {
    const card = document.createElement("div");
    card.className = "group-card";
    card.dataset.gi = gi;

    // Group header: name input + remove button
    const header = document.createElement("div");
    header.className = "group-header";
    const nameInput = document.createElement("input");
    nameInput.className = "group-name";
    nameInput.type = "text";
    nameInput.placeholder = "Provider " + (gi + 1);
    nameInput.value = group.name;
    nameInput.oninput = () => { groups[gi].name = nameInput.value; };
    header.appendChild(nameInput);
    if (groups.length > 1) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "ghost";
      removeBtn.textContent = "\u00d7";
      removeBtn.onclick = () => { groups.splice(gi, 1); renderGroups(); };
      header.appendChild(removeBtn);
    }
    card.appendChild(header);

    // Base URL
    const baseRow = document.createElement("div");
    baseRow.className = "group-base";
    const baseLabel = document.createElement("label");
    setMessageText(baseLabel, "setup.step2.group_base_url");
    const baseInput = document.createElement("input");
    baseInput.className = "base-url";
    baseInput.type = "url";
    baseInput.placeholder = "https://integrate.api.nvidia.com";
    baseInput.value = group.base_url;
    baseInput.oninput = () => { groups[gi].base_url = baseInput.value; };
    baseRow.append(baseLabel, baseInput);
    card.appendChild(baseRow);

    // Key list
    const keyList = document.createElement("ul");
    keyList.className = "keys";
    group.keys.forEach((keyObj, ki) => {
      const row = document.createElement("li");
      const ok = document.createElement("span");
      ok.className = "ok";
      ok.textContent = "\u2713";
      const masked = document.createElement("code");
      masked.textContent = mask(keyObj.key);
      const meta = document.createElement("span");
      meta.className = "meta";
      setMessageText(meta, "setup.step2.key_meta", { models: keyObj.models, rpm: keyObj.rpm });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost";
      remove.textContent = "\u00d7";
      remove.onclick = () => { groups[gi].keys.splice(ki, 1); renderGroups(); };
      row.append(ok, " ", masked, meta, remove);
      keyList.appendChild(row);
    });
    card.appendChild(keyList);

    // Add key row
    const addRow = document.createElement("div");
    addRow.className = "addrow";
    const keyInput = document.createElement("input");
    keyInput.className = "key";
    keyInput.type = "password";
    keyInput.placeholder = "nvapi-\u2026";
    const rpmInput = document.createElement("input");
    rpmInput.className = "rpm";
    rpmInput.type = "number";
    rpmInput.value = "40";
    rpmInput.min = "1";
    rpmInput.max = "10000";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "ghost";
    setMessageText(addBtn, "setup.step2.addkey");
    addBtn.onclick = async () => {
      const key = keyInput.value.trim(), rpm = Math.max(1, Math.min(10000, +rpmInput.value || 40));
      if (!key) return setMessageText($("err"), "setup.step2.error.key_required");
      if (groups[gi].keys.some(k => k.key === key))
        return setMessageText($("err"), "setup.step2.error.key_duplicate");
      setErrorText("");
      addBtn.disabled = true; setMessageText(addBtn, "setup.step2.validating");
      try {
        const body = { key };
        const base = baseInput.value.trim();
        if (base) body.base_url = base;
        const r = await fetch("/setup/validate-key", { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const v = await r.json();
        if (v.ok) { groups[gi].keys.push({ key, rpm, models: v.models }); keyInput.value = ""; renderGroups(); }
        else setMessageText($("err"), "setup.step2.error.validation_failed", { error: v.error || r.status });
      } catch (e) { setMessageText($("err"), "setup.step2.error.validation_request", { error: e }); }
      addBtn.disabled = false; setMessageText(addBtn, "setup.step2.addkey");
    };
    addRow.append(keyInput, rpmInput, addBtn);
    card.appendChild(addRow);

    container.appendChild(card);
  });

  // "Add provider" button visibility
  $("addgroup").hidden = false;
  // Continue enabled only when every group has >= 1 key
  $("to3").disabled = !groups.every(g => g.keys.length > 0);
}

$("addgroup").onclick = () => { groups.push(createDefaultGroup()); renderGroups(); };

/* --- Step transitions --- */

$("to2").onclick = () => {
  const u = $("username").value.trim(), p = $("password").value;
  if (!/^[A-Za-z0-9._-]{1,32}$/.test(u)) return setMessageText($("err"), "setup.step1.error.username_charset");
  if (p.length < 10) return setMessageText($("err"), "setup.step1.error.password_length");
  if (p !== $("confirm").value) return setMessageText($("err"), "setup.step1.error.password_mismatch");
  renderGroups();
  show(2);
};
$("back1").onclick = () => show(1);
$("back2").onclick = () => show(2);

/* --- Review (step 3) --- */

function apiAccessMessageId() {
  return $("mintkey").checked
    ? "setup.step3.api_access_keyed"
    : "setup.step3.api_access_open";
}

$("to3").onclick = () => {
  const review = $("review");
  review.innerHTML = "";

  // Superuser row
  const suRow = document.createElement("div");
  const suLabel = document.createElement("span"); suLabel.className = "k";
  setMessageText(suLabel, "setup.step3.review.superuser");
  const suValue = document.createElement("span");
  suValue.textContent = $("username").value.trim();
  suRow.append(suLabel, suValue);
  review.appendChild(suRow);

  // Per-group rows
  let totalKeys = 0, totalRpm = 0;
  groups.forEach((g, i) => {
    totalKeys += g.keys.length;
    totalRpm += g.keys.reduce((a, k) => a + k.rpm, 0);
    const gRow = document.createElement("div");
    const gLabel = document.createElement("span"); gLabel.className = "k";
    setMessageText(gLabel, "setup.step3.review.group", { name: g.name || ("Provider " + (i + 1)) });
    const gValue = document.createElement("span");
    setMessageText(gValue, "setup.step3.review.keys_value", { count: g.keys.length, rpm: g.keys.reduce((a, k) => a + k.rpm, 0) });
    gRow.append(gLabel, gValue);
    review.appendChild(gRow);
  });

  // Summary row
  const sumRow = document.createElement("div");
  const sumLabel = document.createElement("span"); sumLabel.className = "k";
  setMessageText(sumLabel, "setup.step3.review.keys");
  const sumValue = document.createElement("span");
  setMessageText(sumValue, "setup.step3.review.groups_summary", { count: groups.length, keys: totalKeys });
  sumRow.append(sumLabel, sumValue);
  review.appendChild(sumRow);

  // API access row
  const apiRow = document.createElement("div");
  const apiLabel = document.createElement("span"); apiLabel.className = "k";
  setMessageText(apiLabel, "setup.step3.review.api_access");
  const apiValue = document.createElement("span");
  apiValue.id = "apiline";
  setMessageText(apiValue, apiAccessMessageId());
  apiRow.append(apiLabel, apiValue);
  review.appendChild(apiRow);

  show(3);
};

$("mintkey").onchange = () => {
  $("mintwarn").hidden = $("mintkey").checked;
  const line = document.getElementById("apiline");
  if (line) setMessageText(line, apiAccessMessageId());
};

/* --- Final screen --- */

function showConnect(secret) {
  [1,2,3].forEach(i => { $("step"+i).hidden = true; $("s"+i).classList.add("on"); });
  setErrorText("");
  $("cbase").textContent = window.location.origin + "/v1";
  $("csecret").textContent = secret;
  $("step4").hidden = false;
}
document.querySelectorAll("[data-copy]").forEach(b => {
  b.onclick = async () => {
    try { await navigator.clipboard.writeText($(b.dataset.copy).textContent); setMessageText(b, "setup.step4.copied"); }
    catch { setMessageText(b, "setup.step4.select_copy"); }
    setTimeout(() => { setMessageText(b, "setup.step4.copy"); }, 1500);
  };
});
$("opendash").onclick = () => { window.location = "/"; };

/* --- Form submit --- */

$("wiz").onsubmit = async (ev) => {
  ev.preventDefault();
  $("finish").disabled = true;
  const body = {
    username: $("username").value.trim(),
    password: $("password").value,
    groups: groups.map((g, i) => ({
      name: g.name.trim() || ("Provider " + (i + 1)),
      base_url: g.base_url.trim() || "https://integrate.api.nvidia.com",
      keys: g.keys.map(k => ({ key: k.key, rpm: k.rpm })),
    })),
  };
  if ($("mintkey").checked) body.create_client_key = { name: "default" };
  try {
    const r = await fetch("/setup", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) {
      const v = await r.json().catch(() => ({}));
      if (v.client_key && v.client_key.secret) { showConnect(v.client_key.secret); return; }
      window.location = "/";
      return;
    }
    const v = await r.json().catch(() => ({}));
    if (v.error && v.error.message) setErrorText(v.error.message);
    else setMessageText($("err"), "setup.step3.error.failed", { status: r.status });
  } catch (e) { setMessageText($("err"), "setup.step3.error.request", { error: e }); }
  $("finish").disabled = false;
};

catalogReady.then(() => {
  if (MSG) initializeSetup();
}).catch(() => {
  failInterface();
});
