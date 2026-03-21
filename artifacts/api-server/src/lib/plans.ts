export type PlanId = "starter" | "premium" | "ultra";

export interface Plan {
  id: PlanId;
  name: string;
  dataGb: number;
  validityDays: number;
  priceKs: number;
  trafficLimitBytes: number;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "STARTER PLAN",
    dataGb: 50,
    validityDays: 20,
    priceKs: 3000,
    trafficLimitBytes: 50 * 1024 * 1024 * 1024,
  },
  premium: {
    id: "premium",
    name: "PREMIUM VALUE",
    dataGb: 120,
    validityDays: 30,
    priceKs: 5000,
    trafficLimitBytes: 120 * 1024 * 1024 * 1024,
  },
  ultra: {
    id: "ultra",
    name: "ULTRA PRO",
    dataGb: 250,
    validityDays: 30,
    priceKs: 10000,
    trafficLimitBytes: 250 * 1024 * 1024 * 1024,
  },
};

export function getPlan(id: string): Plan | null {
  return PLANS[id as PlanId] ?? null;
}
