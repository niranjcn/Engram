import { useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Eye, EyeOff, Users } from "lucide-react";
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
      await auth.login(email, password);
      const user = await auth.me();
      onLogin(user);
    } catch (err) { setError(err.message); setBusy(false); }
  };
  const inp = "w-full bg-[#1C1E26] border border-[#23262E] rounded-lg px-3 py-2.5 text-sm text-[#F1F1F3] focus:outline-none focus:border-[#3B82F6] transition-colors placeholder-[#5D616C]";
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0B0D12" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 flex items-center justify-center mx-auto mb-4">
            <Brain size={24} className="text-[#3B82F6]" />
          </div>
          <h1 className="text-xl font-semibold text-[#F1F1F3] mb-1">Engram</h1>
          <p className="text-sm text-[#5D616C]">Spaced Repetition for DSA</p>
        </div>
        <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input className={inp} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <input className={inp + " pr-10"} placeholder="Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5D616C] hover:text-[#8B8F96] transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <div className="text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded px-3 py-2">{error}</div>}
            <Btn className="w-full justify-center" disabled={busy}>{busy ? <span className="spinner-sm" /> : "Sign In"}</Btn>
          </form>
          <p className="text-center text-xs text-[#5D616C] mt-4">No account? <button className="text-[#3B82F6] hover:underline transition-colors" onClick={() => onLogin(null, true)}>Register</button></p>
          <Link to="/users" className="flex items-center justify-center gap-1.5 text-xs text-[#5D616C] hover:text-[#8B8F96] mt-3 pt-3 border-t border-[#23262E] transition-colors">
            <Users size={14} /> Browse community profiles
          </Link>
        </div>
      </div>
    </div>
  );
}
