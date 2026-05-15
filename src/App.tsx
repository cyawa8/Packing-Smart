import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Package, 
  LayoutDashboard, 
  Store, 
  Users, 
  ClipboardList, 
  History, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Camera,
  Play,
  Square,
  CheckCircle,
  Truck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, fetchWithAuth } from "./lib/utils";
import { Role, User, Shop, PackingItem, LogEntry, DashboardStats } from "./types";

// --- Components ---
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Management from "./pages/Management";
import Scanner from "./pages/Scanner";
import PackingHistory from "./pages/PackingHistory";
import Logs from "./pages/Logs";

const Sidebar = ({ role, open, setOpen }: { role: string; open: boolean; setOpen: (v: boolean) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
    { name: "Pack Barang", path: "/", icon: Package, roles: ["packer"] },
    { name: "Kelola User", path: "/users", icon: Users, roles: ["admin"] },
    { name: "Packing List", path: "/packing-list", icon: ClipboardList, roles: ["admin", "packer"] },
    { name: "Log Aktivitas", path: "/logs", icon: History, roles: ["admin", "packer"] },
  ].filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 px-2 mb-8 mt-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">SmartPack</h1>
              <p className="text-xs text-slate-500 font-medium">Warehouse Pro</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.path 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-100">
             <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              Keluar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = localStorage.getItem("role") || "";
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar role={role} open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 lg:hidden"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900 tracking-tight">
                {localStorage.getItem("username") || "User"}
              </p>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                {role}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 font-bold text-xs">
              {(localStorage.getItem("username") || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={
          <ProtectedLayout>
            <AdminDashboard />
          </ProtectedLayout>
        } />

        <Route path="/users" element={
          <ProtectedLayout>
            <Management />
          </ProtectedLayout>
        } />

        <Route path="/packing-list" element={
          <ProtectedLayout>
            <PackingHistory />
          </ProtectedLayout>
        } />

        <Route path="/logs" element={
          <ProtectedLayout>
            <Logs />
          </ProtectedLayout>
        } />

        <Route path="/scanner" element={
          <ProtectedLayout>
            <Scanner />
          </ProtectedLayout>
        } />

        <Route path="/" element={
          <ProtectedLayout>
            <Scanner />
          </ProtectedLayout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
