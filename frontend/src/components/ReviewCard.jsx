import { useState } from "react";
import { ExternalLink } from "lucide-react";
import Card from "./Card";
import Badge from "./Badge";
import { OUTCOMES, DIFF_COLOR, STAGE_META, safeUrl } from "../lib/constants";
import { getStage } from "../lib/utils";

export default function ReviewCard({ problem, onReview }) {
  const [done, setDone] = useState(false);
  const [justFrozen, setJustFrozen] = useState(false);
  const stage = getStage(problem);
  const stageMeta = STAGE_META[stage];

  if (done && !justFrozen) return null;
  if (justFrozen) return (
    <Card className="p-4 border-indigo-800/30">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="text-3xl">❄️</span>
        <p className="text-indigo-200 font-mono font-semibold text-sm">{problem.title} is now Frozen!</p>
        <p className="text-xs text-gray-400">You solved it solo 3 times with interval &gt;21 days.<br/>It won't appear in reviews anymore. You've mastered it.</p>
      </div>
    </Card>
  );

  return (
    <Card className="p-4 border-indigo-800/30">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-mono font-semibold text-sm">{problem.title}</span>
            <span className="text-xs" style={{ color: stageMeta.color }}>{stageMeta.emoji} {stageMeta.label}</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Badge color={DIFF_COLOR[problem.difficulty]}>{problem.difficulty}</Badge>
            <Badge color="#6366F1">{problem.topic}</Badge>
            {problem.lastOutcome && <Badge color={OUTCOMES[problem.lastOutcome].color}>{OUTCOMES[problem.lastOutcome].short} Last: {OUTCOMES[problem.lastOutcome].label}</Badge>}
            {problem.soloStreak > 0 && <Badge color="#818CF8">🔥 {problem.soloStreak}/3 solo streak</Badge>}
          </div>
        </div>
        {safeUrl(problem.url) && <a href={safeUrl(problem.url)} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-400 shrink-0"><ExternalLink size={15} /></a>}
      </div>
      <div className="text-xs text-gray-500 mb-3">How did you do this time?</div>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(OUTCOMES).map(([k, v]) => (
          <button key={k} onClick={() => onReview(problem.id, k, (updated) => {
            if (updated.frozen) setJustFrozen(true); else setDone(true);
          })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer"
            style={{ borderColor: v.color + "44", color: v.color, background: v.color + "11" }}>
            <v.icon size={13} />{v.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
