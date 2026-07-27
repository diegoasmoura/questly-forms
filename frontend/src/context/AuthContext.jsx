import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    // Se temos um token mas NENHUM usuário em cache, precisamos bloquear a tela até buscar
    // Se já temos o usuário em cache, carregamos a interface instantaneamente (Optimistic UI)
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && !savedUser) return true;
    return false;
  });

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (data) => {
    const result = await api.register(data);
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) {
      api.me()
        .then((data) => {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
