import { useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TOPICS, OUTCOMES } from "../lib/constants";
import { useAppData } from "../context/AppDataContext";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CELL = 12;
const GAP = 3;
const MONTH_GAP = 14;

function getColor(count) {
  if (count === 0) return "#23262E";
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
    const cur = new Date(today.getFullYear(), today.getMonth() - 11, 1);

    const groups = [];
    for (let m = 0; m < 12; m++) {
      const year = cur.getFullYear();
      const month = cur.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const offset = (firstDay.getDay() + 6) % 7;
      const totalDays = m === 11 ? today.getDate() : lastDay.getDate();
      const numCols = Math.ceil((offset + totalDays) / 7);

      const weeks = [];
      let dayNum = 1;
      for (let col = 0; col < numCols; col++) {
        const colItems = [];
        for (let row = 0; row < 7; row++) {
          const idx = col * 7 + row;
          if (idx < offset || dayNum > totalDays) {
            colItems.push(null);
          } else {
            const d = new Date(year, month, dayNum);
            const ds = d.toISOString().split("T")[0];
            colItems.push({ date: ds, count: histMap[ds] || 0 });
            dayNum++;
          }
        }
        weeks.push(colItems);
      }

      groups.push({ label: MONTHS[month], weeks, width: weeks.length * CELL + (weeks.length - 1) * GAP });
      cur.setMonth(cur.getMonth() + 1);
    }

    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    });

    return { groups, last30 };
  }, [histMap]);

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
        <div className="flex justify-center" style={{ gap: MONTH_GAP }}>
          {groups.map((g, gi) => (
            <div key={gi} className="text-[10px] text-[#5D616C] leading-none" style={{ width: g.width }}>
              {g.label}
            </div>
          ))}
        </div>
        <div className="flex mt-1.5 justify-center">
          <div className="flex" style={{ gap: MONTH_GAP }}>
            {groups.map((g, gi) => (
              <HeatmapGrid key={gi} weeks={g.weeks} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-[#5D616C]">Less</span>
          {[0, 1, 4, 8, 16].map(c => (
            <div key={c} className="rounded-sm" style={{ width: CELL, height: CELL, background: getColor(c) }} />
          ))}
          <span className="text-[10px] text-[#5D616C]">More</span>
        </div>
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
        {weeks.flat().map((day, i) => {
          if (!day) return <div key={`e-${i}`} style={{ width: CELL, height: CELL }} />;
          return (
            <div
              key={day.date}
              role="gridcell"
              tabIndex={0}
              aria-label={`${day.count} review${day.count !== 1 ? "s" : ""} on ${day.date}`}
              title={`${day.count} review${day.count !== 1 ? "s" : ""} on ${day.date}`}
              className="rounded-[4px] cursor-default transition-all duration-150 ease-in-out hover:scale-110 hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)] focus:scale-110 focus:shadow-[0_2px_8px_rgba(0,0,0,0.4)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              style={{ background: getColor(day.count) }}
              onMouseEnter={() => setTooltip(day)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={() => setTooltip(day)}
              onBlur={() => setTooltip(null)}
              onKeyDown={(e) => handleKeyDown(e, day)}
            />
          );
        })}
      </div>
      {tooltip && (
        <div className="absolute z-50 pointer-events-none bg-[#16181E] border border-[#23262E] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
          style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 8 }}>
          <div className="text-[#F1F1F3] text-xs font-semibold">{tooltip.date}</div>
          <div className="text-[#8B8F96] text-[10px] mt-0.5">
            {tooltip.count} submission{tooltip.count !== 1 ? "s" : ""}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#16181E] border-r border-b border-[#23262E]" />
        </div>
      )}
    </div>
  );
}
