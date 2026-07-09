import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TOPICS, OUTCOMES } from "../lib/constants";
import { useAppData } from "../context/AppDataContext";
import Heatmap from "../components/Heatmap";

export default function Stats() {
  const { problems, stats, history } = useAppData();
  const byTopic = TOPICS.map(t => ({ topic: t.length > 12 ? t.slice(0,12)+"…" : t, count: problems.filter(p => p.topic === t).length })).filter(x => x.count > 0);
  const outcomeCounts = Object.keys(OUTCOMES).map(k => ({ name: OUTCOMES[k].label, value: problems.filter(p => p.lastOutcome === k).length, color: OUTCOMES[k].color })).filter(x => x.value > 0);

  const histMap = useMemo(() => Object.fromEntries(history.map(h => [h.date, h.count])), [history]);

  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  }), []);

  return (
    <div className="space-y-5 md:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-[#F1F1F3]">Stats</h1>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
        {[
          ["Streak", (stats.streak?.current || 0) + " days", "#F59E0B"],
          ["Best Streak", (stats.streak?.longest || 0) + " days", "#F59E0B"],
          ["Mastered", stats.mastered || 0 + " problems", "#22C55E"]
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-xl border border-[#23262E] bg-[#16181E] p-3 md:p-4 text-center">
            <div className="text-base md:text-lg font-semibold text-[#F1F1F3]">{v}</div>
            <div className="text-xs text-[#5D616C]">{l}</div>
          </div>
        ))}
      </div>

      {/* Mobile: 30-day grid */}
      <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-3 md:p-4 block md:hidden">
        <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-4">Activity — Last 30 Days</h3>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
          {last30.map(d => {
            const c = histMap[d] || 0;
            return <div key={d} title={`${d}: ${c} review${c!==1?"s":""}`} className="aspect-square rounded-sm transition-colors"
              style={{ background: c === 0 ? "#23262E" : c === 1 ? "#0e4429" : c <= 3 ? "#006d32" : c <= 7 ? "#26a641" : "#39d353" }} />;
          })}
        </div>
        <div className="flex gap-2 mt-2 justify-end items-center">
          {[["#23262E","0"],["#0e4429","1"],["#006d32","2-3"],["#26a641","4-7"],["#39d353","8+"]].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: c }} /><span className="text-xs text-[#5D616C]">{l}</span></div>
          ))}
        </div>
      </div>

      {/* Desktop: 12-month contribution graph */}
      <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-5 hidden md:block">
        <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-5">Activity — Last 12 Months</h3>
        <Heatmap data={history} />
      </div>

      {/* Problems by Topic */}
      {byTopic.length > 0 && <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-5">
        <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-4">Problems by Topic</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byTopic} margin={{ left: -20 }}>
            <XAxis dataKey="topic" tick={{ fill: "#5D616C", fontSize: 11 }} />
            <YAxis tick={{ fill: "#5D616C", fontSize: 11 }} />
            <RechartsTooltip contentStyle={{ background: "#16181E", border: "1px solid #23262E", borderRadius: 8, color: "#F1F1F3" }} />
            <Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>}

      {/* Outcome Distribution */}
      {outcomeCounts.length > 0 && <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-5">
        <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-4">Outcome Distribution</h3>
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
                <span className="text-[#8B8F96]">{e.name}</span>
                <span className="text-[#F1F1F3] ml-auto pl-3">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>}
    </div>
  );
}


