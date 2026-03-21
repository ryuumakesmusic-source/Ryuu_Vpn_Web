import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api, type AdminTopup, type AdminUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Users, CreditCard, RefreshCw, ExternalLink, ArrowLeft } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    approved: "bg-green-500/10 text-green-400 border-green-500/30",
    rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest border ${colors[status] ?? "bg-white/5 text-white/40 border-white/10"}`}>
      {status}
    </span>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState<"topups" | "users">("topups");
  const [topups, setTopups] = useState<AdminTopup[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [editBalance, setEditBalance] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "topups") {
        const data = await api.admin.topups();
        setTopups(data);
      } else {
        const data = await api.admin.users();
        setUsers(data);
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to load", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) fetchData();
  }, [user, tab]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + "_approve");
    try {
      await api.admin.approveTopup(id, noteMap[id]);
      toast({ title: "Approved!", description: "Balance has been credited." });
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "_reject");
    try {
      await api.admin.rejectTopup(id, noteMap[id]);
      toast({ title: "Rejected", description: "Request has been rejected." });
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetBalance = async (userId: string) => {
    const val = parseInt(editBalance[userId] ?? "");
    if (isNaN(val) || val < 0) return;
    setActionLoading(userId + "_balance");
    try {
      await api.admin.setBalance(userId, val);
      toast({ title: "Balance Updated" });
      setEditBalance((prev) => ({ ...prev, [userId]: "" }));
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || (!user?.isAdmin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = topups.filter((t) => t.status === "pending").length;

  return (
    <div className="min-h-screen bg-background text-white">
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-lg tracking-wide text-amber-400">Admin Panel</span>
          <span className="ml-auto text-xs text-white/30">{user.username}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("topups")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              tab === "topups" ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Top-Ups
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              tab === "users" ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button onClick={fetchData} className="ml-auto p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "topups" ? (
          <div className="space-y-4">
            {topups.length === 0 ? (
              <div className="text-center py-16 text-white/30">No top-up requests yet.</div>
            ) : topups.map((topup) => (
              <motion.div
                key={topup.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
              >
                <div className="flex flex-wrap items-start gap-4 justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-white">{topup.username}</span>
                      <StatusBadge status={topup.status} />
                    </div>
                    <div className="text-sm text-white/50">
                      <span className="text-primary font-bold">{topup.amountKs.toLocaleString()} Ks</span>
                      {" · "}
                      {topup.paymentMethod}
                      {" · "}
                      {new Date(topup.createdAt).toLocaleString("en-US", { timeZone: "Asia/Yangon" })}
                    </div>
                    {topup.adminNote && (
                      <div className="text-xs text-white/40 mt-1">Note: {topup.adminNote}</div>
                    )}
                  </div>
                  <a
                    href={topup.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/70 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Screenshot
                  </a>
                </div>

                {topup.status === "pending" && (
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                    <input
                      type="text"
                      placeholder="Admin note (optional)"
                      value={noteMap[topup.id] ?? ""}
                      onChange={(e) => setNoteMap((prev) => ({ ...prev, [topup.id]: e.target.value }))}
                      className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={() => handleApprove(topup.id)}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {actionLoading === topup.id + "_approve" ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(topup.id)}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      {actionLoading === topup.id + "_reject" ? "..." : "Reject"}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-16 text-white/30">No users yet.</div>
            ) : users.map((u) => (
              <motion.div
                key={u.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
              >
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white">{u.username}</span>
                      {u.isAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white/40">
                      Balance: <span className="text-primary font-bold">{u.balanceKs.toLocaleString()} Ks</span>
                      {u.planId && <> · Plan: <span className="text-white/60">{u.planId}</span></>}
                      {" · "}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min={0}
                      placeholder="Set balance"
                      value={editBalance[u.id] ?? ""}
                      onChange={(e) => setEditBalance((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      className="w-28 h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={() => handleSetBalance(u.id)}
                      disabled={!editBalance[u.id] || actionLoading !== null}
                      className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-40"
                    >
                      {actionLoading === u.id + "_balance" ? "..." : "Set"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
