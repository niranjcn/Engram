import { Outlet, NavLink } from "react-router-dom";
import { Brain, Home, List, Plus, BarChart2, Settings as SettingsIcon, Shield } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import useAuth from "../hooks/useAuth";
import { today } from "../lib/utils";

export default function Layout({ onLogout }) {
  const { problems, stats, loading } = useAppData();
  const { user } = useAuth();
  const todayStr = today();
  const dueCount = problems.filter(p => p.nextReviewDate <= todayStr).length;

  const NAV = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/problems", icon: List, label: "Problems" },
    { to: "/add", icon: Plus, label: "New" },
    { to: "/stats", icon: BarChart2, label: "Stats" },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "text-[#5D616C] hover:text-[#8B8F96] hover:bg-[#16181E]"
    }`;

  return (
    <div className="min-h-screen flex" style={{ background: "#0B0D12", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r border-[#23262E]/60 p-4 sticky top-0 h-screen" style={{ background: "#0E1016" }}>
        <div className="flex items-center gap-2.5 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center">
            <Brain size={18} className="text-[#3B82F6]" />
          </div>
          <span className="font-semibold text-[#F1F1F3] text-sm tracking-tight">Engram</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/dashboard"} className={linkClass}>
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/settings" className={linkClass}>
            <SettingsIcon size={18} />
            Settings
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" end className={linkClass}>
              <Shield size={18} />
              Admin
            </NavLink>
          )}
        </nav>
        <div className="flex items-center justify-between px-2 pt-4 border-t border-[#23262E]/60">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-900/20 border border-red-800/30 rounded-lg px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-xs text-red-400">{dueCount} due</span>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs text-[#5D616C] hover:text-red-400 transition-colors">logout</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar — mobile */}
        <div className="md:hidden sticky top-0 z-40 border-b border-[#23262E]/60 px-4 py-3 flex items-center justify-between" style={{ background: "#0E1016", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center">
              <Brain size={15} className="text-[#3B82F6]" />
            </div>
            <span className="font-semibold text-[#F1F1F3] text-sm tracking-tight">Engram</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-900/20 border border-red-800/30 rounded-lg px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-xs text-red-400">{dueCount}</span>
            </div>
            <button onClick={onLogout} className="text-xs text-[#5D616C] hover:text-red-400 ml-1 transition-colors">logout</button>
          </div>
        </div>

        {/* Page content — full width */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 pb-20 md:pb-6 lg:pb-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="spinner" />
                <span className="text-sm text-[#5D616C] font-mono">Loading...</span>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>

        {/* Bottom nav — mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#23262E]/60 flex pb-[env(safe-area-inset-bottom,4px)]" style={{ background: "#0E1016", backdropFilter: "blur(12px)" }}>
          <div className="w-full mx-auto flex">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === "/dashboard"}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-2 md:py-3 transition-colors ${
                    isActive ? "text-[#3B82F6]" : "text-[#5D616C] hover:text-[#8B8F96]"
                  }`
                }>
                {({ isActive }) => (
                  <>
                    {n.to === "/add"
                      ? <div className={`p-1.5 rounded-lg ${isActive ? "bg-[#3B82F6]" : "bg-[#1C1E26]"} transition-colors`}>
                          <n.icon size={18} className={isActive ? "text-white" : "text-[#5D616C]"} />
                        </div>
                      : <n.icon size={18} />}
                    <span className="text-[10px] md:text-xs">{n.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
