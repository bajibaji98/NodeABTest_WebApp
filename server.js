const express = require("express");
const session = require("express-session");
const morgan = require("morgan");
const Database = require("better-sqlite3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

// --- paths ---
const ROOT = __dirname;
const dataDir = path.join(ROOT, "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "abtest.sqlite");

// --- DB (sync, file-based) ---
const db = new Database(dbPath);
db.prepare(`
  CREATE TABLE IF NOT EXISTS click_event (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    username TEXT NOT NULL,
    variant TEXT NOT NULL,
    button_id TEXT NOT NULL,
    ip TEXT
  )
`).run();

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(ROOT, "views"));
app.use(express.static(path.join(ROOT, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(session({
  secret: "CHANGE_ME_DEV_ONLY",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
}));

const SPLIT_ALPHA = 0.5; // 50/50

app.get("/", (req, res) => res.render("welcome"));

app.route("/signin")
  .get((req, res) => res.render("signin"))
  .post((req, res) => {
    const handle = (req.body.handle || "").trim();
    if (!handle) return res.render("signin", { error: "Please enter a name" });
    req.session.user = handle;
    if (!req.session.variant) {
      req.session.variant = Math.random() < SPLIT_ALPHA ? "Alpha" : "Beta";
    }
    res.redirect("/dashboard");
  });

app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/signin");
  const v = req.session.variant || (Math.random() < SPLIT_ALPHA ? "Alpha" : "Beta");
  req.session.variant = v;
  res.render(v === "Alpha" ? "alpha" : "beta", { user: req.session.user });
});

// metrics
app.post("/api/events", (req, res) => {
  const { buttonId } = req.body || {};
  if (!buttonId) return res.status(400).json({ ok: false, error: "buttonId required" });

  const row = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    username: req.session.user || "anon",
    variant: req.session.variant || "unknown",
    button_id: buttonId,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || null
  };

  db.prepare(`
    INSERT INTO click_event (id, timestamp, username, variant, button_id, ip)
    VALUES (@id, @timestamp, @username, @variant, @button_id, @ip)
  `).run(row);

  res.json({ ok: true });
});

// quick verify
app.get("/admin/recent", (req, res) => {
  const rows = db.prepare("SELECT * FROM click_event ORDER BY timestamp DESC LIMIT 25").all();
  res.json(rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Node+SQLite A/B app at http://localhost:${PORT}`));
