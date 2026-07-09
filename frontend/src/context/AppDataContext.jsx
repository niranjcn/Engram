import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { problemsApi, reviewsApi } from "../api";
import { SAFE_URL_RE } from "../lib/constants";

const AppDataContext = createContext(null);
export const useAppData = () => useContext(AppDataContext);

export function AppDataProvider({ children, user }) {
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState({ streak: { current: 0, longest: 0 } });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [p, s, h] = await Promise.all([
        problemsApi.list(), reviewsApi.stats(), reviewsApi.history(),
      ]);
      setProblems(p); setStats(s); setHistory(h);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addProblem = async (form) => {
    if (form.url && !SAFE_URL_RE.test(form.url)) {
      throw new Error("URL must start with http:// or https://");
    }
    const created = await problemsApi.create(form);
    await problemsApi.review(created.id, form.outcome);
    await refresh();
  };

  const updateProblem = async (id, form) => {
    if (form.url && !SAFE_URL_RE.test(form.url)) {
      throw new Error("URL must start with http:// or https://");
    }
    await problemsApi.update(id, form);
    await refresh();
  };

  const deleteProblem = async (id) => {
    await problemsApi.delete(id);
    await refresh();
  };

  const unfreezeProblem = async (id) => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    await problemsApi.update(id, {
      frozen: false, soloStreak: 0, interval: 7, repetitions: 3,
      nextReviewDate: d.toISOString().split("T")[0],
    });
    await refresh();
  };

  const reviewProblem = async (id, outcome, callback) => {
    const updated = await problemsApi.review(id, outcome);
    if (callback) callback(updated);
    await refresh();
  };

  return (
    <AppDataContext.Provider value={{ problems, stats, history, loading, refresh, addProblem, updateProblem, deleteProblem, unfreezeProblem, reviewProblem }}>
      {children}
    </AppDataContext.Provider>
  );
}
