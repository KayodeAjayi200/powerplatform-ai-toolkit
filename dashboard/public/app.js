const stateNames = [
  "project-state",
  "data-model",
  "screen-plan",
  "design-system",
  "devops-plan",
  "change-requests",
  "audit-log",
];

let state = {};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function setStatus(text) {
  $("#saveStatus").textContent = text;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || response.statusText);
  }
  return response.json();
}

async function loadState() {
  state = await api("/api/state");
  normalizeState();
  render();
  setStatus(`Loaded ${new Date().toLocaleTimeString()}`);
}

async function saveState(name, value) {
  await api(`/api/state/${name}`, {
    method: "POST",
    body: JSON.stringify(value),
  });
  state[name] = value;
  setStatus(`Saved ${name}`);
}

async function saveAll() {
  for (const name of stateNames) {
    await saveState(name, state[name]);
  }
  await api("/api/events", {
    method: "POST",
    body: JSON.stringify({
      type: "save-all",
      message: "Saved all dashboard state files from the browser.",
    }),
  });
  await loadState();
}

function render() {
  normalizeState();
  renderHeader();
  renderOverview();
  renderProjectForm();
  renderErd();
  renderEntities();
  renderScreens();
  renderTheme();
  renderDevops();
  renderChanges();
  renderRaw();
}

function normalizeState() {
  state["project-state"] = state["project-state"] || {};
  state["data-model"] = {
    entities: [],
    relationships: [],
    ...(state["data-model"] || {}),
  };
  state["data-model"].entities = Array.isArray(state["data-model"].entities) ? state["data-model"].entities : [];
  state["data-model"].relationships = Array.isArray(state["data-model"].relationships) ? state["data-model"].relationships : [];

  state["screen-plan"] = {
    screens: [],
    ...(state["screen-plan"] || {}),
  };
  state["screen-plan"].screens = Array.isArray(state["screen-plan"].screens) ? state["screen-plan"].screens : [];

  state["design-system"] = {
    theme: {},
    ...(state["design-system"] || {}),
  };
  state["design-system"].theme = state["design-system"].theme || {};

  state["devops-plan"] = state["devops-plan"] || {};
  state["change-requests"] = {
    requests: [],
    ...(state["change-requests"] || {}),
  };
  state["change-requests"].requests = Array.isArray(state["change-requests"].requests) ? state["change-requests"].requests : [];
  state["audit-log"] = {
    events: [],
    ...(state["audit-log"] || {}),
  };
  state["audit-log"].events = Array.isArray(state["audit-log"].events) ? state["audit-log"].events : [];
}

function renderHeader() {
  const project = state["project-state"] || {};
  $("#projectTitle").textContent = project.projectName || "Power Platform Project";
  $("#projectSubtitle").textContent = [
    project.environment?.name,
    project.solution?.displayName || project.solution?.name,
    project.canvasApp?.name,
  ].filter(Boolean).join(" • ") || "Local dashboard state";
}

function renderOverview() {
  const project = state["project-state"] || {};
  const dataModel = state["data-model"] || {};
  const screens = state["screen-plan"] || {};
  const changes = state["change-requests"] || {};

  const cards = [
    ["Environment", project.environment?.name || "Not set"],
    ["Canvas App", project.canvasApp?.name || "Not set"],
    ["Entities", (dataModel.entities || []).length],
    ["Open Requests", (changes.requests || []).filter((r) => r.status !== "done").length],
  ];

  $("#overviewCards").innerHTML = cards.map(([label, value]) => `
    <article class="card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `).join("");

  const audit = state["audit-log"]?.events || [];
  $("#auditList").innerHTML = audit.slice(-8).reverse().map((event) => `
    <div class="timeline-item">
      <strong>${escapeHtml(event.type || "event")}</strong>
      <p>${escapeHtml(event.message || "")}</p>
      <small>${escapeHtml(event.at || "")}</small>
    </div>
  `).join("") || "<p>No activity yet.</p>";
}

function renderProjectForm() {
  const project = state["project-state"] || {};
  const fields = [
    ["projectName", "Project name", project.projectName || ""],
    ["environment.name", "Environment name", project.environment?.name || ""],
    ["environment.id", "Environment ID", project.environment?.id || ""],
    ["environment.orgUrl", "Org URL", project.environment?.orgUrl || ""],
    ["solution.name", "Solution name", project.solution?.name || ""],
    ["canvasApp.name", "Canvas app name", project.canvasApp?.name || ""],
    ["canvasApp.appId", "Canvas app ID", project.canvasApp?.appId || ""],
    ["canvasApp.studioUrl", "Studio URL", project.canvasApp?.studioUrl || ""],
  ];

  $("#projectForm").innerHTML = fields.map(([path, label, value]) => `
    <label>${escapeHtml(label)}
      <input data-project-path="${escapeHtml(path)}" value="${escapeAttr(value)}" />
    </label>
  `).join("");

  $$("[data-project-path]").forEach((input) => {
    input.addEventListener("change", () => {
      setDeep(project, input.dataset.projectPath, input.value);
      state["project-state"] = project;
      renderHeader();
    });
  });
}

function renderErd() {
  const model = state["data-model"] || { entities: [], relationships: [] };
  const entities = model.entities || [];
  const width = Math.max(900, entities.length * 260);
  const height = Math.max(520, Math.ceil(entities.length / 3) * 230);

  const positions = entities.map((entity, index) => ({
    entity,
    x: 40 + (index % 3) * 280,
    y: 40 + Math.floor(index / 3) * 230,
  }));

  const posByName = Object.fromEntries(positions.map((p) => [p.entity.name, p]));
  const links = (model.relationships || []).map((rel) => {
    const from = posByName[rel.from];
    const to = posByName[rel.to];
    if (!from || !to) return "";
    return `<path d="M ${from.x + 220} ${from.y + 55} C ${from.x + 260} ${from.y + 55}, ${to.x - 40} ${to.y + 55}, ${to.x} ${to.y + 55}" class="link"/>
      <text x="${(from.x + to.x + 220) / 2}" y="${(from.y + to.y) / 2 + 42}" class="link-label">${escapeHtml(rel.label || rel.type || "")}</text>`;
  }).join("");

  const nodes = positions.map(({ entity, x, y }) => {
    const fields = (entity.fields || []).slice(0, 6).map((field, idx) => `
      <text x="${x + 16}" y="${y + 82 + idx * 20}" class="field">${field.primary ? "◆ " : ""}${escapeHtml(field.name)}: ${escapeHtml(field.type || "")}</text>
    `).join("");
    return `
      <g class="entity-node">
        <rect x="${x}" y="${y}" width="220" height="176" rx="10"/>
        <text x="${x + 16}" y="${y + 30}" class="entity-title">${escapeHtml(entity.displayName || entity.name)}</text>
        <text x="${x + 16}" y="${y + 52}" class="entity-source">${escapeHtml(entity.source || "")}</text>
        ${fields}
      </g>
    `;
  }).join("");

  $("#erd").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Entity relationship diagram">
      <defs>
        <style>
          .entity-node rect { fill: #fff; stroke: #cbd5e1; stroke-width: 1.2; filter: drop-shadow(0 10px 18px rgba(15,23,42,.08)); }
          .entity-title { font: 700 15px Segoe UI, sans-serif; fill: #111827; }
          .entity-source { font: 12px Segoe UI, sans-serif; fill: #667085; }
          .field { font: 12px Segoe UI, sans-serif; fill: #344054; }
          .link { fill: none; stroke: #2563eb; stroke-width: 2; marker-end: url(#arrow); }
          .link-label { font: 12px Segoe UI, sans-serif; fill: #1d4ed8; }
        </style>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#2563eb"></path>
        </marker>
      </defs>
      ${links}
      ${nodes}
    </svg>
  `;
}

function renderEntities() {
  const model = state["data-model"] || { entities: [] };
  $("#entityEditor").innerHTML = (model.entities || []).map((entity, index) => `
    <article class="entity-card">
      <label>Name <input data-entity="${index}" data-key="name" value="${escapeAttr(entity.name || "")}" /></label>
      <label>Display name <input data-entity="${index}" data-key="displayName" value="${escapeAttr(entity.displayName || "")}" /></label>
      <label>Source <input data-entity="${index}" data-key="source" value="${escapeAttr(entity.source || "")}" /></label>
      <div class="entity-fields">
        ${(entity.fields || []).map((field) => `<span class="pill">${escapeHtml(field.name)} · ${escapeHtml(field.type || "")}</span>`).join("")}
      </div>
    </article>
  `).join("");

  $$("[data-entity]").forEach((input) => {
    input.addEventListener("change", () => {
      model.entities[Number(input.dataset.entity)][input.dataset.key] = input.value;
      state["data-model"] = model;
      renderErd();
    });
  });
}

function renderScreens() {
  const plan = state["screen-plan"] || { screens: [] };
  $("#screenList").innerHTML = (plan.screens || []).map((screen, index) => `
    <article class="screen-card">
      <div class="form-grid">
        <label>Name <input data-screen="${index}" data-key="name" value="${escapeAttr(screen.name || "")}" /></label>
        <label>Status <input data-screen="${index}" data-key="status" value="${escapeAttr(screen.status || "")}" /></label>
      </div>
      <label>Purpose <textarea data-screen="${index}" data-key="purpose" rows="3">${escapeHtml(screen.purpose || "")}</textarea></label>
    </article>
  `).join("");

  $$("[data-screen]").forEach((input) => {
    input.addEventListener("change", () => {
      plan.screens[Number(input.dataset.screen)][input.dataset.key] = input.value;
      state["screen-plan"] = plan;
    });
  });
}

function renderTheme() {
  const design = state["design-system"] || { theme: {} };
  const theme = design.theme || {};
  $("#themeEditor").innerHTML = Object.entries(theme).map(([key, value]) => `
    <label>${escapeHtml(key)}
      <input data-theme="${escapeHtml(key)}" value="${escapeAttr(value)}" />
    </label>
  `).join("");

  $$("[data-theme]").forEach((input) => {
    input.addEventListener("change", () => {
      theme[input.dataset.theme] = input.value;
      design.theme = theme;
      state["design-system"] = design;
      applyThemePreview();
    });
  });
  applyThemePreview();
}

function applyThemePreview() {
  const theme = state["design-system"]?.theme || {};
  document.documentElement.style.setProperty("--brand", theme.brandPrimary || "#2563EB");
  document.documentElement.style.setProperty("--accent", theme.brandAccent || "#0F766E");
  document.documentElement.style.setProperty("--panel", theme.surface || "#FFFFFF");
  document.documentElement.style.setProperty("--ink", theme.textPrimary || "#111827");
  document.documentElement.style.setProperty("--muted", theme.textSecondary || "#6B7280");
}

function renderDevops() {
  const devops = state["devops-plan"] || {};
  const groups = [
    ["Epics", devops.epics || []],
    ["Features", devops.features || []],
    ["User Stories", devops.userStories || []],
    ["Queries", devops.queries || []],
  ];
  $("#devopsSummary").innerHTML = groups.map(([title, items]) => `
    <article class="entity-card">
      <strong>${escapeHtml(title)}</strong>
      <div class="entity-fields">
        ${items.length ? items.map((item) => `<span class="pill">${escapeHtml(item.title || item.name || String(item))}</span>`).join("") : "<span class='pill'>None yet</span>"}
      </div>
    </article>
  `).join("");
}

function renderChanges() {
  const changes = state["change-requests"] || { requests: [] };
  $("#changeList").innerHTML = (changes.requests || []).slice().reverse().map((request) => `
    <article class="change-card">
      <strong>${escapeHtml(request.title || "Untitled request")}</strong>
      <p>${escapeHtml(request.details || "")}</p>
      <span class="pill">${escapeHtml(request.status || "new")}</span>
    </article>
  `).join("") || "<p>No change requests yet.</p>";
}

function renderRaw() {
  const select = $("#rawSelect");
  if (!select.options.length) {
    select.innerHTML = stateNames.map((name) => `<option value="${name}">${name}</option>`).join("");
  }
  $("#rawEditor").value = JSON.stringify(state[select.value || stateNames[0]], null, 2);
}

function setDeep(object, dottedPath, value) {
  const parts = dottedPath.split(".");
  let target = object;
  for (const part of parts.slice(0, -1)) {
    target[part] = target[part] || {};
    target = target[part];
  }
  target[parts[parts.length - 1]] = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".nav-item").forEach((item) => item.classList.remove("active"));
      $$(".view").forEach((view) => view.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.view}`).classList.add("active");
    });
  });

  $("#refreshBtn").addEventListener("click", loadState);
  $("#saveAllBtn").addEventListener("click", saveAll);

  $("#addEntityBtn").addEventListener("click", () => {
    const model = state["data-model"];
    model.entities.push({
      name: "NewEntity",
      displayName: "New Entity",
      source: "Dataverse",
      fields: [{ name: "Name", type: "Text", required: true }],
    });
    renderEntities();
    renderErd();
  });

  $("#addScreenBtn").addEventListener("click", () => {
    const plan = state["screen-plan"];
    plan.screens.push({
      name: "New Screen",
      status: "planned",
      purpose: "",
      dataSources: [],
      controls: [],
    });
    renderScreens();
  });

  $("#addChangeBtn").addEventListener("click", () => {
    const title = $("#changeTitle").value.trim();
    const details = $("#changeDetails").value.trim();
    if (!title && !details) return;
    const changes = state["change-requests"];
    changes.requests.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title,
      details,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    $("#changeTitle").value = "";
    $("#changeDetails").value = "";
    renderChanges();
  });

  $("#rawSelect").addEventListener("change", renderRaw);
  $("#saveRawBtn").addEventListener("click", async () => {
    const name = $("#rawSelect").value;
    const value = JSON.parse($("#rawEditor").value);
    await saveState(name, value);
    render();
  });
}

bindEvents();
loadState().catch((error) => {
  console.error(error);
  setStatus(`Error: ${error.message}`);
});
