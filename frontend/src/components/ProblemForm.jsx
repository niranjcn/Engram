import { useState } from "react";
import { Plus, Clock } from "lucide-react";
import Btn from "./Btn";
import { OUTCOME_OPTIONS, TOPICS, DIFFICULTIES } from "../lib/constants";
import { getNextReviewPreview } from "../lib/utils";

export default function ProblemForm({ onSave, onCancel, initial }) {
  const blank = { title:"", url:"", topic:"Array", difficulty:"Medium", notes:"", keyInsight:"", outcome: "solved_solo" };
  const [form, setForm] = useState({ ...blank, ...(initial || {}), outcome: initial?.lastOutcome || "solved_solo" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const preview = getNextReviewPreview(form.outcome, initial);
  const outcomeInfo = OUTCOME_OPTIONS.find(o => o.value === form.outcome);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form, initial);
  };

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors";

  return (
    <div className="space-y-4">
      <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Problem Title *</label>
        <input className={inp} value={form.title} onChange={set("title")} placeholder="e.g. Two Sum" /></div>
      <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">URL (optional)</label>
        <input className={inp} value={form.url} onChange={set("url")} placeholder="https://leetcode.com/problems/..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Topic</label>
          <select className={inp} value={form.topic} onChange={set("topic")}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Difficulty</label>
          <select className={inp} value={form.difficulty} onChange={set("difficulty")}>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select></div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">How did you solve it?</label>
        <select className={inp} value={form.outcome} onChange={set("outcome")}>
          {OUTCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ background: outcomeInfo.color + "11", borderColor: outcomeInfo.color + "33" }}>
          <Clock size={13} style={{ color: outcomeInfo.color }} className="shrink-0" />
          <span className="text-xs font-mono" style={{ color: outcomeInfo.color }}>
            Next review in <strong>{preview.interval} day{preview.interval !== 1 ? "s" : ""}</strong> → {preview.date}
          </span>
        </div>
      </div>
      <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Notes</label>
        <textarea className={inp + " resize-none"} rows={3} value={form.notes} onChange={set("notes")} placeholder="Your approach, observations..." /></div>
      <div><label className="text-xs text-gray-400 mb-1 block font-mono uppercase tracking-wider">Key Insight</label>
        <textarea className={inp + " resize-none"} rows={2} value={form.keyInsight} onChange={set("keyInsight")} placeholder="The aha moment that unlocks this problem..." /></div>
      <div className="flex gap-2 pt-1">
        <Btn onClick={handleSave}><Plus size={14} />{initial ? "Update" : "Add Problem"}</Btn>
        <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
      </div>
    </div>
  );
}
