import { useState } from "react";
import { Brain, Eye, EyeOff } from "lucide-react";
import Card from "../components/Card";
import Btn from "../components/Btn";
import { auth } from "../api";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const res = await auth.login(email, password);
      localStorage.setItem("token", res.access_token);
      const user = await auth.me();
      onLogin(user);
    } catch (err) { setError(err.message); setBusy(false); }
  };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500";
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0A0E1A" }}>
      <Card className="p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-2"><Brain size={24} className="text-indigo-400" /><span className="text-lg font-mono font-bold text-white">DSA Tracker</span></div>
        <p className="text-center text-gray-500 text-sm mb-6 font-mono">Spaced Repetition for DSA Problems</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><input className={inp} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="relative">
            <input className={inp + " pr-10"} placeholder="Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <div className="text-red-400 text-xs font-mono bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{error}</div>}
          <Btn className="w-full justify-center" disabled={busy}>{busy ? <span className="spinner-sm" /> : "Sign In"}</Btn>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4 font-mono">No account? <button className="text-indigo-400 hover:underline cursor-pointer" onClick={() => onLogin(null, true)}>Register</button></p>
      </Card>
    </div>
  );
}
