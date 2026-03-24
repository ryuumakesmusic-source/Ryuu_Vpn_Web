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

export interface PurchaseStatus {
  purchasesThisMonth: number;
  monthlyLimit: number;
  remainingPurchases: number;
  currentPlanId: string | null;
  canBuyStarter: boolean;
}

export interface TopupRequest {
  id: string;
  userId: string;
  amountKs: number;
  paymentMethod: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export interface AdminTopup {
  id: string;
  amountKs: number;
  paymentMethod: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  userId: string;
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
  register: (username: string, password: string, telegramId?: string): Promise<{ token: string; user: AuthUser }> =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ username, password, ...(telegramId ? { telegramId } : {}) }) }),

  login: (username: string, password: string, telegramId?: string): Promise<{ token: string; user: AuthUser }> =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password, ...(telegramId ? { telegramId } : {}) }) }),

  me: (): Promise<AuthUser> => apiFetch("/auth/me"),

  stats: (): Promise<DashboardStats> => apiFetch("/dashboard/stats"),

  subscription: (): Promise<SubscriptionInfo> => apiFetch("/dashboard/subscription"),

  plans: (): Promise<Plan[]> => apiFetch("/dashboard/plans"),

  purchaseStatus: (): Promise<PurchaseStatus> => apiFetch("/dashboard/purchase-status"),

  buyPlan: (planId: string): Promise<{ success: boolean; newBalance: number; planId: string; planName: string; purchasesThisMonth: number; remainingPurchases: number }> =>
    apiFetch("/dashboard/buy-plan", { method: "POST", body: JSON.stringify({ planId }) }),

  giftPlan: (recipientUsername: string, planId: string): Promise<{ success: boolean; newBalance: number; recipientUsername: string; planId: string; planName: string }> =>
    apiFetch("/dashboard/gift-plan", { method: "POST", body: JSON.stringify({ recipientUsername, planId }) }),

  submitTopup: (amountKs: number, paymentMethod: string, screenshot: File): Promise<{ id: string; status: string }> => {
    const token = localStorage.getItem("ryuu_token");
    const form = new FormData();
    form.append("amountKs", String(amountKs));
    form.append("paymentMethod", paymentMethod);
    form.append("screenshot", screenshot);
    return fetch("/api/topup/request", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
      return data;
    });
  },

  myTopups: (): Promise<TopupRequest[]> => apiFetch("/topup/my"),

  admin: {
    topups: async (): Promise<AdminTopup[]> => {
      const response = await apiFetch("/admin/topups");
      return response.data || response;
    },
    topupScreenshot: (id: string): Promise<{ screenshotUrl: string }> =>
      apiFetch(`/admin/topups/${id}/screenshot`),
    approveTopup: (id: string, adminNote?: string) =>
      apiFetch(`/admin/topups/${id}/approve`, { method: "POST", body: JSON.stringify({ adminNote }) }),
    rejectTopup: (id: string, adminNote?: string) =>
      apiFetch(`/admin/topups/${id}/reject`, { method: "POST", body: JSON.stringify({ adminNote }) }),
    users: async (): Promise<AdminUser[]> => {
      const response = await apiFetch("/admin/users");
      return response.data || response;
    },
    setBalance: (userId: string, balanceKs: number) =>
      apiFetch(`/admin/users/${userId}/set-balance`, { method: "POST", body: JSON.stringify({ balanceKs }) }),
    setAdmin: (userId: string, isAdmin: boolean) =>
      apiFetch(`/admin/users/${userId}/set-admin`, { method: "POST", body: JSON.stringify({ isAdmin }) }),
    adjustBalance: (userId: string, delta: number): Promise<{ success: boolean; balanceKs: number }> =>
      apiFetch(`/admin/users/${userId}/adjust-balance`, { method: "POST", body: JSON.stringify({ delta }) }),
    deleteUser: (userId: string): Promise<{ success: boolean }> =>
      apiFetch(`/admin/users/${userId}`, { method: "DELETE" }),
    cancelPackage: (userId: string): Promise<{ success: boolean; daysRemaining: number; refundKs: number; newBalance: number }> =>
      apiFetch(`/admin/users/${userId}/package`, { method: "DELETE" }),
  },
};
