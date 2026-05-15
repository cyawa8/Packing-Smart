import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import WebSocket from "ws";

// Memastikan file .env selalu terbaca dari root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Inisialisasi Client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || "",
  {
    realtime: {
      transport: WebSocket as any, // Tambahkan 'as any' di sini
    },
  }
);

// Database Setup
const dbPath = process.env.NODE_ENV === "production" 
  ? "/app/data/database.sqlite" 
  : "database.sqlite";

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("✅ Connected to SQLite database");
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('admin', 'packer'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS packing_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resi_number TEXT UNIQUE,
      drive_link TEXT,
      user_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      user_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Default admin user
    const adminPassword = bcrypt.hashSync("admin123", 10);
    db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", adminPassword, "admin"], (err) => {
      if (!err) console.log("✅ Default admin user ensured");
    });
  });
}

// Middleware
app.use(express.json());
const upload = multer({ dest: "uploads/" });

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
};

// --- Supabase Storage Helper ---
const uploadToSupabase = async (filePath: string, fileName: string) => {
  try {
    console.log(`[SUPABASE] Memulai upload: ${fileName}...`);
    
    // Baca file sebagai buffer
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET || "packing-videos")
      .upload(fileName, fileBuffer, {
        contentType: 'video/webm',
        upsert: true // Ganti file jika nama sama
      });

    if (error) throw error;

    // Ambil Public URL
    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET || "packing-videos")
      .getPublicUrl(fileName);

    console.log(`[SUPABASE] Upload Berhasil: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;

  } catch (error: any) {
    console.error("❌ [SUPABASE ERROR]:", error.message);
    return null;
  }
};

// --- ROUTES ---

// Auth
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user: any) => {
    if (err || !user) return res.status(401).json({ message: "User not found" });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, role: user.role, id: user.id });

    // Log login
    db.run("INSERT INTO logs (description, user_id) VALUES (?, ?)", [`User ${username} logged in`, user.id]);
  });
});

// Users
app.get("/api/users", authenticateToken, isAdmin, (req, res) => {
  db.all("SELECT id, username, role FROM users", (err, rows) => {
    res.json(rows);
  });
});

app.post("/api/users", authenticateToken, isAdmin, (req, res) => {
  const { username, password, role } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hash, role], function(err) {
    if (err) return res.status(500).json({ message: "Username already exists" });
    res.json({ id: this.lastID });
  });
});

app.delete("/api/users/:id", authenticateToken, isAdmin, (req, res) => {
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], () => res.json({ success: true }));
});

// Packing List
app.get("/api/packing", authenticateToken, (req: any, res) => {
  const query = "SELECT pl.*, u.username as packer_name FROM packing_list pl JOIN users u ON pl.user_id = u.id ORDER BY pl.timestamp DESC";
  db.all(query, (err, rows) => res.json(rows));
});

// Route Utama Upload Video & Simpan Resi
app.post("/api/packing", authenticateToken, upload.single("video"), async (req: any, res) => {
  console.log("\n=== MEMULAI PROSES PACKING BARU ===");
  const { resiNumber } = req.body;
  const file = req.file;

  console.log(`1. Resi: ${resiNumber}`);
  console.log(`2. File Video Diterima: ${file ? "YA (" + file.size + " bytes)" : "TIDAK"}`);

  if (!file) return res.status(400).json({ message: "No video provided" });

  let storageLink = "https://mock-link.com";

  // Cek apakah kredensial Supabase ada
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      console.log("3. Memulai proses Upload ke Supabase...");
      const fileName = `${resiNumber}_${Date.now()}.webm`;
      const uploadedLink = await uploadToSupabase(file.path, fileName);
      
      if (uploadedLink) {
          storageLink = uploadedLink;
          console.log("4. Link Supabase Berhasil Didapatkan!");
      } else {
          console.log("4. Upload GAGAL, menggunakan mock-link.");
      }
  } else {
      console.log("3. Kredensial Supabase kosong di .env, menggunakan mock-link.");
  }

  // Simpan ke SQLite
  db.run("INSERT OR REPLACE INTO packing_list (resi_number, drive_link, user_id, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
    [resiNumber, storageLink, req.user.id], function(err) {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ message: "Save failed" });
      }
      
      // Catat ke logs aktivitas
      db.run("INSERT INTO logs (description, user_id) VALUES (?, ?)", 
        [`Packed/Updated order ${resiNumber}`, req.user.id]);
        
      res.json({ success: true });
      console.log("5. Data berhasil disimpan ke Database!");

      // Hapus file sementara di folder /uploads
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log("6. File sementara dihapus dari server lokal.");
      }
    }
  );
});

app.delete("/api/packing/:id", authenticateToken, isAdmin, (req, res) => {
  db.run("DELETE FROM packing_list WHERE id = ?", [req.params.id], () => res.json({ success: true }));
});

// Logs
app.get("/api/logs", authenticateToken, (req: any, res) => {
  let query = "SELECT l.*, u.username FROM logs l JOIN users u ON l.user_id = u.id ";
  const params: any[] = [];

  if (req.user.role === "packer") {
    query += "WHERE l.user_id = ? ";
    params.push(req.user.id);
  }

  query += "ORDER BY l.timestamp DESC LIMIT 100";
  db.all(query, params, (err, rows) => res.json(rows));
});

// Stats for Dashboard
app.get("/api/stats", authenticateToken, isAdmin, (req, res) => {
  const stats: any = {};
  db.serialize(() => {
    db.get("SELECT COUNT(*) as total FROM packing_list", (err, row: any) => {
      stats.totalPacking = row.total;
      db.get("SELECT COUNT(*) as today FROM packing_list WHERE DATE(timestamp) = DATE('now')", (err, row: any) => {
        stats.todayPacking = row.today;
        db.all("SELECT DATE(timestamp) as date, COUNT(*) as count FROM packing_list WHERE timestamp > DATE('now', '-7 days') GROUP BY DATE(timestamp)", (err, rows) => {
          stats.dailyChart = rows;
          res.json(stats);
        });
      });
    });
  });
});

// --- Server & Vite ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();