import { Lightbulb, Eye } from "lucide-react";
import { CheckCircleIcon } from "../components/CheckCircleIcon";

export const SAFE_URL_RE = /^https?:\/\//i;

export const safeUrl = (url) => (url && SAFE_URL_RE.test(url) ? url : null);

export const TOPICS = ["Array","String","Sliding Window","Two Pointers","Prefix Sum","HashMap","Stack","Queue","Binary Search","Linked List","Tree","BST","BFS","DFS","Heap","Backtracking","Graph","Union Find","Topological Sort","Dynamic Programming","Greedy","Math","Bit Manipulation","Trie","Segment Tree"];

export const DIFFICULTIES = ["Easy","Medium","Hard"];

export const OUTCOMES = {
  solved_solo: { label: "Solved Solo", icon: CheckCircleIcon, color: "#10B981", short: "✅" },
  used_hint:   { label: "Used Hint",   icon: Lightbulb,       color: "#F59E0B", short: "💡" },
  checked_code:{ label: "Checked Code",icon: Eye,             color: "#EF4444", short: "👀" },
};

export const DIFF_COLOR = { Easy: "#10B981", Medium: "#F59E0B", Hard: "#EF4444" };

export const STAGE_META = {
  learning:  { label: "Learning",  color: "#EF4444", emoji: "🔴" },
  reviewing: { label: "Reviewing", color: "#F59E0B", emoji: "🟡" },
  mastered:  { label: "Mastered",  color: "#10B981", emoji: "🏆" },
  frozen:    { label: "Frozen",    color: "#818CF8", emoji: "❄️"  },
};

export const OUTCOME_OPTIONS = [
  { value: "solved_solo",   label: "✅ Solved Solo — figured it out completely",  color: "#10B981" },
  { value: "used_hint",     label: "💡 Used Hint — needed a nudge",               color: "#F59E0B" },
  { value: "checked_code",  label: "👀 Checked Code — had to look at solution",   color: "#EF4444" },
];

export const FIRST_ATTEMPT_INTERVAL = { solved_solo: 3, used_hint: 1, checked_code: 1 };
