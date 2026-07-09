export default function Btn({ children, onClick, variant = "primary", className = "", disabled }) {
  const styles = {
    primary: "bg-[#3B82F6] hover:bg-[#2563EB] text-white",
    ghost:   "bg-[#1C1E26] hover:bg-[#252830] text-[#8B8F96]",
    danger:  "bg-red-900/30 hover:bg-red-800/50 text-red-400",
    success: "bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400",
    amber:   "bg-amber-900/30 hover:bg-amber-800/50 text-amber-400",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${styles[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      {children}
    </button>
  );
}
