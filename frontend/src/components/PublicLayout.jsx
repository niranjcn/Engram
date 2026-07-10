import { Outlet, Link } from "react-router-dom";
import { Brain, LogIn, Home } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B0D12" }}>
      <div className="sticky top-0 z-40 border-b border-[#23262E]/60" style={{ background: "#0E1016", backdropFilter: "blur(12px)" }}>
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center">
              <Brain size={15} className="text-[#3B82F6]" />
            </div>
            <span className="font-semibold text-[#F1F1F3] text-sm tracking-tight">Engram</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="flex items-center gap-1.5 text-xs text-[#5D616C] hover:text-[#F1F1F3] transition-colors">
                <Home size={14} /> Dashboard
              </Link>
            ) : (
              <Link to="/" className="flex items-center gap-1.5 text-xs text-[#5D616C] hover:text-[#F1F1F3] transition-colors">
                <LogIn size={14} /> Sign In
              </Link>
            )}
            <Link to="/users" className="flex items-center gap-1.5 text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
              Community
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 pb-20 md:pb-8">
        <Outlet />
      </div>
    </div>
  );
}
