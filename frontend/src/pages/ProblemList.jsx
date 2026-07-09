import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, ChevronDown, X, ExternalLink, RefreshCw } from "lucide-react";
import Card from "../components/Card";
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

  const handleDelete = (id) => {
    const confirmed = window.confirm("Delete this problem?");
    if (!confirmed) return;
    deleteProblem(id);
  };

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
                  {p.notes || p.keyInsight ? (
                    <button onClick={() => setExpandedNotes(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className={`p-1.5 rounded transition-colors ${expandedNotes[p.id] ? "text-indigo-400 bg-indigo-950/40" : "text-gray-500 hover:text-indigo-400 hover:bg-indigo-950/40"}`}
                      title="Show notes">{expandedNotes[p.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
                  ) : null}
                  {p.frozen
                    ? <button onClick={() => unfreezeProblem(p.id)} className="p-1.5 rounded text-indigo-400 hover:text-white hover:bg-indigo-800/40 transition-colors" title="Unfreeze — add back to reviews"><RefreshCw size={14} /></button>
                    : <button onClick={() => navigate(`/edit/${p.id}`)} className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-blue-950/40 transition-colors"><Search size={14} /></button>}
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"><X size={14} /></button>
                </div>
              </div>
              {expandedNotes[p.id] && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                  {p.notes && <div>
                    <div className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">Notes</div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{p.notes}</div>
                  </div>}
                  {p.keyInsight && <div>
                    <div className="text-xs text-indigo-400 mb-1 font-mono uppercase tracking-wider">Key Insight</div>
                    <div className="text-sm text-indigo-300 italic leading-relaxed">💡 {p.keyInsight}</div>
                  </div>}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
