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
