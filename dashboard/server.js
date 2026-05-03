const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4817);
const ROOT = __dirname;
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
  console.log(`State directory: ${STATE_DIR}`);
});
