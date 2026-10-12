import { createContext, useState, useContext, useEffect } from "react";
import api from "../api/api";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.cooperative_name) {
        document.title = `${parsed.cooperative_name} — Cooperative Portal`;
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    if (userData.cooperative_name) {
      document.title = `${userData.cooperative_name} — Cooperative Portal`;
    }
  };

  const logout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
