import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute check — user:", user, "loading:", loading);

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <p>Access denied — admin only.</p>;
  }

  return children;
}

export default ProtectedRoute;
