import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Shield, ShieldOff, Trash2, ExternalLink, ChevronRight, ChevronDown } from "lucide-react";
import { adminApi } from "../../api";
import Heatmap from "../../components/Heatmap";

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  useEffect(() => {
    Promise.all([
      adminApi.user(id),
      adminApi.userActivity(id),
      adminApi.userProblems(id),
    ]).then(([u, a, p]) => {
      setUser(u);
      setActivity(a);
      setProblems(p);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleRole = async () => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await adminApi.updateRole(id, newRole);
      setUser(prev => ({ ...prev, role: newRole }));
    } catch {}
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteUser(id);
      window.location.href = "/admin/users";
    } catch {}
  };

  if (loading) return <LoadingSkeleton />;
  if (!user) return <p className="text-sm text-red-400">User not found</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm text-[#5D616C] hover:text-[#F1F1F3]">
        <ArrowLeft size={14} /> Back to users
      </Link>

      <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#F1F1F3]">{user.username}</h1>
            <p className="text-sm text-[#8B8F96]">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs px-2 py-0.5 rounded ${user.role === "admin" ? "bg-[#3B82F6]/15 text-[#3B82F6]" : "bg-[#23262E]/60 text-[#8B8F96]"}`}>
                {user.role}
              </span>
              <span className="text-xs text-[#5D616C]">Joined {user.created_at?.split("T")[0]}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRole} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#23262E]/60 text-[#8B8F96] rounded-lg hover:text-[#F1F1F3]">
              {user.role === "admin" ? <ShieldOff size={12} /> : <Shield size={12} />}
              {user.role === "admin" ? "Demote" : "Promote"}
            </button>
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Problems", value: user.problem_count },
          { label: "Current Streak", value: user.streak?.current ?? 0 },
          { label: "Longest Streak", value: user.streak?.longest ?? 0 },
          { label: "Mastered", value: user.mastered },
          { label: "Learning", value: user.learning },
          { label: "Reviewing", value: user.reviewing },
          { label: "Frozen", value: user.frozen },
        ].map(s => (
          <div key={s.label} className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-3">
            <p className="text-xs text-[#5D616C]">{s.label}</p>
            <p className="text-lg font-bold text-[#F1F1F3]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-5">
        <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-5">Activity — Last 12 Months</h3>
        <Heatmap data={activity} />
      </div>

      <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#F1F1F3] mb-3">Problems ({problems.length})</h2>
        {problems.length === 0 ? (
          <p className="text-sm text-[#5D616C]">No problems</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {problems.map(p => (
              <div key={p.id} className="rounded-lg border border-[#23262E] px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F1F1F3] font-medium truncate">{p.title}</p>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        p.difficulty === "Easy" ? "bg-green-900/20 text-green-400" :
                        p.difficulty === "Medium" ? "bg-yellow-900/20 text-yellow-400" :
                        "bg-red-900/20 text-red-400"
                      }`}>{p.difficulty}</span>
                      <span className="text-[10px] bg-[#1C1E26] text-[#8B8F96] px-1.5 py-0.5 rounded">{p.topic}</span>
                      {p.last_outcome && (
                        <span className="text-[10px] bg-[#23262E]/60 text-[#8B8F96] px-1.5 py-0.5 rounded">
                          {p.last_outcome === "solved_solo" ? "Solved Solo" : p.last_outcome === "used_hint" ? "Hint" : "Checked"}
                        </span>
                      )}
                      {p.frozen && <span className="text-[10px] bg-[#3B82F6]/15 text-[#3B82F6] px-1.5 py-0.5 rounded">Frozen</span>}
                      {!p.frozen && p.solo_streak > 0 && (
                        <span className="text-[10px] bg-[#818CF8]/15 text-[#818CF8] px-1.5 py-0.5 rounded">🔥 {p.solo_streak}/3</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-[#5D616C] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors">
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {(p.notes || p.key_insight) && (
                      <button onClick={() => setExpandedNotes(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                        className={`p-1 rounded transition-colors ${expandedNotes[p.id] ? "text-[#3B82F6] bg-[#3B82F6]/10" : "text-[#5D616C] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10"}`}>
                        {expandedNotes[p.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.repetitions >= 3 ? "text-green-400 bg-green-900/20" : "text-[#5D616C]"}`}>
                      R{p.repetitions}
                    </span>
                  </div>
                </div>
                {expandedNotes[p.id] && (p.notes || p.key_insight) && (
                  <div className="mt-2 pt-2 border-t border-[#23262E] space-y-1.5">
                    {p.notes && <div>
                      <div className="text-[10px] text-[#5D616C] font-medium uppercase tracking-wider mb-0.5">Notes</div>
                      <div className="text-xs text-[#8B8F96] whitespace-pre-wrap leading-relaxed">{p.notes}</div>
                    </div>}
                    {p.key_insight && <div>
                      <div className="text-[10px] text-[#3B82F6] font-medium uppercase tracking-wider mb-0.5">Key Insight</div>
                      <div className="text-xs text-[#3B82F6]/80 italic leading-relaxed">{p.key_insight}</div>
                    </div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-medium text-[#F1F1F3] mb-2">Delete {user.username}?</h3>
            <p className="text-xs text-[#8B8F96] mb-4">All their problems and review data will be permanently deleted.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs text-[#8B8F96] hover:text-[#F1F1F3]">Cancel</button>
              <button onClick={handleDelete} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-24 bg-[#16181E] rounded" />
      <div className="h-24 bg-[#16181E] rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#16181E] rounded-lg" />)}
      </div>
    </div>
  );
}
