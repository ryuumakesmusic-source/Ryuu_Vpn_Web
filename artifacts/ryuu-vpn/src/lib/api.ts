const API_BASE = "/api";

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("ryuu_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }

  return data;
}

export interface AuthUser {
  id: string;
  username: string;
  planId: string | null;
  createdAt: string;
}

export interface DashboardStats {
  username: string;
  planId: string | null;
  planName: string;
  status: string;
  expireAt: string | null;
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usedGb: number;
  remainingGb: number;
  limitGb: number;
}

export interface SubscriptionInfo {
  subscriptionUrl: string | null;
  shortUuid: string | null;
}

export const api = {
  register: (username: string, password: string, planId: string): Promise<{ token: string; user: AuthUser }> =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ username, password, planId }) }),

  login: (username: string, password: string): Promise<{ token: string; user: AuthUser }> =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  me: (): Promise<AuthUser> => apiFetch("/auth/me"),

  stats: (): Promise<DashboardStats> => apiFetch("/dashboard/stats"),

  subscription: (): Promise<SubscriptionInfo> => apiFetch("/dashboard/subscription"),
};
