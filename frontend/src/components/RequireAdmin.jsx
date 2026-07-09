import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RequireAdmin({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user || user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}
