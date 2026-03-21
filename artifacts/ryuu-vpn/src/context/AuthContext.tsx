import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api, type AuthUser } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("ryuu_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("ryuu_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    localStorage.setItem("ryuu_token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (username: string, password: string) => {
    const res = await api.register(username, password);
    localStorage.setItem("ryuu_token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const refreshUser = async () => {
    const u = await api.me();
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("ryuu_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
