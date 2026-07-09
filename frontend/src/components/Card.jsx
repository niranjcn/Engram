export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[#23262E] bg-[#16181E] ${className}`}>{children}</div>
  );
}
