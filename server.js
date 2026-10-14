// Server chat sederhana tanpa dependensi luar. Pesan disimpan di SQLite (modul bawaan Node >= 22.13).
// Jalankan: node server.js  -> buka http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 3000;
// DATA_DIR bisa diarahkan ke volume/disk persisten saat deploy.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_FILE = path.join(DATA_DIR, "chat.db");
const INDEX_FILE = path.join(__dirname, "public", "index.html");

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS messages (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    time TEXT NOT NULL
  );
`);

const insertMsg = db.prepare("INSERT INTO messages (name, text, time) VALUES (?, ?, ?)");
const getById = db.prepare("SELECT id, name, text, time FROM messages WHERE id = ?");
// Tanpa ?after: 200 pesan terakhir, urut dari yang terlama.
const getRecent = db.prepare(
  "SELECT * FROM (SELECT id, name, text, time FROM messages ORDER BY id DESC LIMIT 200) ORDER BY id ASC"
);
const getAfter = db.prepare("SELECT id, name, text, time FROM messages WHERE id > ? ORDER BY id ASC");

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Halaman utama
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(INDEX_FILE).pipe(res);
    return;
  }

  // Ambil pesan. ?after=<id> hanya mengembalikan pesan yang lebih baru dari id itu.
  if (req.method === "GET" && url.pathname === "/messages") {
    const after = Number(url.searchParams.get("after") || 0);
    const rows = after > 0 ? getAfter.all(after) : getRecent.all();
    sendJson(res, 200, rows);
    return;
  }

  // Kirim pesan baru: { name, text }
  if (req.method === "POST" && url.pathname === "/messages") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000) req.destroy(); // tolak body terlalu besar
    });
    req.on("end", () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { error: "JSON tidak valid" });
      }
      const text = String(data.text || "").trim().slice(0, 1000);
      const name = String(data.name || "").trim().slice(0, 40) || "Anonim";
      if (!text) return sendJson(res, 400, { error: "Pesan kosong" });

      const result = insertMsg.run(name, text, new Date().toISOString());
      sendJson(res, 201, getById.get(result.lastInsertRowid));
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Chat berjalan di http://localhost:${PORT} (database: ${DB_FILE})`);
});
