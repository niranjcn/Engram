import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function GithubCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    if (code && window.opener) {
      window.opener.postMessage({ type: "github-oauth", code }, window.location.origin);
      window.close();
    }
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0D12" }}>
      <p className="text-sm text-[#5D616C]">Completing GitHub connection...</p>
    </div>
  );
}
