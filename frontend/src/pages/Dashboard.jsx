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

  return (
    <div className="space-y-5 md:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-[#F1F1F3]">Dashboard</h1>
          <p className="text-xs md:text-sm text-[#5D616C] mt-0.5">{new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}</p>
        </div>
        <button onClick={refresh} className="p-1.5 md:p-2 rounded-lg bg-[#16181E] border border-[#23262E] text-[#5D616C] hover:text-[#F1F1F3] hover:bg-[#1C1E26] transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox icon={Flame} label="Day Streak" value={stats.streak?.current || 0} color="#F59E0B" />
        <StatBox icon={Clock} label="Due Today" value={due.length} color="#EF4444" />
        <StatBox icon={Trophy} label="Mastered" value={mastered.length} color="#22C55E" />
        <StatBox icon={BookOpen} label="Frozen" value={frozen.length} color="#818CF8" />
      </div>

      {/* Stage breakdown */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(STAGE_META).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs" style={{ color: v.color }}>
            <span>{v.emoji}</span><span>{v.label}</span>
            <span className="text-[#5D616C]">({problems.filter(p => getStage(p) === k).length})</span>
          </div>
        ))}
      </div>

      {/* Due Today */}
      <div>
        <h2 className="text-xs font-semibold text-[#EF4444] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock size={13} /> Due Today ({due.length})
        </h2>
        {due.length === 0
          ? <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-6 md:p-8 text-center">
              <p className="text-[#5D616C] text-sm">Nothing due today. Add a problem or come back tomorrow!</p>
            </div>
          : <div className="space-y-2 md:space-y-3">{due.map(p => <ReviewCard key={p.id} problem={p} onReview={reviewProblem} />)}</div>}
      </div>

      {/* This Week */}
      {upcoming.length > 0 && <div>
        <h2 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
          <ChevronRight size={13} /> This Week ({upcoming.length})
        </h2>
        <div className="space-y-1.5 md:space-y-2">
          {upcoming.map(p => {
            const d = daysDiff(p.nextReviewDate, td);
            const stage = getStage(p);
            const sm = STAGE_META[stage];
            return (
              <div key={p.id} className="rounded-xl border border-[#23262E] bg-[#16181E] px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 flex-wrap justify-between hover:border-[#2A2D35] transition-colors">
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                  <span className="text-xs" style={{ color: sm.color }}>{sm.emoji}</span>
                  <span className="text-sm text-[#F1F1F3] truncate">{p.title}</span>
                  <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                  {d <= 3 && <Badge color="#F59E0B">Soon</Badge>}
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                  <span className="text-xs text-[#5D616C]">{d}d</span>
                  <span className="text-xs text-[#5D616C]">{p.nextReviewDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* Mastered */}
      {mastered.length > 0 && <div>
        <h2 className="text-xs font-semibold text-[#22C55E] uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
          Trophy Mastered — Next Freeze Candidates ({mastered.length})
        </h2>
        <div className="space-y-1.5 md:space-y-2">
          {mastered.map(p => (
            <div key={p.id} className="rounded-xl border border-[#23262E] bg-[#16181E] px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 flex-wrap justify-between hover:border-[#2A2D35] transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-[#F1F1F3]">{p.title}</span>
                <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                <Badge color="#3B82F6">{p.topic}</Badge>
                <Badge color="#22C55E">interval {p.interval}d</Badge>
                {p.soloStreak > 0 && <Badge color="#818CF8">🔥 {p.soloStreak}/3 solo streak</Badge>}
              </div>
              <span className="text-xs text-[#5D616C]">next review: {p.nextReviewDate}</span>
            </div>
          ))}
        </div>
      </div>}

      {/* Frozen */}
      {frozen.length > 0 && <div>
        <h2 className="text-xs font-semibold text-[#818CF8] uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
          Snowflake Frozen — Fully Mastered ({frozen.length})
        </h2>
        <div className="space-y-1.5 md:space-y-2">
          {frozen.map(p => (
            <div key={p.id} className="rounded-xl border border-[#23262E] bg-[#16181E] px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 flex-wrap justify-between hover:border-[#2A2D35] transition-colors" style={{ opacity: 0.7 }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-[#F1F1F3]">{p.title}</span>
                <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                <Badge color="#3B82F6">{p.topic}</Badge>
              </div>
              <span className="text-xs text-[#818CF8]">Frozen</span>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}
