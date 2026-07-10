import { useState } from "react";
import { Plus, Clock } from "lucide-react";
import Btn from "./Btn";
import { OUTCOME_OPTIONS, TOPICS, DIFFICULTIES } from "../lib/constants";
import { getNextReviewPreview } from "../lib/utils";

export default function ProblemForm({ onSave, onCancel, initial }) {
  const isEditing = !!initial;
  const blank = { title:"", url:"", topic:"Array", difficulty:"Medium", notes:"", keyInsight:"", outcome: "solved_solo" };
  const [form, setForm] = useState({ ...blank, ...(initial || {}), outcome: initial?.lastOutcome || "solved_solo" });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const preview = getNextReviewPreview(form.outcome, initial);
  const outcomeInfo = OUTCOME_OPTIONS.find(o => o.value === form.outcome);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try { await onSave(form, initial) } finally { setSaving(false) }
  };

  const inp = "w-full bg-[#1C1E26] border border-[#23262E] rounded-lg px-3 py-2.5 text-sm text-[#F1F1F3] focus:outline-none focus:border-[#3B82F6] transition-colors placeholder-[#5D616C]";

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-[#5D616C] mb-1.5 block font-medium uppercase tracking-wider">Problem Title *</label>
        <input className={inp} value={form.title} onChange={set("title")} placeholder="e.g. Two Sum" />
      </div>
      <div>
        <label className="text-xs text-[#5D616C] mb-1.5 block font-medium uppercase tracking-wider">URL (optional)</label>
        <input className={inp} value={form.url} onChange={set("url")} placeholder="https://leetcode.com/problems/..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#5D616C] mb-1.5 block font-medium uppercase tracking-wider">Topic</label>
          <select className={inp} value={form.topic} onChange={set("topic")}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select>
        </div>
        <div>
          <label className="text-xs text-[#5D616C] mb-1.5 block font-medium uppercase tracking-wider">Difficulty</label>
          <select className={inp} value={form.difficulty} onChange={set("difficulty")}>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select>
        </div>
      </div>
      {!isEditing && <div>
        <label className="text-xs text-[#5D616C] mb-1.5 block font-medium uppercase tracking-wider">How did you solve it?</label>
        <select className={inp} value={form.outcome} onChange={set("outcome")}>
          {OUTCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ background: outcomeInfo.color + "11", borderColor: outcomeInfo.color + "33" }}>
          <Clock size={13} style={{ color: outcomeInfo.color }} className="shrink-0" />
          <span className="text-xs" style={{ color: outcomeInfo.color }}>
            Next review in <strong>{preview.interval} day{preview.interval !== 1 ? "s" : ""}</strong> &rarr; {preview.date}
          </span>
        </div>
      </div>}
      <div>
        <label className="text-xs text-[#5D616C] mb-1.5 block font-medium uppercase tracking-wider">Notes</label>
        <textarea className={inp + " resize-none"} rows={3} value={form.notes} onChange={set("notes")} placeholder="Your approach, observations..." />
      </div>
      <div>
        <label className="text-xs text-[#5D616C] mb-1.5 block font-medium uppercase tracking-wider">Key Insight</label>
        <textarea className={inp + " resize-none"} rows={2} value={form.keyInsight} onChange={set("keyInsight")} placeholder="The aha moment that unlocks this problem..." />
      </div>
      <div className="flex gap-2 pt-1">
        <Btn onClick={handleSave} disabled={saving}>{saving ? <span className="spinner-sm" /> : <Plus size={14} />}{initial ? "Update" : "Add Problem"}</Btn>
        <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
      </div>
    </div>
  );
}
