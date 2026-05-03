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
  renderConfig();
  renderDevops();
  renderChanges();
  renderRaw();
}

function normalizeState() {
  state["project-state"] = state["project-state"] || {};
  state["project-state"].configuration = {
    environmentVariables: [],
    connectionReferences: [],
    customConnectors: [],
    ...(state["project-state"].configuration || {}),
  };
  state["project-state"].configuration.environmentVariables = Array.isArray(state["project-state"].configuration.environmentVariables)
    ? state["project-state"].configuration.environmentVariables
    : [];
  state["project-state"].configuration.connectionReferences = Array.isArray(state["project-state"].configuration.connectionReferences)
    ? state["project-state"].configuration.connectionReferences
    : [];
  state["project-state"].configuration.customConnectors = Array.isArray(state["project-state"].configuration.customConnectors)
    ? state["project-state"].configuration.customConnectors
    : [];
  state["project-state"].security = {
    appRegistrations: [],
    servicePrincipals: [],
    apiPermissions: [],
    secretReferences: [],
    tokenReferences: [],
    ...(state["project-state"].security || {}),
  };
  for (const key of ["appRegistrations", "servicePrincipals", "apiPermissions", "secretReferences", "tokenReferences"]) {
    state["project-state"].security[key] = Array.isArray(state["project-state"].security[key])
      ? state["project-state"].security[key]
      : [];
  }
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
  state["devops-plan"].repository = state["devops-plan"].repository || {};
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

function renderConfig() {
  const project = state["project-state"] || {};
  const config = project.configuration || {};
  const security = project.security || {};
  const fields = [
    ["configuration.tenantId", "Tenant ID", config.tenantId || ""],
    ["configuration.publisherPrefix", "Publisher prefix", config.publisherPrefix || ""],
    ["configuration.region", "Region", config.region || ""],
    ["environment.orgUrl", "Dataverse org URL", project.environment?.orgUrl || ""],
  ];

  $("#configForm").innerHTML = fields.map(([path, label, value]) => `
    <label>${escapeHtml(label)}
      <input data-config-path="${escapeHtml(path)}" value="${escapeAttr(value)}" />
    </label>
  `).join("");

  $$("[data-config-path]").forEach((input) => {
    input.addEventListener("change", () => {
      setDeep(project, input.dataset.configPath, input.value);
      state["project-state"] = project;
    });
  });

  renderEditableCards("#envVarList", config.environmentVariables, [
    ["schemaName", "Schema name"],
    ["displayName", "Display name"],
    ["type", "Type"],
    ["currentValueReference", "Value/reference"],
  ]);

  renderEditableCards("#appRegList", security.appRegistrations, [
    ["name", "Name"],
    ["tenantId", "Tenant ID"],
    ["clientId", "Client/Application ID"],
    ["objectId", "Object ID"],
    ["redirectUris", "Redirect URIs"],
    ["scopes", "Scopes"],
  ]);

  renderEditableCards("#secretRefList", security.secretReferences, [
    ["name", "Name"],
    ["purpose", "Purpose"],
    ["storageLocation", "Storage location"],
    ["referenceName", "Secret/env var name"],
    ["owner", "Owner"],
    ["rotationDue", "Rotation due"],
    ["status", "Status"],
  ]);

  renderEditableCards("#tokenRefList", security.tokenReferences, [
    ["name", "Name"],
    ["purpose", "Purpose"],
    ["storageLocation", "Storage location"],
    ["expiresOn", "Expires on"],
    ["owner", "Owner"],
    ["status", "Status"],
  ]);
}

function renderEditableCards(selector, items, fields) {
  const collectionName = selector.replace("#", "");
  $(selector).innerHTML = (items || []).map((item, index) => `
    <article class="entity-card">
      <div class="form-grid compact">
        ${fields.map(([key, label]) => `
          <label>${escapeHtml(label)}
            <input data-collection="${escapeAttr(collectionName)}" data-index="${index}" data-key="${escapeAttr(key)}" value="${escapeAttr(formatFieldValue(item[key]))}" />
          </label>
        `).join("")}
      </div>
    </article>
  `).join("") || "<p>No items yet.</p>";

  $$(`[data-collection="${collectionName}"]`).forEach((input) => {
    input.addEventListener("change", () => {
      const target = collectionTarget(collectionName);
      target[Number(input.dataset.index)][input.dataset.key] = parseListValue(input.value);
    });
  });
}

function collectionTarget(collectionName) {
  const project = state["project-state"];
  const map = {
    envVarList: project.configuration.environmentVariables,
    appRegList: project.security.appRegistrations,
    secretRefList: project.security.secretReferences,
    tokenRefList: project.security.tokenReferences,
  };
  return map[collectionName] || [];
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
  const repo = devops.repository || {};
  const groups = [
    ["Epics", devops.epics || []],
    ["Features", devops.features || []],
    ["User Stories", devops.userStories || []],
    ["Queries", devops.queries || []],
    ["Repository", repo.name ? [repo] : []],
  ];
  $("#devopsSummary").innerHTML = groups.map(([title, items]) => `
    <article class="entity-card">
      <strong>${escapeHtml(title)}</strong>
      <div class="entity-fields">
        ${items.length ? items.map((item) => `<span class="pill">${escapeHtml(item.title || item.name || item.remoteUrl || String(item))}</span>`).join("") : "<span class='pill'>None yet</span>"}
      </div>
    </article>
  `).join("");

  const fields = [
    ["organizationUrl", "Organisation URL", devops.organizationUrl || ""],
    ["project", "Project", devops.project || ""],
    ["repository.name", "Repo name", repo.name || ""],
    ["repository.remoteName", "Remote name", repo.remoteName || "azure"],
    ["repository.defaultBranch", "Branch", repo.defaultBranch || "main"],
    ["repository.remoteUrl", "Remote URL (optional)", repo.remoteUrl || ""],
  ];

  $("#devopsRepoForm").innerHTML = fields.map(([path, label, value]) => `
    <label>${escapeHtml(label)}
      <input data-devops-path="${escapeHtml(path)}" value="${escapeAttr(value)}" />
    </label>
  `).join("");

  $$("[data-devops-path]").forEach((input) => {
    input.addEventListener("change", () => {
      setDeep(devops, input.dataset.devopsPath, input.value);
      state["devops-plan"] = devops;
    });
  });
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

function formatFieldValue(value) {
  return Array.isArray(value) ? value.join(", ") : (value || "");
}

function parseListValue(value) {
  return value.includes(",") ? value.split(",").map((item) => item.trim()).filter(Boolean) : value;
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

  $("#addEnvVarBtn").addEventListener("click", () => {
    state["project-state"].configuration.environmentVariables.push({
      schemaName: "new_environment_variable",
      displayName: "New environment variable",
      type: "Text",
      currentValueReference: "",
    });
    renderConfig();
  });

  $("#addAppRegBtn").addEventListener("click", () => {
    state["project-state"].security.appRegistrations.push({
      name: "New app registration",
      tenantId: "",
      clientId: "",
      objectId: "",
      redirectUris: [],
      scopes: [],
    });
    renderConfig();
  });

  $("#addSecretRefBtn").addEventListener("click", () => {
    state["project-state"].security.secretReferences.push({
      name: "New secret reference",
      purpose: "",
      storageLocation: "Azure Key Vault / GitHub Secret / environment variable",
      referenceName: "",
      owner: "",
      rotationDue: "",
      status: "unknown",
    });
    renderConfig();
  });

  $("#addTokenRefBtn").addEventListener("click", () => {
    state["project-state"].security.tokenReferences.push({
      name: "New token reference",
      purpose: "",
      storageLocation: "Not stored in dashboard",
      expiresOn: "",
      owner: "",
      status: "unknown",
    });
    renderConfig();
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

  $("#devopsStatusBtn").addEventListener("click", showDevopsStatus);
  $("#devopsSetupRepoBtn").addEventListener("click", setupDevopsRepo);
  $("#devopsCommitBtn").addEventListener("click", () => commitDevops(false));
  $("#devopsCommitPushBtn").addEventListener("click", () => commitDevops(true));

  $("#rawSelect").addEventListener("change", renderRaw);
  $("#saveRawBtn").addEventListener("click", async () => {
    const name = $("#rawSelect").value;
    const value = JSON.parse($("#rawEditor").value);
    await saveState(name, value);
    render();
  });
}

function repoPayload() {
  const devops = state["devops-plan"] || {};
  const repo = devops.repository || {};
  return {
    organizationUrl: devops.organizationUrl || "",
    project: devops.project || "",
    repository: repo.name || "",
    remoteName: repo.remoteName || "azure",
    branch: repo.defaultBranch || "main",
    remoteUrl: repo.remoteUrl || "",
    createRepo: $("#devopsCreateRepo")?.checked || false,
  };
}

function setDevopsOutput(value) {
  $("#devopsRepoStatus").textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

async function showDevopsStatus() {
  setDevopsOutput("Checking repository status...");
  const result = await api("/api/devops/status");
  setDevopsOutput(formatDevopsStatus(result));
}

async function setupDevopsRepo() {
  await saveState("devops-plan", state["devops-plan"]);
  setDevopsOutput("Configuring Azure Repos remote...");
  const result = await api("/api/devops/setup-repo", {
    method: "POST",
    body: JSON.stringify(repoPayload()),
  });
  state["devops-plan"] = result.devops || state["devops-plan"];
  renderDevops();
  setDevopsOutput(result);
}

async function commitDevops(push) {
  await saveAll();
  setDevopsOutput(push ? "Committing and pushing..." : "Committing...");
  const payload = {
    ...repoPayload(),
    message: $("#devopsCommitMessage").value || "Save current Power Platform solution state",
    push,
  };
  const result = await api("/api/devops/commit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setDevopsOutput(result.committed === false ? result.message : result);
  await loadState();
}

function formatDevopsStatus(result) {
  const git = result.git || {};
  const lines = [
    `Project root: ${git.projectRoot || ""}`,
    `Git repo: ${git.isGitRepo ? "yes" : "no"}`,
    `Branch: ${git.branch || "(none)"}`,
    `Changes: ${git.hasChanges ? "yes" : "no"}`,
    `Git available: ${result.tools?.git ? "yes" : "no"}`,
    `Azure CLI available: ${result.tools?.azureCli ? "yes" : "no"}`,
    `Azure DevOps extension: ${result.tools?.azureDevopsExtension ? "yes" : "no"}`,
    "",
    "Remotes:",
    git.remotes || "(none)",
    "",
    "Changed files:",
    git.status || "(none)",
  ];
  return lines.join("\n");
}

bindEvents();
loadState().catch((error) => {
  console.error(error);
  setStatus(`Error: ${error.message}`);
});
