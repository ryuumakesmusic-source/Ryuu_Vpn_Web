// ─────────────────────────────────────────────────────────────────
//  artifacts/ryuu-vpn/src/context/AuthContext.tsx  (FIXED)
//
//  Changes vs original:
//  1. Calls setApiToken() from api.ts on every token change so
//     apiFetch and submitTopup always use the current token without
//     touching localStorage directly.
// ─────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api, setApiToken, type AuthUser } from "@/lib/api";

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

/**
 * Dual-storage helper: persists to localStorage (all envs) and
 * Telegram CloudStorage (Telegram Mini App only).
 */
const storage = {
  async getItem(key: string): Promise<string | null> {
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.CloudStorage) {
      return new Promise((resolve) => {
        tg.CloudStorage.getItem(key, (_err: any, value: string | null) => {
          if (value) {
            // Sync back to localStorage for faster access next time
            localStorage.setItem(key, value);
          }
          resolve(value || null);
        });
      });
    }

    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.CloudStorage) {
      return new Promise((resolve) => {
        tg.CloudStorage.setItem(key, value, () => resolve());
      });
    }
  },

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.CloudStorage) {
      return new Promise((resolve) => {
        tg.CloudStorage.removeItem(key, () => resolve());
      });
    }
  },
};

function getTelegramId(): string | undefined {
  try {
    const tg = (window as any).Telegram?.WebApp;
    const id = tg?.initDataUnsafe?.user?.id;
    return id ? String(id) : undefined;
  } catch {
    return undefined;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep the api module's in-memory token in sync so apiFetch
  // never has to read localStorage directly.
  const persistToken = (t: string | null) => {
    setToken(t);
    setApiToken(t);
  };

  useEffect(() => {
    storage.getItem("ryuu_token").then((savedToken) => {
      if (!savedToken) {
        setLoading(false);
        return;
      }
      persistToken(savedToken);
      api
        .me()
        .then((u) => setUser(u))
        .catch(() => {
          storage.removeItem("ryuu_token");
          persistToken(null);
        })
        .finally(() => setLoading(false));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password, getTelegramId());
    await storage.setItem("ryuu_token", res.token);
    persistToken(res.token);
    setUser(res.user);
  };

  const register = async (username: string, password: string) => {
    const res = await api.register(username, password, getTelegramId());
    await storage.setItem("ryuu_token", res.token);
    persistToken(res.token);
    setUser(res.user);
  };

  const refreshUser = async () => {
    const u = await api.me();
    setUser(u);
  };

  const logout = async () => {
    await storage.removeItem("ryuu_token");
    persistToken(null);
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
