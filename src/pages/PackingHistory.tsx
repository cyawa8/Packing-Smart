// import React, { useState, useEffect } from "react";
// import { ExternalLink, Search, Trash2, Video, Calendar, Filter } from "lucide-react";
// import { format } from "date-fns";
// import { fetchWithAuth } from "../lib/utils";
// import { PackingItem } from "../types";

// export default function PackingHistory() {
//   const [items, setItems] = useState<PackingItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const isAdmin = localStorage.getItem("role") === "admin";

//   const fetchData = async () => {
//     setLoading(true);
//     const res = await fetchWithAuth("/packing");
//     const json = await res.json();
//     setItems(json);
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const handleDelete = async (id: number) => {
//     if (!confirm("Hapus record packing ini?")) return;
//     await fetchWithAuth(`/packing/${id}`, { method: "DELETE" });
//     fetchData();
//   };

//   const filtered = items.filter(item => 
//     item.resi_number.toLowerCase().includes(search.toLowerCase()) ||
//     item.packer_name?.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Packing List</h2>
//           <p className="text-slate-500 font-medium">Data seluruh barang yang telah di-pack.</p>
//         </div>
//         <div className="flex items-center gap-2">
//             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
//               <Calendar size={18} /> Tanggal
//             </button>
//             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
//               <Filter size={18} /> Filter
//             </button>
//         </div>
//       </div>

//       <div className="bg-white p-2 border border-slate-200 rounded-2xl flex items-center gap-4">
//         <div className="pl-3 text-slate-400"><Search size={20} /></div>
//         <input 
//           placeholder="Cari nomor resi atau packer..."
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//           className="flex-1 py-2 pr-4 bg-transparent outline-none font-medium text-slate-700"
//         />
//       </div>

//       <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-slate-50 border-b border-slate-200">
//               <tr>
//                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">No. Resi</th>
//                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Packer</th>
//                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Bukti Video</th>
//                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Waktu</th>
//                 {isAdmin && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Aksi</th>}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {loading ? (
//                 <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400 font-medium">Loading data...</td></tr>
//               ) : filtered.map(item => (
//                 <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
//                   <td className="px-6 py-4">
//                     <span className="font-black text-slate-900 tracking-tight">{item.resi_number}</span>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center gap-2">
//                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
//                          {item.packer_name?.[0].toUpperCase()}
//                        </div>
//                        <span className="text-sm font-semibold text-slate-700">{item.packer_name}</span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-center">
//                     <a 
//                       href={item.drive_link} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
//                     >
//                       <Video size={16} /> Drive <ExternalLink size={14} />
//                     </a>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className="text-xs font-medium text-slate-400">
//                       {format(new Date(item.timestamp), "dd MMM yyyy, HH:mm")}
//                     </span>
//                   </td>
//                   {isAdmin && (
//                     <td className="px-6 py-4 text-right">
//                       <button 
//                         onClick={() => handleDelete(item.id)}
//                         className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                       >
//                         <Trash2 size={18} />
//                       </button>
//                     </td>
//                   )}
//                 </tr>
//               ))}
//               {!loading && filtered.length === 0 && (
//                 <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400 font-medium font-medium">Belum ada aktivitas packing.</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { ExternalLink, Search, Trash2, Video, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { fetchWithAuth } from "../lib/utils";
import { PackingItem } from "../types";

export default function PackingHistory() {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [localVideoResi, setLocalVideoResi] = useState<string | null>(null);
  const [selectedLocalFileUrl, setSelectedLocalFileUrl] = useState<string | null>(null);
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
                    {item.drive_link === "local" || !item.drive_link ? (
                      <button 
                        onClick={() => {
                          setLocalVideoResi(item.resi_number);
                          setSelectedLocalFileUrl(null);
                        }}
                        className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-55/70 lg:bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
                      >
                        <Video size={16} /> PC Lokal <ExternalLink size={14} />
                      </button>
                    ) : item.drive_link.startsWith("/") ? (
                      <button 
                        onClick={() => setActiveVideo(item.drive_link)}
                        className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Video size={16} /> Lihat Video <ExternalLink size={14} />
                      </button>
                    ) : (
                      <a 
                        href={item.drive_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Video size={16} /> Drive <ExternalLink size={14} />
                      </a>
                    )}
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

      {activeVideo && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveVideo(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Pemutaran Bukti Video Packing</h3>
              <button 
                onClick={() => setActiveVideo(null)}
                className="p-1 px-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Tutup
              </button>
            </div>
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center">
              <video 
                src={activeVideo} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <a 
                href={activeVideo} 
                download={`Packing_Video.webm`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-100"
              >
                Unduh Video ke PC (Format .webm)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Local Video Select & Playback Modal */}
      {localVideoResi && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setLocalVideoResi(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-150">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Putar Rekaman Video Lokal</h3>
              <button 
                onClick={() => setLocalVideoResi(null)}
                className="p-1 px-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Tutup
              </button>
            </div>

            {!selectedLocalFileUrl ? (
              <div className="space-y-4 py-4">
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100/50 text-xs font-bold leading-relaxed">
                  <p>✓ Video packing ini tersimpan aman di PC lokal Anda sendiri demi melestarikan bandwidth dan kapasitas cloud Vercel.</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 tracking-tight mb-2 uppercase text-[10px]">Nama file yang dicari:</p>
                  <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs select-all text-slate-800 border border-slate-200 font-extrabold text-center">
                    Packing_{localVideoResi}.webm
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih File untuk memutar:</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl px-6 py-8 hover:bg-slate-50 transition-colors cursor-pointer text-center">
                    <Video size={28} className="text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-indigo-600">Klik untuk memilih file video dari PC Anda</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium">Format: .webm (Sesuai nama file di atas)</span>
                    <input 
                      type="file" 
                      accept="video/webm, video/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedLocalFileUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-black rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center">
                  <video 
                    src={selectedLocalFileUrl} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-3 justify-between items-center pt-2">
                  <button 
                    onClick={() => setSelectedLocalFileUrl(null)} 
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    ← Pilih File Lain
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">Memutar dari File Lokal</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
