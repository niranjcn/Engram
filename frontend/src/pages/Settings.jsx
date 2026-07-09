import { useState, useEffect, useCallback } from "react";
import useAuth from "../hooks/useAuth";
import { githubApi } from "../api";

const GITHUB_SCOPE = "repo,read:user";

export default function Settings() {
  const { user } = useAuth();
  const [clientId, setClientId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    githubApi.config().then((c) => setClientId(c.client_id)).catch(() => {});
  }, []);

  const exchangeCode = useCallback(async (code) => {
    try {
      await githubApi.connect(code);
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    function handler(e) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "github-oauth") {
        setConnecting(false);
        exchangeCode(e.data.code);
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [exchangeCode]);

  function handleConnect() {
    if (!clientId) return;
    setError(null);
    setSuccess(null);
    setConnecting(true);
    const redirectUri = window.location.origin + "/github-callback";
    const url = "https://github.com/login/oauth/authorize"
      + "?client_id=" + encodeURIComponent(clientId)
      + "&redirect_uri=" + encodeURIComponent(redirectUri)
      + "&scope=" + encodeURIComponent(GITHUB_SCOPE);
    window.open(url, "github-oauth", "width=600,height=700");
  }

  async function handleSetupRepo() {
    setError(null);
    setSuccess(null);
    setSettingUp(true);
    try {
      const res = await githubApi.setupRepo();
      setSuccess(`Repository created: ${res.repo}`);
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSettingUp(false);
    }
  }

  async function handleSync() {
    setError(null);
    setSuccess(null);
    setSyncing(true);
    try {
      await githubApi.sync();
      setSuccess("Problems synced to GitHub");
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setError(null);
    setSuccess(null);
    try {
      await githubApi.disconnect();
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-[#F1F1F3]">Settings</h1>

      <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-6">
        <h2 className="text-lg font-medium text-[#F1F1F3] mb-4">GitHub Integration</h2>
        <p className="text-sm text-[#5D616C] mb-4">
          Connect your GitHub account to automatically sync your problems to a private repository.
        </p>

        {user?.github_username ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#23262E] flex items-center justify-center text-[#5D616C]">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F1F3]">{user.github_username}</p>
                  <p className="text-xs text-[#5D616C]">Connected</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg transition"
              >
                Disconnect
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {!user.github_repo ? (
                <button
                  onClick={handleSetupRepo}
                  disabled={settingUp}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition disabled:opacity-50"
                >
                  {settingUp ? "Setting up..." : "Setup Repository"}
                </button>
              ) : (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#23262E] hover:bg-[#2A2D35] border border-[#2A2D35] rounded-lg transition disabled:opacity-50"
                >
                  {syncing ? "Syncing..." : "Force Sync"}
                </button>
              )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}
          </div>
        ) : (
          <div>
            <button
              onClick={handleConnect}
              disabled={!clientId || connecting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#23262E] hover:bg-[#2A2D35] border border-[#2A2D35] rounded-lg transition disabled:opacity-50"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
              {connecting ? "Connecting..." : "Connect GitHub"}
            </button>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
