import { useState, useEffect, useCallback } from "react";
import { Brain, Plus, List, BarChart2, Home, ExternalLink, Download, Search, ChevronRight, X, Lightbulb, Eye, EyeOff, Trophy, Clock, Flame, BookOpen, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { auth, problemsApi, reviewsApi } from "./api";

// ── Constants ────────────────────────────────────────────────────────────────

const SAFE_URL_RE = /^https?:\/\//i;
const safeUrl = (url) => (url && SAFE_URL_RE.test(url) ? url : null);

const TOPICS = ["Array","String","Sliding Window","Two Pointers","Prefix Sum","HashMap","Stack","Queue","Binary Search","Linked List","Tree","BST","BFS","DFS","Heap","Backtracking","Graph","Union Find","Topological Sort","Dynamic Programming","Greedy","Math","Bit Manipulation","Trie","Segment Tree"];
const DIFFICULTIES = ["Easy","Medium","Hard"];
const OUTCOMES = {
  solved_solo: { label: "Solved Solo", icon: CheckCircle, color: "#10B981", short: "✅" },
  used_hint:   { label: "Used Hint",   icon: Lightbulb,     color: "#F59E0B", short: "💡" },
  checked_code:{ label: "Checked Code",icon: Eye,           color: "#EF4444", short: "👀" },
};
const DIFF_COLOR = { Easy: "#10B981", Medium: "#F59E0B", Hard: "#EF4444" };

// ── SM-2 helpers (client-side for UI preview, backend is source of truth) ────

function qualityFromOutcome(outcome) {
  return outcome === "solved_solo" ? 5 : outcome === "used_hint" ? 3 : 1;
}

function getStage(problem) {
  if (problem.frozen) return "frozen";
  if (problem.interval > 21) return "mastered";
  if ((problem.repetitions || 0) >= 3) return "reviewing";
  return "learning";
}

const STAGE_META = {
  learning:  { label: "Learning",  color: "#EF4444", emoji: "🔴" },
  reviewing: { label: "Reviewing", color: "#F59E0B", emoji: "🟡" },
  mastered:  { label: "Mastered",  color: "#10B981", emoji: "🏆" },
  frozen:    { label: "Frozen",    color: "#818CF8", emoji: "❄️"  },
};

function sm2(problem, outcome) {
  const q = qualityFromOutcome(outcome);
  let { interval = 1, easeFactor = 2.5, repetitions = 0, soloStreak = 0 } = problem;
  if (q < 3) { interval = 1; repetitions = 0; soloStreak = 0; }
  else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }
  soloStreak = outcome === "solved_solo" ? soloStreak + 1 : 0;
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (problem.repetitions === 0) {
    interval = outcome === "solved_solo" ? 3 : 1;
  }
  const frozen = interval > 21 && soloStreak >= 3;
  const next = new Date();
  next.setDate(next.getDate() + interval);
  return {
    interval, easeFactor, repetitions, soloStreak, frozen,
    nextReviewDate: next.toISOString().split("T")[0],
    lastOutcome: outcome,
  };
}

// ── Date helpers ─────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];
const daysDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);

// ── Reusable UI ──────────────────────────────────────────────────────────────

const Badge = ({ children, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44` }}
    className="px-2 py-0.5 rounded text-xs font-mono font-semibold">{children}</span>
);

const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-indigo-900/30 bg-gray-900 ${className}`}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", className = "", disabled }) => {
  const styles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    ghost:   "bg-gray-800 hover:bg-gray-700 text-gray-300",
    danger:  "bg-red-900/40 hover:bg-red-800/60 text-red-400",
    success: "bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400",
    amber:   "bg-amber-900/40 hover:bg-amber-800/60 text-amber-400",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${styles[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      {children}
    </button>
  );
};

// ── Login / Register ─────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
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

function RegisterPage({ onRegister }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setBusy(true);
    try {
      const res = await auth.register(email, username, password);
      localStorage.setItem("token", res.access_token);
      const user = await auth.me();
      onRegister(user);
    } catch (err) { setError(err.message); setBusy(false); }
  };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500";
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0A0E1A" }}>
      <Card className="p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-2"><Brain size={24} className="text-indigo-400" /><span className="text-lg font-mono font-bold text-white">DSA Tracker</span></div>
        <p className="text-center text-gray-500 text-sm mb-6 font-mono">Create your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><input className={inp} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div><input className={inp} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} /></div>
          <div className="relative">
            <input className={inp + " pr-10"} placeholder="Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <input className={inp + " pr-10"} placeholder="Confirm Password" type={showConfirm ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <div className="text-red-400 text-xs font-mono bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{error}</div>}
          <Btn className="w-full justify-center" disabled={busy}>{busy ? <span className="spinner-sm" /> : "Register"}</Btn>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4 font-mono">Already have an account? <button className="text-indigo-400 hover:underline cursor-pointer" onClick={() => onRegister(null, true)}>Sign In</button></p>
      </Card>
    </div>
  );
}

// ── Add / Edit Problem Form ──────────────────────────────────────────────────

const OUTCOME_OPTIONS = [
  { value: "solved_solo",   label: "✅ Solved Solo — figured it out completely",  color: "#10B981" },
  { value: "used_hint",     label: "💡 Used Hint — needed a nudge",               color: "#F59E0B" },
  { value: "checked_code",  label: "👀 Checked Code — had to look at solution",   color: "#EF4444" },
];

const FIRST_ATTEMPT_INTERVAL = { solved_solo: 3, used_hint: 1, checked_code: 1 };

function getNextReviewPreview(outcome, existing) {
  let interval;
  if (existing && existing.repetitions > 0) interval = sm2(existing, outcome).interval;
  else interval = FIRST_ATTEMPT_INTERVAL[outcome];
  const d = new Date(); d.setDate(d.getDate() + interval);
  return { interval, date: d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" }) };
}

function ProblemForm({ onSave, onCancel, initial }) {
  const blank = { title:"", url:"", topic:"Array", difficulty:"Medium", notes:"", keyInsight:"", outcome: "solved_solo" };
  const [form, setForm] = useState({ ...blank, ...(initial || {}), outcome: initial?.lastOutcome || "solved_solo" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const preview = getNextReviewPreview(form.outcome, initial);
  const outcomeInfo = OUTCOME_OPTIONS.find(o => o.value === form.outcome);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    onSave(form, initial);
  };

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors";

  return (
    <div className="space-y-4">
      <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Problem Title *</label>
        <input className={inp} value={form.title} onChange={set("title")} placeholder="e.g. Two Sum" /></div>
      <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">URL (optional)</label>
        <input className={inp} value={form.url} onChange={set("url")} placeholder="https://leetcode.com/problems/..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Topic</label>
          <select className={inp} value={form.topic} onChange={set("topic")}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Difficulty</label>
          <select className={inp} value={form.difficulty} onChange={set("difficulty")}>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select></div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">How did you solve it?</label>
        <select className={inp} value={form.outcome} onChange={set("outcome")}>
          {OUTCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ background: outcomeInfo.color + "11", borderColor: outcomeInfo.color + "33" }}>
          <Clock size={13} style={{ color: outcomeInfo.color }} className="shrink-0" />
          <span className="text-xs font-mono" style={{ color: outcomeInfo.color }}>
            Next review in <strong>{preview.interval} day{preview.interval !== 1 ? "s" : ""}</strong> → {preview.date}
          </span>
        </div>
      </div>
      <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Notes</label>
        <textarea className={inp + " resize-none"} rows={3} value={form.notes} onChange={set("notes")} placeholder="Your approach, observations..." /></div>
      <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Key Insight</label>
        <textarea className={inp + " resize-none"} rows={2} value={form.keyInsight} onChange={set("keyInsight")} placeholder="The aha moment that unlocks this problem..." /></div>
      <div className="flex gap-2 pt-1">
        <Btn onClick={handleSave}><Plus size={14} />{initial ? "Update" : "Add Problem"}</Btn>
        <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
      </div>
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ problem, onReview }) {
  const [done, setDone] = useState(false);
  const [justFrozen, setJustFrozen] = useState(false);
  const stage = getStage(problem);
  const stageMeta = STAGE_META[stage];

  if (done && !justFrozen) return null;
  if (justFrozen) return (
    <Card className="p-4 border-indigo-800/30">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="text-3xl">❄️</span>
        <p className="text-indigo-200 font-mono font-semibold text-sm">{problem.title} is now Frozen!</p>
        <p className="text-xs text-gray-400">You solved it solo 3 times with interval &gt;21 days.<br/>It won't appear in reviews anymore. You've mastered it.</p>
      </div>
    </Card>
  );

  return (
    <Card className="p-4 border-indigo-800/30">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-mono font-semibold text-sm">{problem.title}</span>
            <span className="text-xs" style={{ color: stageMeta.color }}>{stageMeta.emoji} {stageMeta.label}</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Badge color={DIFF_COLOR[problem.difficulty]}>{problem.difficulty}</Badge>
            <Badge color="#6366F1">{problem.topic}</Badge>
            {problem.lastOutcome && <Badge color={OUTCOMES[problem.lastOutcome].color}>{OUTCOMES[problem.lastOutcome].short} Last: {OUTCOMES[problem.lastOutcome].label}</Badge>}
            {problem.soloStreak > 0 && <Badge color="#818CF8">🔥 {problem.soloStreak}/3 solo streak</Badge>}
          </div>
        </div>
        {safeUrl(problem.url) && <a href={safeUrl(problem.url)} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-400 shrink-0"><ExternalLink size={15} /></a>}
      </div>
      {problem.keyInsight && <div className="text-xs text-indigo-300 bg-indigo-950/40 rounded px-2 py-1.5 mb-3 font-mono">💡 {problem.keyInsight}</div>}
      <div className="text-xs text-gray-500 mb-3">How did you do this time?</div>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(OUTCOMES).map(([k, v]) => (
          <button key={k} onClick={() => onReview(problem.id, k, (updated) => {
            if (updated.frozen) setJustFrozen(true); else setDone(true);
          })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer"
            style={{ borderColor: v.color + "44", color: v.color, background: v.color + "11" }}>
            <v.icon size={13} />{v.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ problems, stats, onReview, onRefresh }) {
  const td = today();
  const due = problems.filter(p => !p.frozen && p.nextReviewDate <= td).sort((a, b) => daysDiff(a.nextReviewDate, b.nextReviewDate));
  const upcoming = problems.filter(p => !p.frozen && p.nextReviewDate > td && daysDiff(p.nextReviewDate, td) <= 7).sort((a, b) => daysDiff(a.nextReviewDate, b.nextReviewDate));
  const mastered = problems.filter(p => getStage(p) === "mastered");
  const frozen = problems.filter(p => p.frozen);

  const StatBox = ({ icon: Icon, label, value, color }) => (
    <Card className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: color + "22" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-mono font-bold text-white">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-mono font-bold text-white mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}</p>
        </div>
        <button onClick={onRefresh} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"><RefreshCw size={15} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox icon={Flame} label="Day Streak" value={stats.streak?.current || 0} color="#F59E0B" />
        <StatBox icon={Clock} label="Due Today" value={due.length} color="#EF4444" />
        <StatBox icon={Trophy} label="Mastered" value={mastered.length} color="#10B981" />
        <StatBox icon={BookOpen} label="Frozen ❄️" value={frozen.length} color="#818CF8" />
      </div>

      <div className="flex gap-3 flex-wrap">
        {Object.entries(STAGE_META).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs" style={{ color: v.color }}>
            <span>{v.emoji}</span><span className="font-mono">{v.label}</span>
            <span className="text-gray-600">({problems.filter(p => getStage(p) === k).length})</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xs font-mono text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Clock size={13} /> Due Today ({due.length})
        </h2>
        {due.length === 0
          ? <Card className="p-6 text-center"><p className="text-gray-500 text-sm">🎉 Nothing due today. Add a problem or come back tomorrow!</p></Card>
          : <div className="space-y-3">{due.map(p => <ReviewCard key={p.id} problem={p} onReview={onReview} />)}</div>}
      </div>

      {upcoming.length > 0 && <div>
        <h2 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <ChevronRight size={13} /> This Week ({upcoming.length})
        </h2>
        <div className="space-y-2">
          {upcoming.map(p => {
            const d = daysDiff(p.nextReviewDate, td);
            const stage = getStage(p);
            const sm = STAGE_META[stage];
            return (
              <Card key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono" style={{ color: sm.color }}>{sm.emoji}</span>
                  <span className="text-sm text-gray-300 font-mono truncate">{p.title}</span>
                  <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                  {d <= 3 && <Badge color="#F59E0B">Soon</Badge>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500 font-mono">{d}d</span>
                  <span className="text-xs text-gray-600">{p.nextReviewDate}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>}

      {mastered.length > 0 && <div>
        <h2 className="text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#10B981" }}>
          🏆 Mastered — Next Freeze Candidates ({mastered.length})
        </h2>
        <div className="space-y-2">
          {mastered.map(p => (
            <Card key={p.id} className="px-4 py-3 flex items-center justify-between border-emerald-900/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-300 font-mono">{p.title}</span>
                <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                <Badge color="#6366F1">{p.topic}</Badge>
                <Badge color="#10B981">interval {p.interval}d</Badge>
                {p.soloStreak > 0 && <Badge color="#818CF8">🔥 {p.soloStreak}/3 solo streak</Badge>}
              </div>
              <span className="text-xs text-gray-500 font-mono">next review: {p.nextReviewDate}</span>
            </Card>
          ))}
        </div>
      </div>}

      {frozen.length > 0 && <div>
        <h2 className="text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#818CF8" }}>
          ❄️ Frozen — Fully Mastered ({frozen.length})
        </h2>
        <div className="space-y-2">
          {frozen.map(p => (
            <Card key={p.id} className="px-4 py-3 flex items-center justify-between border-indigo-900/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-400 font-mono">{p.title}</span>
                <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                <Badge color="#6366F1">{p.topic}</Badge>
              </div>
              <span className="text-xs font-mono" style={{ color: "#818CF8" }}>❄️ done</span>
            </Card>
          ))}
        </div>
      </div>}
    </div>
  );
}

// ── Problem List ─────────────────────────────────────────────────────────────

function ProblemList({ problems, onDelete, onEdit, onUnfreeze }) {
  const [search, setSearch] = useState("");
  const [topicF, setTopicF] = useState("All");
  const [diffF, setDiffF] = useState("All");
  const [stageF, setStageF] = useState("All");

  const STAGE_FILTERS = [
    { key: "All", label: "All" },
    { key: "learning", label: "🔴 Learning" },
    { key: "reviewing", label: "🟡 Reviewing" },
    { key: "mastered", label: "🏆 Mastered" },
    { key: "frozen", label: "❄️ Frozen" },
  ];

  const td = today();
  const filtered = problems.filter(p =>
    (stageF === "All" || getStage(p) === stageF) &&
    (topicF === "All" || p.topic === topicF) &&
    (diffF === "All" || p.difficulty === diffF) &&
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const sel = "bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold text-white">Problems</h1>
        <span className="text-xs text-gray-500 font-mono">{filtered.length} problems</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-32">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={sel} value={topicF} onChange={e => setTopicF(e.target.value)}>
          <option>All</option>{TOPICS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className={sel} value={diffF} onChange={e => setDiffF(e.target.value)}>
          <option>All</option>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STAGE_FILTERS.map(f => (
          <button key={f.key} onClick={() => setStageF(f.key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
              stageF === f.key
                ? "bg-gray-700 text-white border border-gray-600"
                : "bg-gray-800/50 text-gray-500 hover:text-gray-300 border border-transparent"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <Card className="p-8 text-center"><p className="text-gray-500 text-sm">No problems yet. Add your first one!</p></Card>}
        {filtered.map(p => {
          const stage = getStage(p);
          const sm = STAGE_META[stage];
          const overdue = !p.frozen && p.nextReviewDate < td;
          const dueToday = !p.frozen && p.nextReviewDate === td;
          return (
            <Card key={p.id} className="px-4 py-3" style={p.frozen ? { opacity: 0.7 } : {}}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm text-white font-mono font-semibold truncate">{p.title}</span>
                    <span className="text-xs font-mono" style={{ color: sm.color }}>{sm.emoji} {sm.label}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                    <Badge color="#6366F1">{p.topic}</Badge>
                    {p.lastOutcome && <Badge color={OUTCOMES[p.lastOutcome].color}>{OUTCOMES[p.lastOutcome].short}</Badge>}
                    {p.soloStreak > 0 && !p.frozen && <Badge color="#818CF8">🔥 {p.soloStreak}/3</Badge>}
                    {overdue && <Badge color="#EF4444">Overdue {Math.abs(daysDiff(p.nextReviewDate, td))}d</Badge>}
                    {dueToday && <Badge color="#F59E0B">Due Today</Badge>}
                    {!overdue && !dueToday && !p.frozen && <span className="text-xs text-gray-600 font-mono">in {daysDiff(p.nextReviewDate, td)}d</span>}
                    {p.frozen && <span className="text-xs font-mono" style={{ color: "#818CF8" }}>review complete</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {safeUrl(p.url) && <a href={safeUrl(p.url)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-gray-500 hover:text-indigo-400 hover:bg-indigo-950/40 transition-colors"><ExternalLink size={14} /></a>}
                  {p.frozen
                    ? <button onClick={() => onUnfreeze(p.id)} className="p-1.5 rounded text-indigo-400 hover:text-white hover:bg-indigo-800/40 transition-colors" title="Unfreeze — add back to reviews"><RefreshCw size={14} /></button>
                    : <button onClick={() => onEdit(p)} className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-blue-950/40 transition-colors"><Search size={14} /></button>}
                  <button onClick={() => onDelete(p.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"><X size={14} /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────

function Stats({ problems, stats, history }) {
  const byTopic = TOPICS.map(t => ({ topic: t.length > 12 ? t.slice(0,12)+"…" : t, count: problems.filter(p => p.topic === t).length })).filter(x => x.count > 0);
  const outcomeCounts = Object.keys(OUTCOMES).map(k => ({ name: OUTCOMES[k].label, value: problems.filter(p => p.lastOutcome === k).length, color: OUTCOMES[k].color })).filter(x => x.value > 0);
  const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.toISOString().split("T")[0]; });
  const histMap = Object.fromEntries(history.map(h => [h.date, h.count]));

  const exportData = () => {
    const exp = { generatedBy: "DSA Tracker", generatedAt: new Date().toISOString(), problems: problems.map(({ notes, keyInsight, ...rest }) => rest) };
    const blob = new Blob([JSON.stringify(exp, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dsa-problems.json"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold text-white">Stats</h1>
        <Btn onClick={exportData} variant="ghost"><Download size={13} />Export</Btn>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[["🔥 Streak", (stats.streak?.current || 0) + " days"], ["🏆 Best", (stats.streak?.longest || 0) + " days"], ["✅ Mastered", stats.mastered || 0 + " problems"]].map(([l,v]) => (
          <Card key={l} className="p-3 text-center">
            <div className="text-lg font-mono font-bold text-white">{v}</div>
            <div className="text-xs text-gray-500">{l}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">Activity — Last 30 Days</h3>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
          {last30.map(d => {
            const c = histMap[d] || 0;
            return <div key={d} title={`${d}: ${c} review${c!==1?"s":""}`} className="aspect-square rounded-sm transition-colors"
              style={{ background: c === 0 ? "#1F2937" : c === 1 ? "#3730A3" : c <= 3 ? "#4F46E5" : "#818CF8" }} />;
          })}
        </div>
        <div className="flex gap-2 mt-2 justify-end items-center">
          {[["#1F2937","0"],["#3730A3","1"],["#4F46E5","2-3"],["#818CF8","4+"]].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: c }} /><span className="text-xs text-gray-600">{l}</span></div>
          ))}
        </div>
      </Card>

      {byTopic.length > 0 && <Card className="p-4">
        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">Problems by Topic</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byTopic} margin={{ left: -20 }}>
            <XAxis dataKey="topic" tick={{ fill: "#6B7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#F9FAFB" }} />
            <Bar dataKey="count" fill="#6366F1" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>}

      {outcomeCounts.length > 0 && <Card className="p-4">
        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">Outcome Distribution</h3>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={outcomeCounts} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                {outcomeCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {outcomeCounts.map(e => (
              <div key={e.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ background: e.color }} />
                <span className="text-gray-400">{e.name}</span>
                <span className="text-white font-mono ml-auto pl-3">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>}
    </div>
  );
}

// ── CheckCircle icon (needed by OUTCOMES but not imported at top) ────────────
function CheckCircle(props) { return (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  // App state
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
      // if 401, redirect to login
      if (err.message?.includes("Not authenticated") || err.message?.includes("Invalid token") || err.message?.includes("Token expired")) {
        localStorage.removeItem("token");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth check on mount
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

  // ── CRUD operations ────────────────────────────────────────────────────

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

  // ── Loading / Auth gate ────────────────────────────────────────────────

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

  // ── Main app ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A", fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
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

      {/* Content */}
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

      {/* Bottom Nav */}
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
