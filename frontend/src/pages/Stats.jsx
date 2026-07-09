import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Card from "../components/Card";
import { OUTCOMES, TOPICS } from "../lib/constants";
import { useAppData } from "../context/AppDataContext";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const CELL = 12;

function getColor(count) {
  if (count === 0) return "#1F2937";
  if (count <= 3) return "#3730A3";
  if (count <= 7) return "#4F46E5";
  if (count <= 15) return "#6366F1";
  return "#818CF8";
}

export default function Stats() {
  const { problems, stats, history } = useAppData();
  const byTopic = TOPICS.map(t => ({ topic: t.length > 12 ? t.slice(0,12)+"…" : t, count: problems.filter(p => p.topic === t).length })).filter(x => x.count > 0);
  const outcomeCounts = Object.keys(OUTCOMES).map(k => ({ name: OUTCOMES[k].label, value: problems.filter(p => p.lastOutcome === k).length, color: OUTCOMES[k].color })).filter(x => x.value > 0);

  const histMap = useMemo(() => Object.fromEntries(history.map(h => [h.date, h.count])), [history]);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(today);
    if (end.getDay() !== 6) end.setDate(end.getDate() + (6 - end.getDay()));

    const weeks = [];
    const cur = new Date(start);
    let lastMonth = -1;
    const labels = [];

    while (cur <= end) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        week.push({ date: cur.toISOString().split("T")[0], count: histMap[cur.toISOString().split("T")[0]] || 0 });
        cur.setDate(cur.getDate() + 1);
      }
      const month = new Date(week[0].date).getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTHS[month], startWeek: weeks.length });
        lastMonth = month;
      }
      weeks.push(week);
    }

    return { weeks, monthLabels: labels };
  }, [histMap]);

  const monthLabelElements = useMemo(() => {
    return monthLabels.map((m, i) => {
      const endWeek = monthLabels[i + 1]?.startWeek ?? weeks.length;
      const span = endWeek - m.startWeek;
      return { label: m.label, span };
    });
  }, [monthLabels, weeks.length]);

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

      <Card className="p-4 overflow-x-auto">
        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">Activity — Last 12 Months</h3>
        <div className="flex ml-8 mb-1" style={{ gap: 2 }}>
          {monthLabelElements.map(m => (
            <div key={m.label} className="text-[10px] text-gray-500 font-mono leading-none" style={{ width: m.span * CELL + (m.span - 1) * 2 }}>
              {m.label}
            </div>
          ))}
        </div>
        <div className="flex">
          <div className="flex flex-col mr-1" style={{ gap: 2 }}>
            {DAYS.map((d, i) => <div key={i} className="text-[10px] text-gray-600 font-mono leading-none pt-px" style={{ height: CELL }}>{d}</div>)}
          </div>
          <div className="flex" style={{ gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: 2 }}>
                {week.map(day => (
                  <div key={day.date} className="rounded-sm cursor-default" title={`${day.count} review${day.count !== 1 ? "s" : ""} on ${day.date}`}
                    style={{ width: CELL, height: CELL, background: getColor(day.count) }} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[10px] text-gray-600 font-mono">Less</span>
          {[0, 1, 4, 8, 16].map(c => (
            <div key={c} className="rounded-sm" style={{ width: CELL, height: CELL, background: getColor(c) }} />
          ))}
          <span className="text-[10px] text-gray-600 font-mono">More</span>
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
