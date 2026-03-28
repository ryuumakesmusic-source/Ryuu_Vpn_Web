const DEFAULT_SQUAD_UUID = "cc8bf98f-8581-4dd0-b7ff-bc9c93a3cc61";

const REMNAWAVE_TIMEOUT_MS = 15_000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rwFetch(path: string, options: RequestInit = {}, retries = 3) {
  const BASE_URL = process.env.REMNAWAVE_URL;
  const API_KEY = process.env.REMNAWAVE_API_KEY;
  if (!BASE_URL) throw new Error("REMNAWAVE_URL is not configured on this server");
  if (!API_KEY) throw new Error("REMNAWAVE_API_KEY is not configured on this server");
  const url = `${BASE_URL}${path}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMNAWAVE_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          ...options.headers,
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text();
        const error = new Error(`Remnawave API error ${res.status}: ${text}`);
        // Don't retry on client errors (4xx) — these won't succeed on retry
        if (res.status >= 400 && res.status < 500) {
          throw error;
        }
        throw error;
      }

      return res.json();
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on client errors (4xx) or request timeouts
      if (
        lastError.message.includes("Remnawave API error 4") ||
        lastError.name === "AbortError"
      ) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff, max 5s)
      if (attempt < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("Remnawave API request failed after retries");
}

export interface RemnawaveUser {
  uuid: string;
  shortUuid: string;
  username: string;
  status: string;
  trafficLimitBytes: number;
  usedTrafficBytes: number;
  expireAt: string;
  subscriptionUrl: string;
}

export async function createRemnawaveUser(
  username: string,
  trafficLimitBytes: number,
  validityDays: number,
): Promise<RemnawaveUser> {
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + validityDays);

  const body = {
    username,
    trafficLimitBytes,
    expireAt: expireAt.toISOString(),
    trafficLimitStrategy: "NO_RESET",
    activeInternalSquads: [DEFAULT_SQUAD_UUID],
  };

  const data = await rwFetch("/api/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data?.response ?? data;
}

export async function renewRemnawaveUserPlan(
  uuid: string,
  additionalTrafficBytes: number,
  validityDays: number,
): Promise<RemnawaveUser> {
  // Fetch current state to calculate data rollover
  const current = await rwFetch(`/api/users/${uuid}`);
  const currentUser: RemnawaveUser = current?.response ?? current;
  const usedBytes: number = currentUser.usedTrafficBytes ?? 0;
  const currentLimitBytes: number = currentUser.trafficLimitBytes ?? 0;

  // Roll over unused data, capped at the new plan's full allocation
  const unusedBytes = Math.max(0, currentLimitBytes - usedBytes);
  const rolloverBytes = Math.min(unusedBytes, additionalTrafficBytes);

  // New limit = used so far + fresh plan data + rollover
  const newTrafficLimitBytes = usedBytes + additionalTrafficBytes + rolloverBytes;

  // Expiry starts fresh from today
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + validityDays);

  const data = await rwFetch("/api/users", {
    method: "PATCH",
    body: JSON.stringify({
      uuid,
      trafficLimitBytes: newTrafficLimitBytes,
      expireAt: expireAt.toISOString(),
      activeInternalSquads: [DEFAULT_SQUAD_UUID],
    }),
  });
  return data?.response ?? data;
}

export async function deleteRemnawaveUser(uuid: string): Promise<void> {
  await rwFetch(`/api/users/${uuid}`, { method: "DELETE" });
}

export async function getRemnawaveUser(uuid: string): Promise<RemnawaveUser> {
  const data = await rwFetch(`/api/users/${uuid}`);
  return data?.response ?? data;
}

export async function getUserBandwidth(uuid: string) {
  try {
    const data = await rwFetch(`/api/bandwidth-stats/users/${uuid}`);
    return data?.response ?? data;
  } catch {
    return null;
  }
}

export async function getSubscription(uuid: string) {
  try {
    const data = await rwFetch(`/api/subscriptions/by-uuid/${uuid}`);
    return data?.response ?? data;
  } catch {
    return null;
  }
}
