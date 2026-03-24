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

// Storage helper that uses Telegram CloudStorage if available, falls back to localStorage
const storage = {
  async getItem(key: string): Promise<string | null> {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.CloudStorage) {
      return new Promise((resolve) => {
        tg.CloudStorage.getItem(key, (_err: any, value: string | null) => {
          resolve(value || null);
        });
      });
    }
    return localStorage.getItem(key);
  },
  
  async setItem(key: string, value: string): Promise<void> {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.CloudStorage) {
      return new Promise((resolve) => {
        tg.CloudStorage.setItem(key, value, () => resolve());
      });
    }
    localStorage.setItem(key, value);
  },
  
  async removeItem(key: string): Promise<void> {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.CloudStorage) {
      return new Promise((resolve) => {
        tg.CloudStorage.removeItem(key, () => resolve());
      });
    }
    localStorage.removeItem(key);
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token from storage on mount
    storage.getItem("ryuu_token").then((savedToken) => {
      if (!savedToken) {
        setLoading(false);
        return;
      }
      setToken(savedToken);
      api.me()
        .then((u) => setUser(u))
        .catch(() => {
          storage.removeItem("ryuu_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    });
  }, []);

  const getTelegramId = (): string | undefined => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg) {
        console.log('[Auth] Telegram WebApp not available');
        return undefined;
      }
      
      // Wait for Telegram SDK to be ready
      if (tg.initDataUnsafe?.user?.id) {
        const id = String(tg.initDataUnsafe.user.id);
        console.log('[Auth] Telegram ID found:', id);
        return id;
      }
      
      console.log('[Auth] Telegram ID not found in initDataUnsafe');
      return undefined;
    } catch (err) {
      console.error('[Auth] Error getting Telegram ID:', err);
      return undefined;
    }
  };

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password, getTelegramId());
    await storage.setItem("ryuu_token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (username: string, password: string) => {
    const res = await api.register(username, password, getTelegramId());
    await storage.setItem("ryuu_token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const refreshUser = async () => {
    const u = await api.me();
    setUser(u);
  };

  const logout = async () => {
    await storage.removeItem("ryuu_token");
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
