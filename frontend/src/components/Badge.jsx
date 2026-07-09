export default function Badge({ children, color }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44` }}
      className="px-2 py-0.5 rounded text-xs font-mono font-semibold">{children}</span>
  );
}
