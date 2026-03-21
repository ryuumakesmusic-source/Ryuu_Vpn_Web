const BASE_URL = process.env.REMNAWAVE_URL;
const API_KEY = process.env.REMNAWAVE_API_KEY;

if (!BASE_URL) throw new Error("REMNAWAVE_URL is not set");
if (!API_KEY) throw new Error("REMNAWAVE_API_KEY is not set");

const DEFAULT_SQUAD_UUID = "cc8bf98f-8581-4dd0-b7ff-bc9c93a3cc61";

async function rwFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Remnawave API error ${res.status}: ${text}`);
  }

  return res.json();
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
