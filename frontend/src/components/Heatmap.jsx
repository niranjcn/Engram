import { useState, useCallback } from "react";

const CELL = 12;
const GAP = 3;
const MONTH_GAP = 14;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getColor(count) {
  if (count === 0) return "#23262E";
  if (count <= 3) return "#0e4429";
  if (count <= 7) return "#006d32";
  if (count <= 15) return "#26a641";
  return "#39d353";
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

export default function Heatmap({ data }) {
  if (!data || data.length === 0) return <p className="text-sm text-[#5D616C]">No activity data</p>;

  const histMap = Object.fromEntries(data.map(h => [h.date, h.count]));

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

  return (
    <div>
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
  );
}
