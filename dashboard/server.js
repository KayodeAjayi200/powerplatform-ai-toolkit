const http = require("http");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4817);
const ROOT = __dirname;
const PROJECT_ROOT = path.resolve(ROOT, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const STATE_DIR = path.join(ROOT, "state");

const STATE_FILES = {
  "project-state": "project-state.json",
  "data-model": "data-model.json",
  "screen-plan": "screen-plan.json",
  "design-system": "design-system.json",
  "devops-plan": "devops-plan.json",
  "change-requests": "change-requests.json",
  "audit-log": "audit-log.json",
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function sendText(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 5_000_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function statePath(name) {
  const fileName = STATE_FILES[name];
  if (!fileName) return null;
  return path.join(STATE_DIR, fileName);
}

function readStateFile(name) {
  const filePath = statePath(name);
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeStateFile(name, value) {
  const filePath = statePath(name);
  if (!filePath) throw new Error(`Unknown state file: ${name}`);
  ensureStateDir();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function appendAudit(event) {
  const current = readStateFile("audit-log") || { events: [] };
  const events = Array.isArray(current.events) ? current.events : [];
  events.push({
    at: new Date().toISOString(),
    source: event.source || "dashboard",
    type: event.type || "state-change",
    message: event.message || "",
    details: event.details || {},
  });
  writeStateFile("audit-log", { events: events.slice(-500) });
}

function readAllState() {
  const state = {};
  for (const name of Object.keys(STATE_FILES)) {
    state[name] = readStateFile(name);
  }
  return state;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, {
      cwd: PROJECT_ROOT,
      windowsHide: true,
      timeout: options.timeout || 120_000,
      maxBuffer: 2_000_000,
    }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code || 0,
        command: [command, ...args].join(" "),
        stdout: String(stdout || "").trim(),
        stderr: String(stderr || "").trim(),
      });
    });
  });
}

async function gitStatus() {
  const [inside, branch, status, remotes, lastCommit] = await Promise.all([
    runCommand("git", ["rev-parse", "--is-inside-work-tree"]),
    runCommand("git", ["branch", "--show-current"]),
    runCommand("git", ["status", "--short"]),
    runCommand("git", ["remote", "-v"]),
    runCommand("git", ["log", "-1", "--oneline"]),
  ]);

  return {
    projectRoot: PROJECT_ROOT,
    isGitRepo: inside.ok && inside.stdout === "true",
    branch: branch.stdout || "",
    hasChanges: Boolean(status.stdout),
    status: status.stdout || "",
    remotes: remotes.stdout || "",
    lastCommit: lastCommit.stdout || "",
    diagnostics: { inside, branch, status, remotes, lastCommit },
  };
}

function azureRepoUrl(organizationUrl, project, repository) {
  const org = String(organizationUrl || "").replace(/\/+$/, "");
  const encodedProject = encodeURIComponent(String(project || ""));
  const encodedRepo = encodeURIComponent(String(repository || ""));
  if (!org || !encodedProject || !encodedRepo) return "";
  return `${org}/${encodedProject}/_git/${encodedRepo}`;
}

function updateDevopsRepoState(input, remoteUrl) {
  const devops = readStateFile("devops-plan") || {};
  devops.organizationUrl = input.organizationUrl || devops.organizationUrl || "";
  devops.project = input.project || devops.project || "";
  devops.repository = {
    ...(devops.repository || {}),
    name: input.repository || devops.repository?.name || "",
    remoteName: input.remoteName || devops.repository?.remoteName || "azure",
    remoteUrl: remoteUrl || devops.repository?.remoteUrl || "",
    defaultBranch: input.branch || devops.repository?.defaultBranch || "main",
    localPath: PROJECT_ROOT,
    lastUpdated: new Date().toISOString(),
  };
  writeStateFile("devops-plan", devops);
  return devops;
}

async function handleDevopsStatus(res) {
  const [git, azVersion, azDevopsExt] = await Promise.all([
    gitStatus(),
    runCommand("az", ["version"], { timeout: 20_000 }),
    runCommand("az", ["extension", "show", "--name", "azure-devops", "--output", "json"], { timeout: 20_000 }),
  ]);

  sendJson(res, 200, {
    git,
    tools: {
      git: git.diagnostics.inside.ok,
      azureCli: azVersion.ok,
      azureDevopsExtension: azDevopsExt.ok,
    },
  });
}

async function handleDevopsSetup(req, res) {
  const input = JSON.parse(await readBody(req) || "{}");
  const remoteName = input.remoteName || "azure";
  const branch = input.branch || "main";
  const repository = input.repository || "";
  const project = input.project || "";
  const organizationUrl = input.organizationUrl || "";
  const remoteUrl = input.remoteUrl || azureRepoUrl(organizationUrl, project, repository);
  const results = [];

  if (!remoteUrl) {
    sendJson(res, 400, { error: "organizationUrl, project, and repository are required when remoteUrl is not supplied." });
    return;
  }

  const currentStatus = await gitStatus();
  if (!currentStatus.isGitRepo) {
    results.push(await runCommand("git", ["init"]));
  }

  if (input.createRepo) {
    results.push(await runCommand("az", ["devops", "configure", "--defaults", `organization=${organizationUrl}`, `project=${project}`], { timeout: 60_000 }));
    const existingRepo = await runCommand("az", ["repos", "show", "--repository", repository, "--project", project, "--organization", organizationUrl, "--output", "json"], { timeout: 60_000 });
    if (existingRepo.ok) {
      results.push(existingRepo);
    } else {
      results.push(await runCommand("az", ["repos", "create", "--name", repository, "--project", project, "--organization", organizationUrl, "--output", "json"], { timeout: 120_000 }));
    }
  }

  const remotes = await runCommand("git", ["remote"]);
  const remoteNames = remotes.stdout.split(/\r?\n/).filter(Boolean);
  if (remoteNames.includes(remoteName)) {
    results.push(await runCommand("git", ["remote", "set-url", remoteName, remoteUrl]));
  } else {
    results.push(await runCommand("git", ["remote", "add", remoteName, remoteUrl]));
  }
  results.push(await runCommand("git", ["branch", "-M", branch]));

  const devops = updateDevopsRepoState({ ...input, remoteName, branch }, remoteUrl);
  appendAudit({
    type: "devops-repo-setup",
    message: `Configured Azure Repos remote '${remoteName}'.`,
    details: { remoteName, remoteUrl, branch },
  });

  sendJson(res, 200, { ok: results.every((result) => result.ok || result.stderr.includes("already exists")), results, devops });
}

async function handleDevopsCommit(req, res) {
  const input = JSON.parse(await readBody(req) || "{}");
  const message = String(input.message || "Save current Power Platform solution state").trim();
  const push = Boolean(input.push);
  const devops = readStateFile("devops-plan") || {};
  const remoteName = input.remoteName || devops.repository?.remoteName || "azure";
  const branch = input.branch || devops.repository?.defaultBranch || "main";
  const before = await gitStatus();
  const results = [];

  if (!before.isGitRepo) {
    sendJson(res, 400, { error: "Project root is not a Git repository. Set up the DevOps repo first.", status: before });
    return;
  }

  if (!before.hasChanges) {
    sendJson(res, 200, { ok: true, committed: false, message: "No changes to commit.", status: before });
    return;
  }

  results.push(await runCommand("git", ["add", "-A"]));
  const commit = await runCommand("git", ["commit", "-m", message], { timeout: 120_000 });
  results.push(commit);

  if (commit.ok && push) {
    results.push(await runCommand("git", ["push", "-u", remoteName, branch], { timeout: 180_000 }));
  }

  const after = await gitStatus();
  appendAudit({
    type: "devops-commit",
    message: push ? "Committed and pushed current solution state." : "Committed current solution state locally.",
    details: { message, push, remoteName, branch, commit: after.lastCommit },
  });

  sendJson(res, 200, { ok: results.every((result) => result.ok), committed: commit.ok, results, status: after });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalized = path
    .normalize(requested)
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, normalized);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendText(res, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (req.method === "GET" && url.pathname === "/api/state") {
      sendJson(res, 200, readAllState());
      return;
    }

    if (req.method === "GET" && parts[0] === "api" && parts[1] === "state" && parts[2]) {
      const value = readStateFile(parts[2]);
      if (value === null) {
        sendJson(res, 404, { error: "Unknown state file." });
        return;
      }
      sendJson(res, 200, value);
      return;
    }

    if (req.method === "POST" && parts[0] === "api" && parts[1] === "state" && parts[2]) {
      if (!STATE_FILES[parts[2]]) {
        sendJson(res, 404, { error: "Unknown state file." });
        return;
      }

      const body = await readBody(req);
      const value = JSON.parse(body || "null");
      if (value === null || typeof value !== "object") {
        sendJson(res, 400, { error: "State payload must be a JSON object or array." });
        return;
      }

      writeStateFile(parts[2], value);
      appendAudit({
        type: "state-write",
        message: `Updated ${STATE_FILES[parts[2]]}`,
        details: { state: parts[2] },
      });
      sendJson(res, 200, { ok: true, state: parts[2] });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/events") {
      const body = await readBody(req);
      const event = JSON.parse(body || "{}");
      appendAudit(event);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/devops/status") {
      await handleDevopsStatus(res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/devops/setup-repo") {
      await handleDevopsSetup(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/devops/commit") {
      await handleDevopsCommit(req, res);
      return;
    }

    sendJson(res, 404, { error: "Unknown API endpoint." });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

ensureStateDir();

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Power Platform project dashboard running at http://${HOST}:${PORT}`);
  console.log(`Project root: ${PROJECT_ROOT}`);
  console.log(`State directory: ${STATE_DIR}`);
});
