import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, ChevronDown, X, ExternalLink, RefreshCw } from "lucide-react";
import Badge from "../components/Badge";
import { OUTCOMES, DIFF_COLOR, STAGE_META, TOPICS, DIFFICULTIES, safeUrl } from "../lib/constants";
import { getStage, today, daysDiff } from "../lib/utils";
import { useAppData } from "../context/AppDataContext";

export default function ProblemList() {
  const navigate = useNavigate();
  const { problems, deleteProblem, unfreezeProblem } = useAppData();
  const [search, setSearch] = useState("");
  const [topicF, setTopicF] = useState("All");
  const [diffF, setDiffF] = useState("All");
  const [stageF, setStageF] = useState("All");
  const [expandedNotes, setExpandedNotes] = useState({});

  const STAGE_FILTERS = [
    { key: "All", label: "All" },
    { key: "learning", label: "Learning" },
    { key: "reviewing", label: "Reviewing" },
    { key: "mastered", label: "Mastered" },
    { key: "frozen", label: "Frozen" },
  ];

  const td = today();
  const filtered = problems.filter(p =>
    (stageF === "All" || getStage(p) === stageF) &&
    (topicF === "All" || p.topic === topicF) &&
    (diffF === "All" || p.difficulty === diffF) &&
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const sel = "bg-[#1C1E26] border border-[#23262E] rounded-lg px-2 py-1.5 text-xs text-[#8B8F96] focus:outline-none focus:border-[#3B82F6]";

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this problem?");
    if (!confirmed) return;
    try { await deleteProblem(id) } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-[#F1F1F3]">Problems</h1>
        <span className="text-xs md:text-sm text-[#5D616C]">{filtered.length} problems</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-32">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5D616C]" />
          <input className="w-full bg-[#1C1E26] border border-[#23262E] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F1F1F3] focus:outline-none focus:border-[#3B82F6]" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={sel} value={topicF} onChange={e => setTopicF(e.target.value)}>
          <option>All</option>{TOPICS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className={sel} value={diffF} onChange={e => setDiffF(e.target.value)}>
          <option>All</option>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Stage filters */}
      <div className="flex gap-1.5 flex-wrap">
        {STAGE_FILTERS.map(f => (
          <button key={f.key} onClick={() => setStageF(f.key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              stageF === f.key
                ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30"
                : "bg-[#1C1E26] text-[#5D616C] hover:text-[#8B8F96] border border-[#23262E]"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Problem list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-8 text-center">
            <p className="text-[#5D616C] text-sm">No problems yet. Add your first one!</p>
          </div>
        )}
        {filtered.map(p => {
          const stage = getStage(p);
          const sm = STAGE_META[stage];
          const overdue = !p.frozen && p.nextReviewDate < td;
          const dueToday = !p.frozen && p.nextReviewDate === td;
          return (
            <div key={p.id} className="rounded-xl border border-[#23262E] bg-[#16181E] px-3 md:px-4 py-2.5 md:py-3 hover:border-[#2A2D35] transition-colors" style={p.frozen ? { opacity: 0.6 } : {}}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm text-[#F1F1F3] font-medium truncate">{p.title}</span>
                    <span className="text-xs" style={{ color: sm.color }}>{sm.emoji} {sm.label}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                    <Badge color="#3B82F6">{p.topic}</Badge>
                    {p.lastOutcome && <Badge color={OUTCOMES[p.lastOutcome].color}>{OUTCOMES[p.lastOutcome].short} Last: {OUTCOMES[p.lastOutcome].label}</Badge>}
                    {p.soloStreak > 0 && !p.frozen && <Badge color="#818CF8">🔥 {p.soloStreak}/3</Badge>}
                    {overdue && <Badge color="#EF4444">Overdue {Math.abs(daysDiff(p.nextReviewDate, td))}d</Badge>}
                    {dueToday && <Badge color="#F59E0B">Due Today</Badge>}
                    {!overdue && !dueToday && !p.frozen && <span className="text-xs text-[#5D616C]">in {daysDiff(p.nextReviewDate, td)}d</span>}
                    {p.frozen && <span className="text-xs text-[#818CF8]">review complete</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 md:gap-1 shrink-0">
                  {safeUrl(p.url) && <a href={safeUrl(p.url)} target="_blank" rel="noopener noreferrer" className="p-1 md:p-1.5 rounded text-[#5D616C] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"><ExternalLink size={12} /></a>}
                  {p.notes || p.keyInsight ? (
                    <button onClick={() => setExpandedNotes(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className={`p-1 md:p-1.5 rounded transition-colors ${expandedNotes[p.id] ? "text-[#3B82F6] bg-[#3B82F6]/10" : "text-[#5D616C] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10"}`}
                      title="Show notes">{expandedNotes[p.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</button>
                  ) : null}
                  {p.frozen
                    ? <button onClick={() => unfreezeProblem(p.id)} className="p-1 md:p-1.5 rounded text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/20 transition-colors" title="Unfreeze — add back to reviews"><RefreshCw size={12} /></button>
                    : <button onClick={() => navigate(`/edit/${p.id}`)} className="p-1 md:p-1.5 rounded text-[#5D616C] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"><Search size={12} /></button>}
                  <button onClick={() => handleDelete(p.id)} className="p-1 md:p-1.5 rounded text-[#5D616C] hover:text-red-400 hover:bg-red-900/20 transition-colors"><X size={12} /></button>
                </div>
              </div>
              {expandedNotes[p.id] && (
                <div className="mt-3 pt-3 border-t border-[#23262E] space-y-2">
                  {p.notes && <div>
                    <div className="text-xs text-[#5D616C] mb-1 font-medium uppercase tracking-wider">Notes</div>
                    <div className="text-sm text-[#8B8F96] whitespace-pre-wrap leading-relaxed">{p.notes}</div>
                  </div>}
                  {p.keyInsight && <div>
                    <div className="text-xs text-[#3B82F6] mb-1 font-medium uppercase tracking-wider">Key Insight</div>
                    <div className="text-sm text-[#3B82F6]/80 italic leading-relaxed">{p.keyInsight}</div>
                  </div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
