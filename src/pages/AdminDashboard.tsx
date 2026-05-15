import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Package, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { cn, fetchWithAuth } from "../lib/utils";
import { DashboardStats } from "../types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWithAuth("/stats")
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400 animate-pulse font-medium">Loading Stats...</p></div>;
  if (error) return <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center"><p className="text-red-500 font-bold">Gagal memuat data statistik.</p><button onClick={() => window.location.reload()} className="mt-4 text-blue-600 underline">Coba lagi</button></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ringkasan Operasional</h2>
        <p className="text-slate-500 font-medium">Statistik aktivitas packing pergudangan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Total Packing" 
          value={stats?.totalPacking || 0} 
          icon={Package} 
          color="bg-blue-500" 
          subText="Sejak awal sistem"
        />
        <StatCard 
          label="Packing Hari Ini" 
          value={stats?.todayPacking || 0} 
          icon={Calendar} 
          color="bg-emerald-500" 
          subText="Target harian tercapai"
        />
        <StatCard 
          label="Efisiensi" 
          value="98.5%" 
          icon={TrendingUp} 
          color="bg-amber-500" 
          subText="+2.4% dari kemarin"
        />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-slate-900">Aktivitas 7 Hari Terakhir</h3>
            <p className="text-xs text-slate-500 font-medium">Volume scan barcode harian</p>
          </div>
          <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
            Detail Full
          </button>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.dailyChart || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="count" 
                fill="#2563eb" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subText }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-2xl text-white shadow-lg shadow-current/20 mb-4", color)}>
          <Icon size={24} />
        </div>
        <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
          <ArrowUpRight size={20} />
        </div>
      </div>
      <h3 className="text-slate-500 text-sm font-semibold mb-1 ml-1">{label}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
        <span className="text-xs font-medium text-slate-400">{subText}</span>
      </div>
    </div>
  );
}
