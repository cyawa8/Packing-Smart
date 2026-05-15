# SMART PACKING SYSTEM - Dokumentasi Instalasi & Penggunaan

Aplikasi Web Efisiensi Operasional Gudang untuk proses packing barang yang modern, responsive, dan minim interaksi manual.

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi | Kegunaan |
|----------|-----------|----------|
| **Frontend** | React + Vite | Framework UI yang cepat dengan performa tinggi. |
| **Styling** | Tailwind CSS 4.0 | Utilitas CSS modern untuk tampilan clean dan responsif. |
| **Backend** | Node.js + Express | Server API untuk mengolah data dan logika sistem. |
| **Database** | SQLite / MySQL | Penyimpanan data Toko, User, Packing List, dan Log. (Defalt: SQLite untuk portabilitas). |
| **Auth** | JWT + bcrypt | Keamanan login dan enkripsi password. |
| **Scanner** | Html5-Qrcode | Library scanning barcode menggunakan kamera perangkat. |
| **Video** | MediaRecorder API | Merekam video bukti packing langsung dari browser. |
| **Storage** | Google Drive API | Mengunggah video bukti packing menggunakan Service Account. |
| **Ikon** | Lucide React | Library ikon yang konsisten dan minimalis. |
| **Chart** | Recharts | Visualisasi data aktivitas packing pada dashboard. |

---

## 🚀 Cara Instalasi (Lokal)

### 1. Persiapan Awal
Pastikan Anda sudah menginstal:
- **Node.js** (Versi 18 ke atas)
- **NPM** atau **Yarn**

### 2. Ekstrak File
Ekstrak folder hasil download dari fitur Export ZIP.

### 3. Instalasi Dependencies
Buka terminal di dalam folder project, lalu jalankan:
```bash
npm install
```

### 4. Konfigurasi Environment (`.env`)
Buat file baru bernama `.env` di root folder (berdasarkan `.env.example`).
Isi variabel berikut:
- `JWT_SECRET`: **Buat sendiri kode acak Anda** (contoh: `kuncirahasia123`). Kode ini digunakan untuk mengamankan data login aplikasi Anda. Jangan berikan kode ini ke siapapun.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Email dari Google Service Account Anda (Didapatkan dari Google Cloud Console).
- `GOOGLE_PRIVATE_KEY`: Private key dari Google Service Account Anda (format: `"-----BEGIN PRIVATE KEY-----\nMII..."`).

*Catatan: Jika variabel Google Drive tidak diisi, sistem akan menggunakan Link Mock/Placeholder agar tetap bisa dijalankan untuk demo.*

### 5. Konfigurasi Database (Opsional ke MySQL)
Secara default, aplikasi menggunakan **SQLite** (`database.sqlite`) agar Anda tidak perlu menginstal server database tambahan. Jika ingin menggunakan **MySQL**:
1. Edit file `server.ts`.
2. Ganti library `sqlite3` dengan `mysql2`.
3. Sesuaikan query koneksi ke database MySQL Anda.

### 6. Menjalankan Aplikasi
**Mode Pengembangan (Dev):**
```bash
npm run dev
```
Akses di: `http://localhost:3000`

**Mode Produksi (Build & Start):**
```bash
npm run build
npm start
```

---

## 📖 Cara Penggunaan

### 1. Akun Default (Admin)
- **Username:** `admin`
- **Password:** `admin123`

### 2. Workflow Admin
- Masuk ke menu **Dashboard** untuk melihat statistik.
- Masuk ke **Kelola Toko** untuk mendaftarkan toko/client.
- Masuk ke **Kelola User** untuk membuat akun bagi Packer.
- Masuk ke **Packing List** untuk melihat link video bukti packing.

### 3. Workflow Packer
- Pilih Toko tempat Anda bekerja.
- Sistem akan membuka kamera scanner. **Berikan izin akses kamera**.
- Arahkan barcode paket ke kamera.
- Sistem otomatis mulai merekam. Lakukan packing barang.
- Klik **Selesai** setelah paket ditutup. Video otomatis terunggah ke Drive.

---

## 📂 Struktur Database
- `users`: ID, Username, Password (Hashed), Role (Admin/Packer).
- `shops`: ID, Nama Toko, Marketplaces.
- `packing_list`: ID, Shop ID, Nomor Resi, Link Drive Video, User ID, Timestamp.
- `logs`: ID, Deskripsi, User ID, Timestamp.

---
*Dibuat untuk Efisiensi Warehouse Modern.*
