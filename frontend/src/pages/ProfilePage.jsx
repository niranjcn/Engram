import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Users, BookOpen, Flame, Trophy, Star } from "lucide-react";
import { profilesApi } from "../api";
import Heatmap from "../components/Heatmap";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { TOPICS, OUTCOMES, DIFF_COLOR } from "../lib/constants";

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#23262E] bg-[#16181E] p-3 md:p-4">
      <div className="p-1.5 md:p-2 rounded-lg" style={{ background: color + "15" }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div className="text-xl md:text-2xl font-semibold text-[#F1F1F3]">{value}</div>
        <div className="text-xs text-[#5D616C]">{label}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      profilesApi.get(username),
      profilesApi.history(username),
      profilesApi.problems(username),
    ])
      .then(([p, h, pr]) => { setProfile(p); setHistory(h); setProblems(pr); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  const byTopic = useMemo(
    () => TOPICS.map(t => ({ topic: t.length > 12 ? t.slice(0, 12) + "…" : t, count: problems.filter(p => p.topic === t).length })).filter(x => x.count > 0),
    [problems],
  );

  const outcomeCounts = useMemo(
    () => Object.keys(OUTCOMES).map(k => ({ name: OUTCOMES[k].label, value: problems.filter(p => p.lastOutcome === k).length, color: OUTCOMES[k].color })).filter(x => x.value > 0),
    [problems],
  );

  const histMap = useMemo(() => Object.fromEntries(history.map(h => [h.date, h.count])), [history]);

  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  }), []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="text-sm text-[#5D616C] font-mono">Loading profile...</div>
    </div>
  );

  if (error || !profile) return (
    <Card className="p-10 text-center">
      <Users size={36} className="mx-auto text-[#5D616C] mb-3" />
      <p className="text-sm text-[#5D616C] mb-4">{error || "Profile not found"}</p>
      <Link to="/users" className="inline-flex items-center gap-1.5 text-xs text-[#3B82F6] hover:underline">
        <Users size={14} /> Browse all users
      </Link>
    </Card>
  );

  return (
    <div className="space-y-5 md:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/users" className="p-1.5 rounded-lg text-[#5D616C] hover:text-[#F1F1F3] hover:bg-[#23262E] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 flex items-center justify-center">
              <span className="text-base font-semibold text-[#3B82F6]">{profile.username[0].toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-[#F1F1F3]">{profile.username}</h1>
              <p className="text-xs text-[#5D616C]">Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat boxes — fill width */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox icon={BookOpen} label="Total Solved" value={profile.total_solved} color="#3B82F6" />
        <StatBox icon={Trophy} label="Mastered" value={profile.mastered} color="#22C55E" />
        <StatBox icon={Flame} label="Streak" value={(profile.current_streak || 0) + "d"} color="#F59E0B" />
        <StatBox icon={Star} label="Best Streak" value={(profile.longest_streak || 0) + "d"} color="#818CF8" />
      </div>

      {/* Activity — full width */}
      <Card className="p-3 md:p-5">
        <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-4 md:mb-5">Activity</h3>
        {/* Mobile: 30-day grid */}
        <div className="block md:hidden">
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
            {last30.map(d => {
              const c = histMap[d] || 0;
              return <div key={d} title={`${d}: ${c} review${c !== 1 ? "s" : ""}`} className="aspect-square rounded-sm transition-colors"
                style={{ background: c === 0 ? "#23262E" : c === 1 ? "#0e4429" : c <= 3 ? "#006d32" : c <= 7 ? "#26a641" : "#39d353" }} />;
            })}
          </div>
          <div className="flex gap-2 mt-2 justify-end items-center">
            {[["#23262E", "0"], ["#0e4429", "1"], ["#006d32", "2-3"], ["#26a641", "4-7"], ["#39d353", "8+"]].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: c }} /><span className="text-xs text-[#5D616C]">{l}</span></div>
            ))}
          </div>
        </div>
        {/* Desktop: heatmap */}
        <div className="hidden md:block">
          <Heatmap data={history} />
        </div>
      </Card>

      {/* Charts side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {byTopic.length > 0 && <Card className="p-5">
          <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-4">Problems by Topic</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTopic} margin={{ left: -20 }}>
              <XAxis dataKey="topic" tick={{ fill: "#5D616C", fontSize: 11 }} />
              <YAxis tick={{ fill: "#5D616C", fontSize: 11 }} />
              <RechartsTooltip contentStyle={{ background: "#16181E", border: "1px solid #23262E", borderRadius: 8, color: "#F1F1F3" }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>}

        {outcomeCounts.length > 0 && <Card className="p-5">
          <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-4">Outcome Distribution</h3>
          <div className="flex items-center gap-6 h-[220px]">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={outcomeCounts} cx="50%" cy="50%" innerRadius={44} outerRadius={68} dataKey="value" paddingAngle={3}>
                  {outcomeCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {outcomeCounts.map(e => (
                <div key={e.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: e.color }} />
                  <span className="text-[#8B8F96]">{e.name}</span>
                  <span className="text-[#F1F1F3] ml-3">{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>}
      </div>

      {/* Problem list — full width */}
      {problems.length > 0 && <Card className="p-5">
        <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-4">Problems ({problems.length})</h3>
        <div className="space-y-1">
          {problems.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#1C1E26] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm text-[#F1F1F3] truncate">{p.title}</span>
                <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-xs text-[#5D616C]">{p.topic}</span>
                {p.lastOutcome && (
                  <span className="text-xs" title={OUTCOMES[p.lastOutcome]?.label || p.lastOutcome}>
                    {OUTCOMES[p.lastOutcome]?.short || ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>}
    </div>
  );
}
