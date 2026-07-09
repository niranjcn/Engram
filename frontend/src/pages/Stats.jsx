import { useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Card from "../components/Card";
import { OUTCOMES, TOPICS } from "../lib/constants";
import { useAppData } from "../context/AppDataContext";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const CELL = 12;
const GAP = 3;
const MONTH_GAP = 14;

function getColor(count) {
  if (count === 0) return "#1F2937";
  if (count <= 3) return "#0e4429";
  if (count <= 7) return "#006d32";
  if (count <= 15) return "#26a641";
  return "#39d353";
}

export default function Stats() {
  const { problems, stats, history } = useAppData();
  const byTopic = TOPICS.map(t => ({ topic: t.length > 12 ? t.slice(0,12)+"…" : t, count: problems.filter(p => p.topic === t).length })).filter(x => x.count > 0);
  const outcomeCounts = Object.keys(OUTCOMES).map(k => ({ name: OUTCOMES[k].label, value: problems.filter(p => p.lastOutcome === k).length, color: OUTCOMES[k].color })).filter(x => x.value > 0);

  const histMap = useMemo(() => Object.fromEntries(history.map(h => [h.date, h.count])), [history]);

  const { groups, last30 } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(today);
    if (end.getDay() !== 6) end.setDate(end.getDate() + (6 - end.getDay()));

    const cur = new Date(start);
    let lastMonth = -1;
    const groups = [];

    while (cur <= end) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cur.toISOString().split("T")[0];
        week.push({ date: dateStr, count: histMap[dateStr] || 0 });
        cur.setDate(cur.getDate() + 1);
      }
      const month = new Date(week[0].date).getMonth();
      if (month !== lastMonth) {
        groups.push({ label: MONTHS[month], weeks: [] });
        lastMonth = month;
      }
      groups[groups.length - 1].weeks.push(week);
    }

    groups.forEach(g => {
      g.width = g.weeks.length * CELL + (g.weeks.length - 1) * GAP;
    });

    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    });

    return { groups, last30 };
  }, [histMap]);

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

      {/* Mobile: 30-day grid */}
      <Card className="p-4 block md:hidden">
        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">Activity — Last 30 Days</h3>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
          {last30.map(d => {
            const c = histMap[d] || 0;
            return <div key={d} title={`${d}: ${c} review${c!==1?"s":""}`} className="aspect-square rounded-sm transition-colors"
              style={{ background: c === 0 ? "#1F2937" : c === 1 ? "#0e4429" : c <= 3 ? "#006d32" : c <= 7 ? "#26a641" : "#39d353" }} />;
          })}
        </div>
        <div className="flex gap-2 mt-2 justify-end items-center">
          {[["#1F2937","0"],["#0e4429","1"],["#006d32","2-3"],["#26a641","4-7"],["#39d353","8+"]].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: c }} /><span className="text-xs text-gray-600">{l}</span></div>
          ))}
        </div>
      </Card>

      {/* Desktop: 12-month contribution graph */}
      <Card className="p-5 hidden md:block overflow-hidden">
        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-5">Activity — Last 12 Months</h3>
        <div className="flex" style={{ gap: MONTH_GAP, marginLeft: 32 }}>
          {groups.map((g, gi) => (
            <div key={gi} className="text-[10px] text-gray-500 font-mono leading-none" style={{ width: g.width }}>
              {g.label}
            </div>
          ))}
        </div>
        <div className="flex mt-1.5">
          <div className="flex flex-col shrink-0" style={{ gap: GAP, width: 24 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="text-[10px] text-gray-600 font-mono leading-none flex items-center justify-end pr-1" style={{ height: CELL }}>
                {d}
              </div>
            ))}
          </div>
          <div className="flex overflow-visible" style={{ gap: MONTH_GAP }}>
            {groups.map((g, gi) => (
              <HeatmapGrid key={gi} weeks={g.weeks} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-gray-500 font-mono">Less</span>
          {[0, 1, 4, 8, 16].map(c => (
            <div key={c} className="rounded-sm" style={{ width: CELL, height: CELL, background: getColor(c) }} />
          ))}
          <span className="text-[10px] text-gray-500 font-mono">More</span>
        </div>
      </Card>

      {byTopic.length > 0 && <Card className="p-4">
        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">Problems by Topic</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byTopic} margin={{ left: -20 }}>
            <XAxis dataKey="topic" tick={{ fill: "#6B7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} />
            <RechartsTooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#F9FAFB" }} />
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

function HeatmapGrid({ weeks }) {
  const [tooltip, setTooltip] = useState(null);

  const handleKeyDown = useCallback((e, day) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setTooltip(day);
    }
    if (e.key === "Escape") {
      setTooltip(null);
    }
  }, []);

  return (
    <div className="relative">
      <div
        className="grid"
        role="grid"
        aria-label="Activity heatmap"
        style={{
          gridTemplateRows: `repeat(7, ${CELL}px)`,
          gridTemplateColumns: `repeat(${weeks.length}, ${CELL}px)`,
          gap: `${GAP}px`,
          gridAutoFlow: "column",
        }}>
        {weeks.flat().map(day => (
          <div
            key={day.date}
            role="gridcell"
            tabIndex={0}
            aria-label={`${day.count} review${day.count !== 1 ? "s" : ""} on ${day.date}`}
            title={`${day.count} review${day.count !== 1 ? "s" : ""} on ${day.date}`}
            className="rounded-[4px] cursor-default transition-all duration-150 ease-in-out hover:scale-110 hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)] focus:scale-110 focus:shadow-[0_2px_8px_rgba(0,0,0,0.4)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ background: getColor(day.count) }}
            onMouseEnter={() => setTooltip(day)}
            onMouseLeave={() => setTooltip(null)}
            onFocus={() => setTooltip(day)}
            onBlur={() => setTooltip(null)}
            onKeyDown={(e) => handleKeyDown(e, day)}
          />
        ))}
      </div>
      {tooltip && (
        <div className="absolute z-50 pointer-events-none bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
          style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 8 }}>
          <div className="text-white text-xs font-semibold font-mono">{tooltip.date}</div>
          <div className="text-gray-300 text-[10px] font-mono mt-0.5">
            {tooltip.count} submission{tooltip.count !== 1 ? "s" : ""}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-700" />
        </div>
      )}
    </div>
  );
}
