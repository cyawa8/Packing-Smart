// import express from "express";
// import path from "path";
// import { createServer as createViteServer } from "vite";
// import sqlite3 from "sqlite3";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import multer from "multer";
// import fs from "fs";
// import { createClient } from "@supabase/supabase-js";
// import dotenv from "dotenv";
// import WebSocket from "ws";

// // Memastikan file .env selalu terbaca dari root directory
// dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// const app = express();
// const PORT = Number(process.env.PORT) || 3000;
// const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// // Inisialisasi Client Supabase
// const supabase = createClient(
//   process.env.SUPABASE_URL || "",
//   process.env.SUPABASE_ANON_KEY || "",
//   {
//     realtime: {
//       transport: WebSocket as any, // Tambahkan 'as any' di sini
//     },
//   }
// );

// // // Database Setup
// // const dbPath = process.env.NODE_ENV === "production" 
// //   ? "/app/data/database.sqlite" 
// //   : "database.sqlite";

// // const db = new sqlite3.Database(dbPath, (err) => {
// //   if (err) {
// //     console.error("❌ Database connection error:", err);
// //   } else {
// //     console.log("✅ Connected to SQLite database");
// //     initializeDatabase();
// //   }
// // });

// // --- Database Setup ---
// const dbDir = process.env.NODE_ENV === "production" ? "/app/data" : ".";
// const dbPath = `${dbDir}/database.sqlite`;

// // 1. Buat foldernya secara paksa jika belum ada
// if (!fs.existsSync(dbDir)) {
//   fs.mkdirSync(dbDir, { recursive: true });
//   console.log(`✅ Directory ${dbDir} created.`);
// }

// // 2. Hubungkan ke SQLite
// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) {
//     console.error("❌ Database connection error:", err);
//   } else {
//     console.log("✅ Connected to SQLite database");
//     initializeDatabase();
//   }
// });

// function initializeDatabase() {
//   db.serialize(() => {
//     db.run(`CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       username TEXT UNIQUE,
//       password TEXT,
//       role TEXT CHECK(role IN ('admin', 'packer'))
//     )`);

//     db.run(`CREATE TABLE IF NOT EXISTS packing_list (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       resi_number TEXT UNIQUE,
//       drive_link TEXT,
//       user_id INTEGER,
//       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY(user_id) REFERENCES users(id)
//     )`);

//     db.run(`CREATE TABLE IF NOT EXISTS logs (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       description TEXT,
//       user_id INTEGER,
//       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY(user_id) REFERENCES users(id)
//     )`);

//     // Default admin user
//     const adminPassword = bcrypt.hashSync("admin123", 10);
//     db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", adminPassword, "admin"], (err) => {
//       if (!err) console.log("✅ Default admin user ensured");
//     });
//   });
// }

// // Middleware
// app.use(express.json());
// const upload = multer({ dest: "uploads/" });

// // API Health Check
// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok", time: new Date().toISOString() });
// });

// // Auth Middleware
// const authenticateToken = (req: any, res: any, next: any) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];
//   if (!token) return res.sendStatus(401);

//   jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
//     if (err) return res.sendStatus(403);
//     req.user = user;
//     next();
//   });
// };

// const isAdmin = (req: any, res: any, next: any) => {
//   if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
//   next();
// };

// // --- Supabase Storage Helper ---
// const uploadToSupabase = async (filePath: string, fileName: string) => {
//   try {
//     console.log(`[SUPABASE] Memulai upload: ${fileName}...`);
    
//     // Baca file sebagai buffer
//     const fileBuffer = fs.readFileSync(filePath);

//     const { data, error } = await supabase.storage
//       .from(process.env.SUPABASE_BUCKET || "packing-videos")
//       .upload(fileName, fileBuffer, {
//         contentType: 'video/webm',
//         upsert: true // Ganti file jika nama sama
//       });

//     if (error) throw error;

//     // Ambil Public URL
//     const { data: publicUrlData } = supabase.storage
//       .from(process.env.SUPABASE_BUCKET || "packing-videos")
//       .getPublicUrl(fileName);

//     console.log(`[SUPABASE] Upload Berhasil: ${publicUrlData.publicUrl}`);
//     return publicUrlData.publicUrl;

//   } catch (error: any) {
//     console.error("❌ [SUPABASE ERROR]:", error.message);
//     return null;
//   }
// };

// // --- ROUTES ---

// // Auth
// app.post("/api/auth/login", (req, res) => {
//   const { username, password } = req.body;
//   db.get("SELECT * FROM users WHERE username = ?", [username], (err, user: any) => {
//     if (err || !user) return res.status(401).json({ message: "User not found" });
//     if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
//     res.json({ token, role: user.role, id: user.id });

//     // Log login
//     db.run("INSERT INTO logs (description, user_id) VALUES (?, ?)", [`User ${username} logged in`, user.id]);
//   });
// });

// // Users
// app.get("/api/users", authenticateToken, isAdmin, (req, res) => {
//   db.all("SELECT id, username, role FROM users", (err, rows) => {
//     res.json(rows);
//   });
// });

// app.post("/api/users", authenticateToken, isAdmin, (req, res) => {
//   const { username, password, role } = req.body;
//   const hash = bcrypt.hashSync(password, 10);
//   db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hash, role], function(err) {
//     if (err) return res.status(500).json({ message: "Username already exists" });
//     res.json({ id: this.lastID });
//   });
// });

// app.delete("/api/users/:id", authenticateToken, isAdmin, (req, res) => {
//   db.run("DELETE FROM users WHERE id = ?", [req.params.id], () => res.json({ success: true }));
// });

// // Packing List
// app.get("/api/packing", authenticateToken, (req: any, res) => {
//   const query = "SELECT pl.*, u.username as packer_name FROM packing_list pl JOIN users u ON pl.user_id = u.id ORDER BY pl.timestamp DESC";
//   db.all(query, (err, rows) => res.json(rows));
// });

// // Route Utama Upload Video & Simpan Resi
// // app.post("/api/packing", authenticateToken, upload.single("video"), async (req: any, res) => {
// //   console.log("\n=== MEMULAI PROSES PACKING BARU ===");
// //   const { resiNumber } = req.body;
// //   const file = req.file;

// //   console.log(`1. Resi: ${resiNumber}`);
// //   console.log(`2. File Video Diterima: ${file ? "YA (" + file.size + " bytes)" : "TIDAK"}`);

// //   if (!file) return res.status(400).json({ message: "No video provided" });

// //   let storageLink = "https://mock-link.com";

// //   // Cek apakah kredensial Supabase ada
// //   if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
// //       console.log("3. Memulai proses Upload ke Supabase...");
// //       const fileName = `${resiNumber}_${Date.now()}.webm`;
// //       const uploadedLink = await uploadToSupabase(file.path, fileName);
      
// //       if (uploadedLink) {
// //           storageLink = uploadedLink;
// //           console.log("4. Link Supabase Berhasil Didapatkan!");
// //       } else {
// //           console.log("4. Upload GAGAL, menggunakan mock-link.");
// //       }
// //   } else {
// //       console.log("3. Kredensial Supabase kosong di .env, menggunakan mock-link.");
// //   }

// //   // Simpan ke SQLite
// //   db.run("INSERT OR REPLACE INTO packing_list (resi_number, drive_link, user_id, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
// //     [resiNumber, storageLink, req.user.id], function(err) {
// //       if (err) {
// //         console.error("DB Error:", err);
// //         return res.status(500).json({ message: "Save failed" });
// //       }
      
// //       // Catat ke logs aktivitas
// //       db.run("INSERT INTO logs (description, user_id) VALUES (?, ?)", 
// //         [`Packed/Updated order ${resiNumber}`, req.user.id]);
        
// //       res.json({ success: true });
// //       console.log("5. Data berhasil disimpan ke Database!");

// //       // Hapus file sementara di folder /uploads
// //       if (fs.existsSync(file.path)) {
// //         fs.unlinkSync(file.path);
// //         console.log("6. File sementara dihapus dari server lokal.");
// //       }
// //     }
// //   );
// // });

// // Route Utama Upload Video & Simpan Resi (LOKAL)
// app.post("/api/packing", authenticateToken, upload.single("video"), async (req: any, res) => {
//   console.log("\n=== MEMULAI PROSES PACKING LOKAL ===");
//   const { resiNumber } = req.body;
//   const file = req.file;

//   if (!file) return res.status(400).json({ message: "No video provided" });

//   // 1. Buat nama file video
//   const fileName = `${resiNumber}_${Date.now()}.webm`;
//   const destinationPath = path.join(LOCAL_VIDEO_PATH, fileName);

//   try {
//     // 2. Pindahkan file dari folder temporary multer ke folder permanen kita
//     fs.copyFileSync(file.path, destinationPath);
    
//     // 3. Link yang akan disimpan di SQLite adalah URL lokal
//     const localVideoUrl = `/videos/${fileName}`;

//     // 4. Simpan ke SQLite
//     db.run("INSERT OR REPLACE INTO packing_list (resi_number, drive_link, user_id, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
//       [resiNumber, localVideoUrl, req.user.id], function(err) {
//         if (err) {
//           console.error("DB Error:", err);
//           return res.status(500).json({ message: "Save failed" });
//         }
        
//         // Catat ke logs aktivitas
//         db.run("INSERT INTO logs (description, user_id) VALUES (?, ?)", 
//           [`Packed order ${resiNumber} to Local Storage`, req.user.id]);
          
//         res.json({ success: true });
//         console.log(`✅ Video resi ${resiNumber} berhasil disimpan di lokal: ${destinationPath}`);

//         // Hapus file sementara dari folder uploads/
//         if (fs.existsSync(file.path)) {
//           fs.unlinkSync(file.path);
//         }
//       }
//     );
//   } catch (error) {
//     console.error("❌ Gagal memproses video lokal:", error);
//     // Bersihkan file sementara jika terjadi error
//     if (file && fs.existsSync(file.path)) {
//       fs.unlinkSync(file.path);
//     }
//     return res.status(500).json({ message: "Gagal menyimpan video lokal" });
//   }
// });

// // Endpoint BARU untuk mengecek duplikasi resi
// app.get("/api/packing/check/:resi", authenticateToken, (req, res) => {
//   const { resi } = req.params;
//   db.get("SELECT id FROM packing_list WHERE resi_number = ?", [resi], (err, row) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     // Kembalikan true jika resi ditemukan (sudah ada)
//     res.json({ exists: !!row }); 
//   });
// });

// app.delete("/api/packing/:id", authenticateToken, isAdmin, (req, res) => {
//   db.run("DELETE FROM packing_list WHERE id = ?", [req.params.id], () => res.json({ success: true }));
// });

// // Logs
// app.get("/api/logs", authenticateToken, (req: any, res) => {
//   let query = "SELECT l.*, u.username FROM logs l JOIN users u ON l.user_id = u.id ";
//   const params: any[] = [];

//   if (req.user.role === "packer") {
//     query += "WHERE l.user_id = ? ";
//     params.push(req.user.id);
//   }

//   query += "ORDER BY l.timestamp DESC LIMIT 100";
//   db.all(query, params, (err, rows) => res.json(rows));
// });

// // Stats for Dashboard
// app.get("/api/stats", authenticateToken, isAdmin, (req, res) => {
//   const stats: any = {};
//   db.serialize(() => {
//     db.get("SELECT COUNT(*) as total FROM packing_list", (err, row: any) => {
//       stats.totalPacking = row.total;
//       db.get("SELECT COUNT(*) as today FROM packing_list WHERE DATE(timestamp) = DATE('now')", (err, row: any) => {
//         stats.todayPacking = row.today;
//         db.all("SELECT DATE(timestamp) as date, COUNT(*) as count FROM packing_list GROUP BY DATE(timestamp) ORDER BY date ASC", (err, rows) => {
//           stats.dailyChart = rows;
//           res.json(stats);
//         });
//       });
//     });
//   });
// });

// // --- Server & Vite ---
// async function startServer() {
//   if (process.env.NODE_ENV !== "production") {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: "spa",
//     });
//     app.use(vite.middlewares);
//   } else {
//     const distPath = path.join(process.cwd(), "dist");
//     app.use(express.static(distPath));
//     app.get("*", (req, res) => {
//       res.sendFile(path.join(distPath, "index.html"));
//     });
//   }

//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }

// startServer();

// // --- Local Storage Setup ---
// // Tentukan di mana folder penyimpanannya. 
// // Jika pakai PC biasa, akan tersimpan di dalam folder "videos" di proyekmu.
// // Jika pakai NAS, ubah menjadi "Z:/packing-videos" (sesuaikan huruf Drive-nya).
// const LOCAL_VIDEO_PATH = path.join(process.cwd(), "videos");

// // Buat foldernya secara otomatis jika belum ada
// if (!fs.existsSync(LOCAL_VIDEO_PATH)) {
//   fs.mkdirSync(LOCAL_VIDEO_PATH, { recursive: true });
//   console.log(`✅ Directory ${LOCAL_VIDEO_PATH} created for local video storage.`);
// }

// // Buka akses folder tersebut agar bisa diputar di Frontend lewat URL "/videos/..."
// app.use("/videos", express.static(LOCAL_VIDEO_PATH));

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { google } from "googleapis";
import fs from "fs";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

// Ensure local videos directory exists (for local file storage)
const VIDEOS_DIR = path.join(process.cwd(), "videos");
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Database Setup
const db = new sqlite3.Database("database.sqlite", (err) => {
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
app.use("/videos", express.static(VIDEOS_DIR));
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

// --- Google Drive Helper ---
const uploadToDrive = async (filePath: string, fileName: string) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });
    const fileMetadata = { 
      name: fileName,
      parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : []
    };
    const media = {
      mimeType: "video/webm",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    // Make file public if needed
    if (response.data.id) {
       await drive.permissions.create({
        fileId: response.data.id,
        requestBody: { role: "reader", type: "anyone" },
      });
    }

    return response.data.webViewLink;
  } catch (error) {
    console.error("GDrive Upload Error:", error);
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

// Change Password
app.post("/api/users/change-password", authenticateToken, (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user: any) => {
    if (err || !user) return res.status(404).json({ message: "User tidak ditemukan" });
    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(400).json({ message: "Password lama salah" });
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.run("UPDATE users SET password = ? WHERE id = ?", [newHash, req.user.id], (updateErr) => {
      if (updateErr) return res.status(500).json({ message: "Gagal merubah password" });
      db.run("INSERT INTO logs (description, user_id) VALUES (?, ?)", [`User ${user.username} diubah passwordnya`, req.user.id]);
      res.json({ success: true, message: "Password berhasil diperbarui" });
    });
  });
});

// Reset Database Securely (Admin Only)
app.post("/api/admin/reset-database", authenticateToken, isAdmin, (req: any, res) => {
  db.serialize(() => {
    db.run("DELETE FROM logs", (err) => {
      if (err) console.error("Error clearing logs:", err);
    });
    db.run("DELETE FROM packing_list", (err) => {
      if (err) console.error("Error clearing packing list:", err);
    });
    db.run("DELETE FROM users WHERE username != 'admin'", (err) => {
      if (err) console.error("Error clearing users:", err);
    });
    
    // Log the action
    db.run("INSERT INTO logs (description, user_id) VALUES (?, ?)", ["Database direset bersih oleh Administrator", req.user.id], () => {
      res.json({ success: true, message: "Seluruh data packing, logs, dan akun packer berhasil direset bersih ke kondisi awal!" });
    });
  });
});

// Packing List
app.get("/api/packing", authenticateToken, (req: any, res) => {
  let query = "SELECT pl.*, u.username as packer_name FROM packing_list pl JOIN users u ON pl.user_id = u.id ";
  const params: any[] = [];

  if (req.user.role === "packer") {
    query += "WHERE pl.user_id = ? ";
    params.push(req.user.id);
  }

  query += "ORDER BY pl.timestamp DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching packing list:", err);
      return res.status(500).json({ message: "Failed to fetch packing list" });
    }
    res.json(rows || []);
  });
});

app.post("/api/packing", authenticateToken, upload.single("video"), async (req: any, res) => {
  const { shopId, resiNumber } = req.body;
  const file = req.file;

  // 1. Get today's total count to determine sequence index "Ke-X"
  db.get("SELECT COUNT(*) as count FROM packing_list WHERE DATE(timestamp) = DATE('now')", async (err, row: any) => {
    if (err) {
      console.error("Failed to query daily packing sequence count:", err);
    }
    const seq = (row?.count || 0) + 1;

    // Create custom Date string YYYY-MM-DD
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${date}`;

    const fileName = `Packing_${dateStr}_Ke-${seq}_Resi_${resiNumber}.webm`;
    const localDest = path.join(VIDEOS_DIR, fileName);
    let driveLink = "local";

    if (file) {
      driveLink = `/videos/${fileName}`;

      // Cek konfigurasi Drive
      const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const hasKey = !!process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_PRIVATE_KEY.includes("BEGIN PRIVATE KEY");

      if (hasEmail && hasKey) {
          console.log("Attempting GDrive upload...");
          const uploadedLink = await uploadToDrive(file.path, fileName);
          if (uploadedLink) {
            driveLink = uploadedLink;
          } else {
            console.warn("GDrive Upload resulted in null. Saving to local server storage as fallback...");
            try {
              fs.copyFileSync(file.path, localDest);
            } catch (writeErr) {
              console.warn("Could not copy file to local server storage (expected in read-only platforms like Vercel). Using client local device storage instead.", writeErr);
              driveLink = "local";
            }
          }
      } else {
          console.log("GDrive not configured. Attempting to copy to local server storage...");
          try {
            fs.copyFileSync(file.path, localDest);
          } catch (writeErr) {
            console.warn("Could not copy file to local server storage (expected in serverless hosting like Vercel). Saving as local PC storage only.", writeErr);
            driveLink = "local";
          }
      }

      // Delete temporary file
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {
        console.warn("Could not clean up temp file:", e);
      }
    }

    const savedLink = driveLink === "local" ? fileName : driveLink;

    // Gunakan INSERT OR REPLACE agar data resi bersifat unik (UPSERT)
    db.run("INSERT OR REPLACE INTO packing_list (resi_number, drive_link, user_id, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
      [resiNumber, savedLink, req.user.id], function(err) {
        if (err) {
          console.error("DB Error:", err);
          return res.status(500).json({ message: "Save failed" });
        }
        
        db.run("INSERT INTO logs (description, user_id) VALUES (?, ?)", 
          [`Packed/Updated order ${resiNumber}`, req.user.id]);
          
        res.json({ success: true, driveLink: savedLink, fileName });
      }
    );
  });
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
      stats.totalPacking = row?.total || 0;
      db.get("SELECT COUNT(*) as today FROM packing_list WHERE DATE(timestamp) = DATE('now')", (err, row: any) => {
        stats.todayPacking = row?.today || 0;
        db.all("SELECT DATE(timestamp) as date, COUNT(*) as count FROM packing_list WHERE timestamp > DATE('now', '-7 days') GROUP BY DATE(timestamp)", (err, rows) => {
          stats.dailyChart = rows || [];
          
          const packersQuery = `
            SELECT 
              u.username,
              COALESCE(p.count, 0) as count,
              COALESCE(p_today.todayCount, 0) as todayCount
            FROM users u
            LEFT JOIN (SELECT user_id, COUNT(*) as count FROM packing_list GROUP BY user_id) p ON u.id = p.user_id
            LEFT JOIN (SELECT user_id, COUNT(*) as todayCount FROM packing_list WHERE DATE(timestamp) = DATE('now') GROUP BY user_id) p_today ON u.id = p_today.user_id
            ORDER BY count DESC, u.username ASC
          `;
          db.all(packersQuery, (err, packerRows) => {
            stats.packerStats = packerRows || [];
            res.json(stats);
          });
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
