import { Outlet, NavLink } from "react-router-dom";
import { Brain, Home, List, Plus, BarChart2, Flame, Clock, Settings as SettingsIcon } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { today } from "../lib/utils";

export default function Layout({ onLogout }) {
  const { problems, stats, loading } = useAppData();
  const todayStr = today();
  const dueCount = problems.filter(p => p.nextReviewDate <= todayStr).length;

  const NAV = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/problems", icon: List, label: "Problems" },
    { to: "/add", icon: Plus, label: "Add" },
    { to: "/stats", icon: BarChart2, label: "Stats" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0E1A", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r border-gray-800/60 p-4 sticky top-0 h-screen" style={{ background: "#0A0E1Aee" }}>
        <div className="flex items-center gap-2 mb-8 px-2">
          <Brain size={22} className="text-indigo-400" />
          <span className="font-mono font-bold text-white text-sm tracking-tight">DSA Tracker</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors cursor-pointer ${
                  isActive ? "bg-indigo-600/20 text-indigo-400" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/40"
                }`
              }>
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors cursor-pointer ${
                isActive ? "bg-indigo-600/20 text-indigo-400" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/40"
              }`
            }>
            <SettingsIcon size={18} />
            Settings
          </NavLink>
        </nav>
        <div className="flex items-center justify-between px-2 pt-4 border-t border-gray-800/60">
          <div className="flex items-center gap-2">
            {stats.streak?.current > 0 && (
              <div className="flex items-center gap-1 bg-amber-900/30 border border-amber-800/40 rounded-lg px-2 py-1">
                <Flame size={13} className="text-amber-400" />
                <span className="text-xs font-mono text-amber-300">{stats.streak.current}</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-red-900/30 border border-red-800/40 rounded-lg px-2 py-1">
              <Clock size={13} className="text-red-400" />
              <span className="text-xs font-mono text-red-300">{dueCount} due</span>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-400 font-mono cursor-pointer">logout</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar — mobile only */}
        <div className="md:hidden sticky top-0 z-40 border-b border-gray-800/60 px-4 py-3 flex items-center justify-between" style={{ background: "#0A0E1Aee", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-indigo-400" />
            <span className="font-mono font-bold text-white text-sm tracking-tight">DSA Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.streak?.current > 0 && (
              <div className="flex items-center gap-1 bg-amber-900/30 border border-amber-800/40 rounded-lg px-2 py-1">
                <Flame size={13} className="text-amber-400" />
                <span className="text-xs font-mono text-amber-300">{stats.streak.current}</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-red-900/30 border border-red-800/40 rounded-lg px-2 py-1">
              <Clock size={13} className="text-red-400" />
              <span className="text-xs font-mono text-red-300">{dueCount} due</span>
            </div>
            <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-400 font-mono ml-1 cursor-pointer">logout</button>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24 md:pb-6">
          {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div> : <Outlet />}
        </div>

        {/* Bottom nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-800/60 flex" style={{ background: "#0A0E1Aee", backdropFilter: "blur(12px)" }}>
          <div className="max-w-2xl mx-auto flex w-full">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === "/dashboard"}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-3 transition-colors cursor-pointer ${
                    isActive ? "text-indigo-400" : "text-gray-600 hover:text-gray-400"
                  }`
                }>
                {({ isActive }) => (
                  <>
                    {n.to === "/add"
                      ? <div className={`p-1.5 rounded-lg ${isActive ? "bg-indigo-600" : "bg-gray-800"} transition-colors`}>
                          <n.icon size={18} className={isActive ? "text-white" : "text-gray-400"} />
                        </div>
                      : <n.icon size={18} />}
                    <span className="text-xs font-mono">{n.label}</span>
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
