import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false, superAdmin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (superAdmin && user.role !== "super_admin") return <p>Access denied.</p>;
  if (adminOnly && !["admin", "super_admin"].includes(user.role))
    return <p>Access denied — admin only.</p>;
  return children;
}
export default ProtectedRoute;
