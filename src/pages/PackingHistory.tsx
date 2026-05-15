import React, { useState, useEffect } from "react";
import { ExternalLink, Search, Trash2, Video, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { fetchWithAuth } from "../lib/utils";
import { PackingItem } from "../types";

export default function PackingHistory() {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const isAdmin = localStorage.getItem("role") === "admin";

  const fetchData = async () => {
    setLoading(true);
    const res = await fetchWithAuth("/packing");
    const json = await res.json();
    setItems(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus record packing ini?")) return;
    await fetchWithAuth(`/packing/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = items.filter(item => 
    item.resi_number.toLowerCase().includes(search.toLowerCase()) ||
    item.packer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Packing List</h2>
          <p className="text-slate-500 font-medium">Data seluruh barang yang telah di-pack.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
              <Calendar size={18} /> Tanggal
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
              <Filter size={18} /> Filter
            </button>
        </div>
      </div>

      <div className="bg-white p-2 border border-slate-200 rounded-2xl flex items-center gap-4">
        <div className="pl-3 text-slate-400"><Search size={20} /></div>
        <input 
          placeholder="Cari nomor resi atau packer..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">No. Resi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Packer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Bukti Video</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Waktu</th>
                {isAdmin && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400 font-medium">Loading data...</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900 tracking-tight">{item.resi_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                         {item.packer_name?.[0].toUpperCase()}
                       </div>
                       <span className="text-sm font-semibold text-slate-700">{item.packer_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a 
                      href={item.drive_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Video size={16} /> Drive <ExternalLink size={14} />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-400">
                      {format(new Date(item.timestamp), "dd MMM yyyy, HH:mm")}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400 font-medium font-medium">Belum ada aktivitas packing.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
