import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Users as UsersIcon, BookOpen, Flame } from "lucide-react";
import { profilesApi } from "../api";

export default function UserDirectory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    profilesApi.list(query)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-[#F1F1F3]">Community</h1>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D616C]" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#16181E] border border-[#23262E] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F1F1F3] placeholder-[#5D616C] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-sm text-[#5D616C] font-mono">Loading...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-10 text-center">
          <UsersIcon size={36} className="mx-auto text-[#5D616C] mb-3" />
          <p className="text-sm text-[#5D616C]">{query ? "No users match your search" : "No community members found"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map(u => (
            <Link
              key={u.id}
              to={`/u/${u.username}`}
              className="rounded-xl border border-[#23262E] bg-[#16181E] p-4 hover:border-[#3B82F6]/30 hover:bg-[#1C1E26] transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold text-[#3B82F6]">{u.username[0].toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#F1F1F3] truncate group-hover:text-[#3B82F6] transition-colors">{u.username}</p>
                  <p className="text-[10px] text-[#5D616C]">{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[#5D616C]">
                  <BookOpen size={13} />
                  {u.total_solved} solved
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
