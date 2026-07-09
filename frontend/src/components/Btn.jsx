export default function Btn({ children, onClick, variant = "primary", className = "", disabled }) {
  const styles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    ghost:   "bg-gray-800 hover:bg-gray-700 text-gray-300",
    danger:  "bg-red-900/40 hover:bg-red-800/60 text-red-400",
    success: "bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400",
    amber:   "bg-amber-900/40 hover:bg-amber-800/60 text-amber-400",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${styles[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      {children}
    </button>
  );
}
