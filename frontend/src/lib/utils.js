import { FIRST_ATTEMPT_INTERVAL } from "./constants";

export const today = () => new Date().toISOString().split("T")[0];

export const daysDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);

export function qualityFromOutcome(outcome) {
  return outcome === "solved_solo" ? 5 : outcome === "used_hint" ? 3 : 1;
}

export function getStage(problem) {
  if (problem.frozen) return "frozen";
  if (problem.interval > 21) return "mastered";
  if ((problem.repetitions || 0) >= 3) return "reviewing";
  return "learning";
}

export function sm2(problem, outcome) {
  const q = qualityFromOutcome(outcome);
  let { interval = 1, easeFactor = 2.5, repetitions = 0, soloStreak = 0 } = problem;
  if (q < 3) { interval = 1; repetitions = 0; soloStreak = 0; }
  else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }
  soloStreak = outcome === "solved_solo" ? soloStreak + 1 : 0;
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (problem.repetitions === 0) {
    interval = outcome === "solved_solo" ? 3 : 1;
  }
  const frozen = interval > 21 && soloStreak >= 3;
  const next = new Date();
  next.setDate(next.getDate() + interval);
  return {
    interval, easeFactor, repetitions, soloStreak, frozen,
    nextReviewDate: next.toISOString().split("T")[0],
    lastOutcome: outcome,
  };
}

export function getNextReviewPreview(outcome, existing) {
  let interval;
  if (existing && existing.repetitions > 0) interval = sm2(existing, outcome).interval;
  else interval = FIRST_ATTEMPT_INTERVAL[outcome];
  const d = new Date(); d.setDate(d.getDate() + interval);
  return { interval, date: d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" }) };
}
