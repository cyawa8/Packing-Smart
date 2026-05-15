import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Package, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Minus, BarChart2, CalendarDays } from "lucide-react";
import { cn, fetchWithAuth } from "../lib/utils";
import { DashboardStats } from "../types";

// Pindahkan helper ke luar komponen agar bisa dipakai untuk inisialisasi state
const getLocalYYYYMMDD = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // STATE BARU: Menggunakan Filter Mode agar lebih rapi
  const [filterMode, setFilterMode] = useState<'preset' | 'custom' | 'full'>('preset');
  const [filterDays, setFilterDays] = useState(30);
  
  // State untuk Custom Date (Default: 7 hari terakhir sampai hari ini)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalYYYYMMDD(d);
  });
  const [endDate, setEndDate] = useState(() => getLocalYYYYMMDD(new Date()));

  const getEfficiencyData = () => {
    if (!stats || !stats.dailyChart) return { value: "0", subText: "Menghitung...", trend: "neutral" };

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = getLocalYYYYMMDD(today);
    const yesterdayStr = getLocalYYYYMMDD(yesterday);

    const todayData = stats.dailyChart.find((d: any) => d.date === todayStr);
    const yesterdayData = stats.dailyChart.find((d: any) => d.date === yesterdayStr);

    const countToday = todayData ? todayData.count : 0; 
    const countYesterday = yesterdayData ? yesterdayData.count : 0;

    if (countYesterday === 0) {
      if (countToday > 0) return { value: `${countToday} Resi`, subText: "+100% dari kemarin", trend: "up" };
      return { value: "0 Resi", subText: "0% dari kemarin", trend: "neutral" };
    }

    const diff = countToday - countYesterday;
    const percentage = (diff / countYesterday) * 100;
    
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    const trend = isPositive ? "up" : isNegative ? "down" : "neutral";

    return {
      value: `${countToday} Resi`,
      subText: `${isPositive ? '+' : ''}${percentage.toFixed(1)}% dari kemarin`,
      trend
    };
  };

  const efficiency = getEfficiencyData();

  // LOGIKA FILTER DIPERBARUI: Mendukung Custom Range
  const filteredChartData = useMemo(() => {
    if (!stats?.dailyChart) return [];
    if (filterMode === 'full') return stats.dailyChart;

    if (filterMode === 'preset') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filterDays);
      const cutoffStr = getLocalYYYYMMDD(cutoffDate);
      return stats.dailyChart.filter((item: any) => item.date >= cutoffStr);
    }

    if (filterMode === 'custom') {
      return stats.dailyChart.filter((item: any) => item.date >= startDate && item.date <= endDate);
    }

    return [];
  }, [stats, filterMode, filterDays, startDate, endDate]);

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
          label="Skala Pengiriman" 
          value={efficiency.value} 
          icon={TrendingUp} 
          color="bg-amber-500" 
          subText={efficiency.subText}
          trend={efficiency.trend}
        />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-900">
              Aktivitas {
                filterMode === 'full' ? "Keseluruhan" : 
                filterMode === 'custom' ? "Sesuai Pilihan" : 
                `${filterDays} Hari Terakhir`
              }
            </h3>
            <p className="text-xs text-slate-500 font-medium">Volume scan barcode harian</p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
            {/* KONTROL SEGMENTED UTAMA */}
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 w-full lg:w-auto overflow-x-auto">
              {[
                { label: "7 Hari", value: 7 },
                { label: "14 Hari", value: 14 },
                { label: "30 Hari", value: 30 },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setFilterMode('preset');
                    setFilterDays(tab.value);
                  }}
                  className={cn(
                    "flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap",
                    filterMode === 'preset' && filterDays === tab.value
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
              
              <div className="w-px h-5 bg-slate-300 mx-1 hidden lg:block"></div>

              {/* Tombol Custom */}
              <button
                onClick={() => setFilterMode('custom')}
                className={cn(
                  "flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap",
                  filterMode === 'custom'
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                )}
              >
                <CalendarDays size={14} className={filterMode === 'custom' ? "text-blue-600" : "text-slate-400"} />
                Custom
              </button>

              <div className="w-px h-5 bg-slate-300 mx-1 hidden lg:block"></div>
              
              <button
                onClick={() => setFilterMode('full')}
                className={cn(
                  "flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap",
                  filterMode === 'full'
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                )}
              >
                <BarChart2 size={14} className={filterMode === 'full' ? "text-slate-300" : "text-slate-400"} />
                Detail Full
              </button>
            </div>
            
            {/* PANEL CUSTOM DATE PICKER (Muncul hanya jika mode Custom aktif) */}
            {filterMode === 'custom' && (
              <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-xl border border-blue-100 w-full lg:w-auto animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 ml-1">Dari Tanggal</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border border-blue-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="mt-5 text-slate-400 font-bold">-</div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 ml-1">Sampai Tanggal</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate} // Validasi agar end date tidak lebih kecil dari start date
                    className="bg-white border border-blue-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          {filteredChartData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
              <BarChart2 size={48} className="opacity-20 mb-3" />
              <p className="font-medium">Tidak ada data packing di rentang tanggal ini.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredChartData}>
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
                  barSize={filterMode === 'full' || filteredChartData.length > 30 ? 16 : 32} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subText, trend }: any) {
  const isUp = trend === "up";
  const isDown = trend === "down";
  
  const trendColor = isUp ? "text-emerald-500" : isDown ? "text-rose-500" : "text-slate-400";
  const TrendIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-2xl text-white shadow-lg shadow-current/20 mb-4", color)}>
          <Icon size={24} />
        </div>
        <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
          <TrendIcon size={20} />
        </div>
      </div>
      <h3 className="text-slate-500 text-sm font-semibold mb-1 ml-1">{label}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
        <span className={cn("text-xs font-medium", trendColor)}>{subText}</span>
      </div>
    </div>
  );
}