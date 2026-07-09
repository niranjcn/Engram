export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-indigo-900/30 bg-gray-900 ${className}`}>{children}</div>
  );
}
