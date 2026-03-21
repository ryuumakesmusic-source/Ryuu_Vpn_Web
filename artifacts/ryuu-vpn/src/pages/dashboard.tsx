import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api, type DashboardStats, type SubscriptionInfo, type Plan } from "@/lib/api";
import { LogOut, Copy, Check, Wifi, Shield, Clock, Database, Wallet, ShoppingCart, ArrowUpRight, Gift, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  const noplan = status === "NO_PLAN";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
      isActive ? "bg-green-500/10 text-green-400 border border-green-500/30"
      : noplan ? "bg-white/5 text-white/40 border border-white/10"
      : "bg-red-500/10 text-red-400 border border-red-500/30"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400" : noplan ? "bg-white/30" : "bg-red-400"}`} />
      {noplan ? "No Active Plan" : status}
    </span>
  );
}

function DataBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color = pct > 80 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : "bg-primary";
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</span>
        <span className="text-xs font-bold text-white/70">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/70 transition-all">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const PLAN_LABELS: Record<string, string> = {
  starter: "STARTER PLAN",
  premium: "PREMIUM VALUE",
  ultra: "ULTRA PRO",
};

export default function DashboardPage() {
  const { user, logout, loading: authLoading, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftUsername, setGiftUsername] = useState("");
  const [giftPlanId, setGiftPlanId] = useState<string | null>(null);
  const [gifting, setGifting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.stats(), api.subscription(), api.plans()])
      .then(([s, sub, p]) => {
        setStats(s);
        setSub(sub);
        setPlans(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setStatsLoading(false));
  }, [user]);

  const handleBuyPlan = async (planId: string) => {
    setBuyingPlan(planId);
    try {
      const result = await api.buyPlan(planId);
      toast({ title: "Plan Activated!", description: `${result.planName} is now active.` });
      await refreshUser();
      const [newStats, newSub] = await Promise.all([api.stats(), api.subscription()]);
      setStats(newStats);
      setSub(newSub);
    } catch (err) {
      toast({
        title: "Purchase Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setBuyingPlan(null);
    }
  };

  const handleGiftPlan = async () => {
    if (!giftUsername.trim() || !giftPlanId) return;
    setGifting(true);
    try {
      const result = await api.giftPlan(giftUsername.trim(), giftPlanId);
      toast({ title: "Gift Sent! 🎁", description: `${result.planName} gifted to ${result.recipientUsername}.` });
      setGiftModalOpen(false);
      setGiftUsername("");
      setGiftPlanId(null);
      await refreshUser();
      const newStats = await api.stats();
      setStats(newStats);
    } catch (err) {
      toast({
        title: "Gift Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setGifting(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const daysLeft = stats?.expireAt
    ? Math.max(0, Math.ceil((new Date(stats.expireAt).getTime() - Date.now()) / 86400000))
    : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/interface-essential/check-badge-89c8o2nllxjypnppfmi9xm.png/check-badge-t05f9l6xba1iwy9pjudt.png?_a=DATAiZAAZAA0" className="w-8 h-8" alt="RYUU VPN" />
            <span className="font-display font-bold text-xl tracking-widest">RYUU <span className="text-primary">VPN</span></span>
          </a>
          <div className="flex items-center gap-3">
            {user?.isAdmin && (
              <button onClick={() => navigate("/admin")} className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all">
                Admin
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/70 hover:text-white transition-all">
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/40 text-sm mb-1 font-medium">Welcome back,</p>
            <h1 className="font-display text-3xl font-bold text-white uppercase tracking-wide">{user?.username}</h1>
          </div>
          {/* Balance Card */}
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-3">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest">Balance</p>
              <p className="font-display text-xl font-bold text-primary">{(stats?.balanceKs ?? user?.balanceKs ?? 0).toLocaleString()} Ks</p>
            </div>
            <button
              onClick={() => navigate("/topup")}
              className="ml-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Top Up
            </button>
          </div>
        </motion.div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-sm">{error}</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Plan & Status */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50">Your Plan</span>
                </div>
                {stats?.status === "NO_PLAN" ? (
                  <div>
                    <StatusBadge status="NO_PLAN" />
                    <p className="text-white/40 text-sm mt-3">Top up your balance and buy a plan below to get started.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="font-display text-xl font-bold text-primary tracking-widest mb-1">
                          {PLAN_LABELS[stats?.planId ?? ""] ?? stats?.planName}
                        </h2>
                        <StatusBadge status={stats?.status ?? "unknown"} />
                      </div>
                    </div>
                    <DataBar used={stats?.usedGb ?? 0} total={stats?.limitGb ?? 0} label="Data Usage" />
                    <div className="flex justify-between text-sm font-bold mt-3">
                      <span className="text-white/50">{stats?.usedGb} GB used</span>
                      <span className="text-white">{stats?.remainingGb} GB left of {stats?.limitGb} GB</span>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Expiry / Days */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50">Validity</span>
                </div>
                {stats?.status === "NO_PLAN" ? (
                  <p className="text-white/30 text-sm">No active subscription</p>
                ) : (
                  <>
                    <div className="flex items-end gap-2 mb-2">
                      <span className={`font-display text-6xl font-bold ${daysLeft !== null && daysLeft <= 3 ? "text-red-400" : "text-white"}`}>
                        {daysLeft ?? "—"}
                      </span>
                      <span className="text-white/50 font-bold text-lg mb-2">days left</span>
                    </div>
                    {stats?.expireAt && (
                      <p className="text-sm text-white/40">
                        Expires: {new Date(stats.expireAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    )}
                    {daysLeft !== null && daysLeft <= 5 && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                        ⚠️ Your plan expires soon. Buy a new plan to keep your VPN active.
                      </div>
                    )}
                  </>
                )}
              </motion.div>

              {/* Subscription Link */}
              {sub?.subscriptionUrl && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="md:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wifi className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">VPN Subscription Link</span>
                  </div>
                  <p className="text-xs text-white/40 mb-4">Copy this link into your VPN app (v2rayNG, Hiddify, Streisand, etc.) to get connected.</p>
                  <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10">
                    <code className="flex-1 text-xs text-primary/80 truncate font-mono">{sub.subscriptionUrl}</code>
                    <CopyButton value={sub.subscriptionUrl} />
                  </div>
                </motion.div>
              )}

              {/* Usage Details */}
              {stats?.status !== "NO_PLAN" && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                  className={`${sub?.subscriptionUrl ? "" : "md:col-span-2"} bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">Usage Details</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Used", value: `${stats?.usedGb} GB`, color: "text-white" },
                      { label: "Remaining", value: `${stats?.remainingGb} GB`, color: "text-primary" },
                      { label: "Total", value: `${stats?.limitGb} GB`, color: "text-secondary" },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 bg-black/20 rounded-xl">
                        <div className={`font-display text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
                        <div className="text-xs text-white/40 uppercase tracking-wider">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Buy a Plan */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50">Buy a Plan</span>
                </div>
                <button
                  onClick={() => setGiftModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold hover:bg-pink-500/20 transition-all"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Gift a Plan
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const canAfford = (stats?.balanceKs ?? user?.balanceKs ?? 0) >= plan.priceKs;
                  return (
                    <div key={plan.id}
                      className={`border rounded-2xl p-5 transition-all ${
                        plan.id === "premium"
                          ? "border-primary/40 bg-primary/5"
                          : "border-white/10 bg-white/[0.02]"
                      }`}>
                      {plan.id === "premium" && (
                        <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Most Popular</div>
                      )}
                      <h3 className="font-display font-bold text-white text-sm tracking-widest mb-1">{plan.name}</h3>
                      <div className="text-2xl font-display font-bold text-white mb-1">{plan.dataGb} GB</div>
                      <div className="text-xs text-white/40 mb-3">{plan.validityDays} days</div>
                      <div className="text-lg font-bold text-primary mb-4">{plan.priceKs.toLocaleString()} Ks</div>
                      <button
                        onClick={() => handleBuyPlan(plan.id)}
                        disabled={!canAfford || buyingPlan !== null}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                          canAfford
                            ? "bg-primary text-white hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.6)] hover:-translate-y-0.5"
                            : "bg-white/5 text-white/30 cursor-not-allowed"
                        } disabled:opacity-60 disabled:translate-y-0`}
                      >
                        {buyingPlan === plan.id ? "Activating..." : canAfford ? "Buy Now" : "Insufficient Balance"}
                      </button>
                    </div>
                  );
                })}
              </div>
              {plans.some(p => (stats?.balanceKs ?? user?.balanceKs ?? 0) < p.priceKs) && (
                <p className="text-xs text-white/30 mt-4 text-center">
                  Need more balance?{" "}
                  <button onClick={() => navigate("/topup")} className="text-primary hover:underline font-medium">
                    Top up now →
                  </button>
                </p>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Gift Plan Modal */}
      {giftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setGiftModalOpen(false); }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#0f0f17] border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                <h2 className="font-display font-bold text-white text-lg uppercase tracking-wide">Gift a Plan</h2>
              </div>
              <button onClick={() => setGiftModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient */}
            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-2">
                Recipient Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={giftUsername}
                  onChange={(e) => setGiftUsername(e.target.value)}
                  placeholder="Enter their username..."
                  className="w-full h-11 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-pink-500/60 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Plan selector */}
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-2">
                Choose Plan to Gift
              </label>
              <div className="grid gap-2">
                {plans.map((plan) => {
                  const canAfford = (stats?.balanceKs ?? user?.balanceKs ?? 0) >= plan.priceKs;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => canAfford && setGiftPlanId(plan.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        giftPlanId === plan.id
                          ? "border-pink-500/60 bg-pink-500/10"
                          : canAfford
                          ? "border-white/10 bg-white/[0.02] hover:border-white/20"
                          : "border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        giftPlanId === plan.id ? "border-pink-400 bg-pink-400" : "border-white/30"
                      }`} />
                      <span className="font-bold text-white text-sm">{plan.name}</span>
                      <span className="text-white/40 text-xs">{plan.dataGb} GB · {plan.validityDays}d</span>
                      <span className={`ml-auto font-bold text-sm ${canAfford ? "text-pink-400" : "text-white/30"}`}>
                        {plan.priceKs.toLocaleString()} Ks
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setGiftModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleGiftPlan}
                disabled={!giftUsername.trim() || !giftPlanId || gifting}
                className="flex-1 py-3 rounded-xl bg-pink-500 text-white text-sm font-bold uppercase tracking-wider hover:bg-pink-400 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(236,72,153,0.6)]"
              >
                {gifting ? "Sending..." : "Send Gift 🎁"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
