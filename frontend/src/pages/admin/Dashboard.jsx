import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, FileText, Activity, TrendingUp, Zap } from "lucide-react";
import { adminApi } from "../../api";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <p className="text-red-400 text-sm">Failed to load dashboard</p>;

  const cards = [
    { label: "Total Users", value: data.total_users, icon: Users },
    { label: "Total Problems", value: data.total_problems, icon: FileText },
    { label: "Total Reviews", value: data.total_reviews, icon: Activity },
    { label: "Avg Streak", value: data.avg_streak, icon: TrendingUp },
    { label: "Top Streak", value: data.top_streak, icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-[#F1F1F3]">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon size={14} className="text-[#5D616C]" />
              <span className="text-xs text-[#5D616C]">{c.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F1F3]">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-4">
          <h2 className="text-sm font-medium text-[#F1F1F3] mb-3">Problems by Difficulty</h2>
          {data.by_difficulty && Object.keys(data.by_difficulty).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.by_difficulty).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[#8B8F96] capitalize">{k}</span>
                  <span className="text-[#F1F1F3] font-medium">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5D616C]">No data</p>
          )}
        </div>

        <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-4">
          <h2 className="text-sm font-medium text-[#F1F1F3] mb-3">Top Topics</h2>
          {data.by_topic && Object.keys(data.by_topic).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.by_topic).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[#8B8F96] truncate">{k}</span>
                  <span className="text-[#F1F1F3] font-medium ml-2">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5D616C]">No data</p>
          )}
        </div>

        <div className="bg-[#16181E] border border-[#23262E]/60 rounded-lg p-4">
          <h2 className="text-sm font-medium text-[#F1F1F3] mb-3">Registrations by Month</h2>
          {data.registrations && data.registrations.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {data.registrations.map(r => (
                <div key={r.month} className="flex items-center justify-between text-sm">
                  <span className="text-[#8B8F96]">{r.month}</span>
                  <span className="text-[#F1F1F3] font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5D616C]">No data</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/admin/users" className="text-sm text-[#3B82F6] hover:underline">Manage Users →</Link>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-[#16181E] rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-[#16181E] rounded-lg" />)}
      </div>
    </div>
  );
}
