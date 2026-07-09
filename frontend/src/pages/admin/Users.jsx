import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Shield, ShieldOff, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { adminApi } from "../../api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "created_at", dir: -1 });
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    adminApi.users().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRole = async (id, role) => {
    try {
      await adminApi.updateRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {}
    setConfirm(null);
  };

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { ...s, dir: s.dir === 1 ? -1 : 1 } : { key, dir: -1 });
  };

  const filtered = users
    .filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = sort.key === "streak" ? (a.streak?.current ?? 0) : (a[sort.key] ?? "");
      const bVal = sort.key === "streak" ? (b.streak?.current ?? 0) : (b[sort.key] ?? "");
      return sort.dir * (typeof aVal === "string" ? aVal.localeCompare(bVal) : aVal - bVal);
    });

  const SortHeader = ({ label, sortKey }) => (
    <button onClick={() => toggleSort(sortKey)} className="flex items-center gap-1 text-xs text-[#5D616C] font-medium hover:text-[#8B8F96]">
      {label}
      {sort.key === sortKey && (sort.dir === 1 ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
    </button>
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-[#F1F1F3]">Users</h1>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D616C]" />
        <input
          type="text" placeholder="Search by username or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#16181E] border border-[#23262E]/60 rounded-lg pl-9 pr-3 py-2 text-sm text-[#F1F1F3] placeholder-[#5D616C] outline-none focus:border-[#3B82F6]/50"
        />
      </div>

      <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-8 gap-2 px-4 py-2.5 border-b border-[#23262E]/60">
          <SortHeader label="Username" sortKey="username" />
          <SortHeader label="Email" sortKey="email" />
          <SortHeader label="Problems" sortKey="problem_count" />
          <SortHeader label="Streak" sortKey="streak" />
          <SortHeader label="Mastered" sortKey="mastered" />
          <SortHeader label="Role" sortKey="role" />
          <SortHeader label="Joined" sortKey="created_at" />
          <span className="text-xs text-[#5D616C]">Actions</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-[#5D616C] p-4">No users found</p>
        ) : (
          filtered.map(u => (
            <div key={u.id} className="grid grid-cols-1 md:grid-cols-8 gap-2 px-4 py-3 border-b border-[#23262E]/60 last:border-0 items-center">
              <div>
                <Link to={`/admin/users/${u.id}`} className="text-sm text-[#F1F1F3] hover:text-[#3B82F6] font-medium">{u.username}</Link>
              </div>
              <div className="text-sm text-[#8B8F96] truncate hidden md:block">{u.email}</div>
              <div className="text-sm text-[#8B8F96]">{u.problem_count}</div>
              <div className="text-sm text-[#8B8F96]">{u.streak?.current ?? 0}</div>
              <div className="text-sm text-[#8B8F96]">{u.mastered}</div>
              <div>
                <span className={`text-xs px-2 py-0.5 rounded ${u.role === "admin" ? "bg-[#3B82F6]/15 text-[#3B82F6]" : "bg-[#23262E]/60 text-[#8B8F96]"}`}>
                  {u.role}
                </span>
              </div>
              <div className="text-sm text-[#5D616C] hidden md:block">{u.created_at?.split("T")[0]}</div>
              <div className="flex items-center gap-2">
                {u.role === "admin" ? (
                  <button onClick={() => handleRole(u.id, "user")} title="Demote to user" className="p-1 rounded hover:bg-[#23262E]/60 text-[#5D616C] hover:text-yellow-400">
                    <ShieldOff size={14} />
                  </button>
                ) : (
                  <button onClick={() => handleRole(u.id, "admin")} title="Promote to admin" className="p-1 rounded hover:bg-[#23262E]/60 text-[#5D616C] hover:text-[#3B82F6]">
                    <Shield size={14} />
                  </button>
                )}
                <button onClick={() => setConfirm(u)} title="Delete user" className="p-1 rounded hover:bg-[#23262E]/60 text-[#5D616C] hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-medium text-[#F1F1F3] mb-2">Delete {confirm.username}?</h3>
            <p className="text-xs text-[#8B8F96] mb-4">All their problems and review data will be permanently deleted.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="px-3 py-1.5 text-xs text-[#8B8F96] hover:text-[#F1F1F3]">Cancel</button>
              <button onClick={() => handleDelete(confirm.id)} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-24 bg-[#16181E] rounded" />
      <div className="h-10 bg-[#16181E] rounded-lg" />
      {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-[#16181E] rounded-lg" />)}
    </div>
  );
}
