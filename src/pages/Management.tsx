import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Plus, Search, Loader2, X, AlertCircle, Users } from "lucide-react";
import { fetchWithAuth } from "../lib/utils";

export default function Management() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await fetchWithAuth("/users");
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdError, setPwdError] = useState("");

  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchWithAuth("/users", {
      method: "POST",
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({});
      fetchData();
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage("");
    setPwdError("");
    try {
      const res = await fetchWithAuth("/users/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const json = await res.json();
      if (!res.ok) {
        setPwdError(json.message || "Gagal mengubah password.");
      } else {
        setPwdMessage(json.message || "Password berhasil diubah!");
        setOldPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      setPwdError("Terjadi kesalahan jaringan.");
    }
  };

  const handleResetDatabase = async () => {
    const confirmation1 = confirm("⚠️ PERINGATAN KERAS!\n\nApakah Anda YAKIN ingin menghaus/reset seluruh database? Tindakan ini akan menghapus semua riwayat packing, log aktivitas, dan akun packer lain.");
    if (!confirmation1) return;

    const confirmation2 = confirm("🚨 KONFIRMASI TERAKHIR!\n\nSeluruh data akan hilang selamanya. SQLite akan kembali kosong bersih seperti saat pertama kali dipasang, hanya menyisakan akun admin default ('admin123').\n\nLanjutkan reset?");
    if (!confirmation2) return;

    setResetLoading(true);
    setResetMessage("");
    setResetError("");
    try {
      const res = await fetchWithAuth("/admin/reset-database", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setResetMessage(json.message || "Database berhasil direset bersih!");
        fetchData();
        // Logout user after delay to reset state
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "/login";
        }, 3000);
      } else {
        setResetError(json.message || "Gagal melakukan reset.");
      }
    } catch (err) {
      setResetError("Terjadi kesalahan jaringan.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus user ini?")) return;
    await fetchWithAuth(`/users/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = data.filter(item => 
    item.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kelola User
          </h2>
          <p className="text-slate-500 font-medium">Manajemen akun Packer dan Administrator.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={20} /> Tambah User
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 border border-slate-200 rounded-2xl">
        <div className="pl-3 text-slate-400"><Search size={20} /></div>
        <input 
          placeholder="Cari user..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 py-2 pr-4 bg-transparent outline-none font-medium text-slate-700"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">Loading data...</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{item.username}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-tight">
                      {item.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={item.username === "admin"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">Belum ada data user.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pengaturan Tambahan: Ganti Password & Reset Database */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Box Ganti Password */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Ganti Password Admin</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Ubah kata sandi akun bapak saat ini agar lebih aman.</p>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">PASSWORD LAMA</label>
                <input 
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">PASSWORD BARU</label>
                <input 
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              {pwdMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
                  <span>✓</span> {pwdMessage}
                </div>
              )}
              {pwdError && (
                <div className="p-3 bg-red-50 text-red-800 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle size={14} /> {pwdError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
              >
                Simpan Password Baru
              </button>
            </form>
          </div>
        </div>

        {/* Box Reset Database */}
        <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between hover:border-red-200 transition-colors bg-gradient-to-br from-white to-red-50/10">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertCircle size={20} />
              <h3 className="font-bold">Zona Bahaya: Reset Database</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">Kembalikan aplikasi ke kondisi awal pabrik. Semua data bapak akan dibersihkan total.</p>
            
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6 space-y-2">
              <h4 className="text-xs font-bold text-red-800 leading-relaxed">⚠️ Efek Aksi Ini:</h4>
              <ul className="list-disc pl-4 text-[11px] text-red-700 space-y-1 font-medium">
                <li>Menghapus seluruh rekaman Packing List dari database</li>
                <li>Menghapus semua log data aktivitas</li>
                <li>Menghapus semua akun packer buatan bapak</li>
                <li>Menyisakan akun default: <strong>admin</strong> dengan password <strong>admin123</strong></li>
              </ul>
            </div>

            {resetMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100 mb-4">
                {resetMessage} Mengarahkan keluar...
              </div>
            )}
            {resetError && (
              <div className="p-3 bg-red-50 text-red-800 text-xs font-bold rounded-xl border border-red-100 mb-4">
                {resetError}
              </div>
            )}

            <button 
              type="button"
              disabled={resetLoading}
              onClick={handleResetDatabase}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md shadow-red-100 flex items-center justify-center gap-2"
            >
              {resetLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sedang Meriset...
                </>
              ) : (
                "Reset Ulang Semua Database ke Awal"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Tambah User</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input 
                  type="password" required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="">Pilih Role</option>
                  <option value="admin">Admin</option>
                  <option value="packer">Packer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-2.5 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
