import { Flame, Clock, Trophy, BookOpen, ChevronRight, RefreshCw } from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import ReviewCard from "../components/ReviewCard";
import { DIFF_COLOR, STAGE_META } from "../lib/constants";
import { getStage, today, daysDiff } from "../lib/utils";
import { useAppData } from "../context/AppDataContext";

export default function Dashboard() {
  const { problems, stats, reviewProblem, refresh } = useAppData();
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
        <button onClick={refresh} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"><RefreshCw size={15} /></button>
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
          : <div className="space-y-3">{due.map(p => <ReviewCard key={p.id} problem={p} onReview={reviewProblem} />)}</div>}
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
