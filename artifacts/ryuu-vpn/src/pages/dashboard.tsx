import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api, type DashboardStats, type SubscriptionInfo } from "@/lib/api";
import { LogOut, Copy, Check, Wifi, Shield, Clock, Database } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  starter: "STARTER PLAN",
  premium: "PREMIUM VALUE",
  ultra: "ULTRA PRO",
};

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
        isActive
          ? "bg-green-500/10 text-green-400 border border-green-500/30"
          : "bg-red-500/10 text-red-400 border border-red-500/30"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400" : "bg-red-400"}`}
      />
      {status}
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
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/70 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.stats(), api.subscription()])
      .then(([s, sub]) => {
        setStats(s);
        setSub(sub);
      })
      .catch((e) => setError(e.message))
      .finally(() => setStatsLoading(false));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/interface-essential/check-badge-89c8o2nllxjypnppfmi9xm.png/check-badge-t05f9l6xba1iwy9pjudt.png?_a=DATAiZAAZAA0"
              className="w-8 h-8"
              alt="RYUU VPN"
            />
            <span className="font-display font-bold text-xl tracking-widest">
              RYUU <span className="text-primary">VPN</span>
            </span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <p className="text-white/40 text-sm mb-1 font-medium">Welcome back,</p>
          <h1 className="font-display text-3xl font-bold text-white uppercase tracking-wide">
            {user?.username}
          </h1>
        </motion.div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-sm">
            {error}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Plan & Status */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Your Plan</span>
              </div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-primary tracking-widest mb-1">
                    {PLAN_LABELS[stats.planId ?? ""] ?? stats.planName}
                  </h2>
                  <StatusBadge status={stats.status} />
                </div>
              </div>
              <DataBar used={stats.usedGb} total={stats.limitGb} label="Data Usage" />
              <div className="flex justify-between text-sm font-bold mt-3">
                <span className="text-white/50">{stats.usedGb} GB used</span>
                <span className="text-white">{stats.remainingGb} GB left of {stats.limitGb} GB</span>
              </div>
            </motion.div>

            {/* Expiry */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Validity</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span
                  className={`font-display text-6xl font-bold ${
                    daysLeft !== null && daysLeft <= 3 ? "text-red-400" : "text-white"
                  }`}
                >
                  {daysLeft ?? "—"}
                </span>
                <span className="text-white/50 font-bold text-lg mb-2">days left</span>
              </div>
              {stats.expireAt && (
                <p className="text-sm text-white/40">
                  Expires: {new Date(stats.expireAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                  })}
                </p>
              )}
              {daysLeft !== null && daysLeft <= 5 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                  ⚠️ Your plan expires soon. Renew now to keep your VPN active.
                </div>
              )}
            </motion.div>

            {/* Subscription Link */}
            {sub?.subscriptionUrl && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Wifi className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50">VPN Subscription Link</span>
                </div>
                <p className="text-xs text-white/40 mb-4">
                  Copy this link into your VPN app (v2rayNG, Hiddify, Streisand, etc.) to get connected.
                </p>
                <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10">
                  <code className="flex-1 text-xs text-primary/80 truncate font-mono">
                    {sub.subscriptionUrl}
                  </code>
                  <CopyButton value={sub.subscriptionUrl} />
                </div>
              </motion.div>
            )}

            {/* Stats summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className={`${sub?.subscriptionUrl ? "" : "md:col-span-2"} bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Usage Details</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Used", value: `${stats.usedGb} GB`, color: "text-white" },
                  { label: "Remaining", value: `${stats.remainingGb} GB`, color: "text-primary" },
                  { label: "Total", value: `${stats.limitGb} GB`, color: "text-secondary" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 bg-black/20 rounded-xl">
                    <div className={`font-display text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
