import React, { useState, useEffect } from "react";
import { History, Search, User, Clock, Terminal } from "lucide-react";
import { format } from "date-fns";
import { fetchWithAuth } from "../lib/utils";
import { LogEntry } from "../types";

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWithAuth("/logs")
      .then(res => res.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(log => 
    log.description.toLowerCase().includes(search.toLowerCase()) ||
    log.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Log Channel</h2>
        <p className="text-slate-500 font-medium">Riwayat seluruh aktivitas dalam sistem.</p>
      </div>

      <div className="bg-white p-2 border border-slate-200 rounded-2xl flex items-center gap-4">
        <div className="pl-3 text-slate-400"><Search size={20} /></div>
        <input 
          placeholder="Cari aktivitas atau user..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 py-2 pr-4 bg-transparent outline-none font-medium text-slate-700"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 flex items-center gap-2 border-b border-slate-800">
           <div className="w-3 h-3 rounded-full bg-red-400" />
           <div className="w-3 h-3 rounded-full bg-amber-400" />
           <div className="w-3 h-3 rounded-full bg-emerald-400" />
           <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Terminal size={14} /> System Terminal
           </span>
        </div>
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading logs...</div>
          ) : filtered.map(log => (
            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between group">
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                   <User size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-0.5">{log.description}</p>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-blue-600 uppercase tracking-tighter">@{log.username}</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {format(new Date(log.timestamp), "HH:mm:ss, dd MMM")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 uppercase">
                ID#{log.id}
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium">Baku log masih kosong.</div>
          )}
        </div>
      </div>
    </div>
  );
}
