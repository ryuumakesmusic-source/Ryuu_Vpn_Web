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
  balanceKs: number;
  isAdmin: boolean;
  createdAt: string;
}

export interface DashboardStats {
  username: string;
  planId: string | null;
  planName: string | null;
  status: string;
  expireAt: string | null;
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usedGb: number;
  remainingGb: number;
  limitGb: number;
  balanceKs: number;
}

export interface SubscriptionInfo {
  subscriptionUrl: string | null;
  shortUuid: string | null;
}

export interface Plan {
  id: string;
  name: string;
  dataGb: number;
  validityDays: number;
  priceKs: number;
  trafficLimitBytes: number;
}

export interface TopupRequest {
  id: string;
  userId: string;
  amountKs: number;
  paymentMethod: string;
  screenshotUrl: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export interface AdminTopup extends TopupRequest {
  username: string | null;
  userBalance: number | null;
}

export interface AdminUser {
  id: string;
  username: string;
  balanceKs: number;
  planId: string | null;
  isAdmin: boolean;
  remnawaveUuid: string | null;
  createdAt: string;
}

export const api = {
  register: (username: string, password: string): Promise<{ token: string; user: AuthUser }> =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username: string, password: string): Promise<{ token: string; user: AuthUser }> =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  me: (): Promise<AuthUser> => apiFetch("/auth/me"),

  stats: (): Promise<DashboardStats> => apiFetch("/dashboard/stats"),

  subscription: (): Promise<SubscriptionInfo> => apiFetch("/dashboard/subscription"),

  plans: (): Promise<Plan[]> => apiFetch("/dashboard/plans"),

  buyPlan: (planId: string): Promise<{ success: boolean; newBalance: number; planId: string; planName: string }> =>
    apiFetch("/dashboard/buy-plan", { method: "POST", body: JSON.stringify({ planId }) }),

  submitTopup: (amountKs: number, paymentMethod: string, screenshotUrl: string): Promise<{ id: string; status: string }> =>
    apiFetch("/topup/request", { method: "POST", body: JSON.stringify({ amountKs, paymentMethod, screenshotUrl }) }),

  myTopups: (): Promise<TopupRequest[]> => apiFetch("/topup/my"),

  admin: {
    topups: (): Promise<AdminTopup[]> => apiFetch("/admin/topups"),
    approveTopup: (id: string, adminNote?: string) =>
      apiFetch(`/admin/topups/${id}/approve`, { method: "POST", body: JSON.stringify({ adminNote }) }),
    rejectTopup: (id: string, adminNote?: string) =>
      apiFetch(`/admin/topups/${id}/reject`, { method: "POST", body: JSON.stringify({ adminNote }) }),
    users: (): Promise<AdminUser[]> => apiFetch("/admin/users"),
    setBalance: (userId: string, balanceKs: number) =>
      apiFetch(`/admin/users/${userId}/set-balance`, { method: "POST", body: JSON.stringify({ balanceKs }) }),
    setAdmin: (userId: string, isAdmin: boolean) =>
      apiFetch(`/admin/users/${userId}/set-admin`, { method: "POST", body: JSON.stringify({ isAdmin }) }),
  },
};
