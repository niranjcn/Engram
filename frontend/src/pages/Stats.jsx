import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Card from "../components/Card";
import { OUTCOMES, TOPICS } from "../lib/constants";
import { useAppData } from "../context/AppDataContext";

export default function Stats() {
  const { problems, stats, history } = useAppData();
  const byTopic = TOPICS.map(t => ({ topic: t.length > 12 ? t.slice(0,12)+"…" : t, count: problems.filter(p => p.topic === t).length })).filter(x => x.count > 0);
  const outcomeCounts = Object.keys(OUTCOMES).map(k => ({ name: OUTCOMES[k].label, value: problems.filter(p => p.lastOutcome === k).length, color: OUTCOMES[k].color })).filter(x => x.value > 0);
  const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.toISOString().split("T")[0]; });
  const histMap = Object.fromEntries(history.map(h => [h.date, h.count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold text-white">Stats</h1>
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
