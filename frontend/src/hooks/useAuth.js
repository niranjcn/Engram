import { useState, useEffect, useCallback } from "react";
import { auth } from "../api";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setUser(null); setAuthLoading(false); return; }
    try {
      const u = await auth.me();
      setUser(u);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = (userData) => setUser(userData);
  const logout = () => { localStorage.removeItem("token"); setUser(null); };

  return { user, authLoading, login, logout };
}
