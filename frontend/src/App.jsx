import { Routes, Route, Navigate } from "react-router-dom";
import { Brain } from "lucide-react";
import Layout from "./components/Layout";
import RequireAdmin from "./components/RequireAdmin";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ProblemList from "./pages/ProblemList";
import AddProblem from "./pages/AddProblem";
import EditProblem from "./pages/EditProblem";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import GithubCallback from "./pages/GithubCallback";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminUserDetail from "./pages/admin/UserDetail";
import useAuth from "./hooks/useAuth";
import { AppDataProvider } from "./context/AppDataContext";

export default function App() {
  const { user, authLoading, login, logout } = useAuth();

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0D12" }}>
      <div className="flex flex-col items-center gap-3 text-[#5D616C]">
        <Brain size={32} className="text-[#3B82F6] animate-pulse" />
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/github-callback" element={<GithubCallback />} />
      {!user ? (
        <>
          <Route path="/register" element={<RegisterPage onRegister={(u) => u ? login(u) : null} />} />
          <Route path="*" element={<LoginPage onLogin={(u) => u ? login(u) : null} />} />
        </>
      ) : (
        <Route element={<AppDataProvider user={user}><Layout onLogout={logout} /></AppDataProvider>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/add" element={<AddProblem />} />
          <Route path="/edit/:id" element={<EditProblem />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
          <Route path="/admin/users/:id" element={<RequireAdmin><AdminUserDetail /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
}
