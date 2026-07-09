import { useState, useEffect, useCallback } from "react";
import { Brain, Home, List, Plus, BarChart2, Flame, Clock } from "lucide-react";
import Card from "./components/Card";
import ProblemForm from "./components/ProblemForm";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ProblemList from "./pages/ProblemList";
import Stats from "./pages/Stats";
import { SAFE_URL_RE } from "./lib/constants";
import { today } from "./lib/utils";
import { auth, problemsApi, reviewsApi } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  const [view, setView] = useState("dashboard");
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState({ streak: { current: 0, longest: 0 } });
  const [history, setHistory] = useState([]);
  const [editProblem, setEditProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [p, s, h] = await Promise.all([problemsApi.list(), reviewsApi.stats(), reviewsApi.history()]);
      setProblems(p);
      setStats(s);
      setHistory(h);
    } catch (err) {
      if (err.message?.includes("Not authenticated") || err.message?.includes("Invalid token") || err.message?.includes("Token expired")) {
        localStorage.removeItem("token");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setAuthLoading(false); setLoading(false); return; }
    auth.me()
      .then(u => { setUser(u); loadData(); })
      .catch(() => { localStorage.removeItem("token"); setLoading(false); })
      .finally(() => setAuthLoading(false));
  }, [loadData]);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowRegister(false);
    setLoading(true);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProblems([]);
    setStats({ streak: { current: 0, longest: 0 } });
    setHistory([]);
  };

  const addProblem = async (form, _initial) => {
    try {
      if (form.url && !SAFE_URL_RE.test(form.url)) {
        throw new Error("URL must start with http:// or https://");
      }
      const created = await problemsApi.create(form);
      await problemsApi.review(created.id, form.outcome);
      await loadData();
      setView("dashboard");
    } catch (err) { alert(err.message); }
  };

  const updateProblem = async (form, initial) => {
    try {
      if (form.url && !SAFE_URL_RE.test(form.url)) {
        throw new Error("URL must start with http:// or https://");
      }
      await problemsApi.update(initial.id, form);
      await problemsApi.review(initial.id, form.outcome);
      await loadData();
      setEditProblem(null);
      setView("list");
    } catch (err) { alert(err.message); }
  };

  const deleteProblem = async (id) => {
    const confirmed = window.confirm("Delete this problem?");
    if (!confirmed) return;
    try {
      await problemsApi.delete(id);
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const handleUnfreeze = async (id) => {
    try {
      const d = new Date(); d.setDate(d.getDate() + 7);
      await problemsApi.update(id, {
        frozen: false, soloStreak: 0, interval: 7, repetitions: 3,
        nextReviewDate: d.toISOString().split("T")[0],
      });
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const handleReview = async (id, outcome, callback) => {
    try {
      const updated = await problemsApi.review(id, outcome);
      await loadData();
      if (callback) callback(updated);
    } catch (err) { alert(err.message); }
  };

  const NAV = [
    { id:"dashboard", icon: Home,    label:"Home" },
    { id:"list",      icon: List,    label:"Problems" },
    { id:"add",       icon: Plus,    label:"Add" },
    { id:"stats",     icon: BarChart2,label:"Stats" },
  ];

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Brain size={32} className="text-indigo-400 animate-pulse" />
        <p className="text-sm font-mono">Loading tracker...</p>
      </div>
    </div>
  );

  if (!user) {
    if (showRegister) return <RegisterPage onRegister={(u, toLogin) => u ? handleLogin(u) : setShowRegister(false)} />;
    return <LoginPage onLogin={(u, toRegister) => u ? handleLogin(u) : setShowRegister(true)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A", fontFamily: "'Inter', sans-serif" }}>
      <div className="sticky top-0 z-40 border-b border-gray-800/60" style={{ background: "#0A0E1Aee", backdropFilter: "blur(12px)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-indigo-400" />
            <span className="font-mono font-bold text-white text-sm tracking-tight">DSA Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.streak?.current > 0 && <div className="flex items-center gap-1 bg-amber-900/30 border border-amber-800/40 rounded-lg px-2 py-1">
              <Flame size={13} className="text-amber-400" />
              <span className="text-xs font-mono text-amber-300">{stats.streak.current}</span>
            </div>}
            <div className="flex items-center gap-1 bg-red-900/30 border border-red-800/40 rounded-lg px-2 py-1">
              <Clock size={13} className="text-red-400" />
              <span className="text-xs font-mono text-red-300">{problems.filter(p => p.nextReviewDate <= today()).length} due</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-400 font-mono ml-1 cursor-pointer">logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {loading
          ? <div className="flex justify-center py-12"><div className="spinner" /></div>
          : <>
              {view === "dashboard" && <Dashboard problems={problems} stats={stats} onReview={handleReview} onRefresh={loadData} />}
              {view === "list" && !editProblem && <ProblemList problems={problems} onDelete={deleteProblem} onEdit={p => { setEditProblem(p); setView("edit"); }} onUnfreeze={handleUnfreeze} />}
              {view === "add" && (
                <div className="space-y-4">
                  <h1 className="text-xl font-mono font-bold text-white">Add Problem</h1>
                  <Card className="p-5"><ProblemForm onSave={addProblem} onCancel={() => setView("dashboard")} /></Card>
                </div>
              )}
              {view === "edit" && editProblem && (
                <div className="space-y-4">
                  <h1 className="text-xl font-mono font-bold text-white">Edit Problem</h1>
                  <Card className="p-5"><ProblemForm initial={editProblem} onSave={updateProblem} onCancel={() => { setEditProblem(null); setView("list"); }} /></Card>
                </div>
              )}
              {view === "stats" && <Stats problems={problems} stats={stats} history={history} />}
            </>}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-800/60" style={{ background: "#0A0E1Aee", backdropFilter: "blur(12px)" }}>
        <div className="max-w-2xl mx-auto flex">
          {NAV.map(n => {
            const active = view === n.id || (n.id === "add" && view === "add");
            return (
              <button key={n.id} onClick={() => { setEditProblem(null); setView(n.id); }}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors cursor-pointer ${active ? "text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}>
                {n.id === "add"
                  ? <div className={`p-1.5 rounded-lg ${active ? "bg-indigo-600" : "bg-gray-800"} transition-colors`}><n.icon size={18} className={active ? "text-white" : "text-gray-400"} /></div>
                  : <n.icon size={18} />}
                <span className="text-xs font-mono">{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
