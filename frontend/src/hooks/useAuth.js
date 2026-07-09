import { useState, useEffect, useCallback } from "react";
import { auth } from "../api";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const u = await auth.me();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    try { await auth.logout(); } catch {}
    setUser(null);
  };

  return { user, authLoading, login, logout };
}
