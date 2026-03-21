import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle2, Clock } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "kbz_09954901109", label: "KBZ Pay", number: "09954901109", name: "Saw Pyae Sone Oo" },
  { id: "aya_09954901109", label: "AYA Pay", number: "09954901109", name: "Saw Pyae Sone Oo" },
  { id: "wave_09965172570", label: "Wave Pay", number: "09965172570", name: "Hnin Ei Lwin Kyaw" },
  { id: "kbz_09965172570", label: "KBZ Pay", number: "09965172570", name: "Hnin Ei Lwin Kyaw" },
  { id: "aya_09965172570", label: "AYA Pay", number: "09965172570", name: "Hnin Ei Lwin Kyaw" },
  { id: "cb_fn", label: "CB Pay", number: "Fn 0027600500030392", name: "U Saw Pyae Sone Oo" },
];

const AMOUNTS = [3000, 5000, 10000, 15000, 20000];

export default function TopupPage() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [amount, setAmount] = useState<number | "">(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) {
    navigate("/");
    return null;
  }

  const finalAmount = amount === "" ? parseInt(customAmount || "0") : amount;
  const canSubmit = finalAmount >= 1000 && selectedMethod && screenshotUrl.trim().startsWith("http");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedMethod) return;
    setLoading(true);
    try {
      const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
      await api.submitTopup(finalAmount, method?.label + " - " + method?.number, screenshotUrl.trim());
      setSubmitted(true);
      await refreshUser();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center bg-white/[0.03] border border-white/[0.07] rounded-2xl p-10"
        >
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3 uppercase tracking-wide">
            Request Submitted!
          </h2>
          <p className="text-white/50 text-sm mb-2">
            Your top-up of <span className="text-white font-bold">{finalAmount.toLocaleString()} Ks</span> is being reviewed.
          </p>
          <p className="text-white/40 text-sm mb-8 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Usually approved within 1–2 hours.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 rounded-xl bg-primary text-white font-display font-bold tracking-widest text-sm uppercase hover:-translate-y-0.5 transition-all shadow-[0_0_20px_-5px_rgba(168,85,247,0.6)]"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-lg tracking-wide">Top Up Balance</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Payment info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 mb-4">🏦 Payment Information</h3>
          <div className="grid gap-3">
            {PAYMENT_METHODS.map((m) => (
              <div key={m.id} className="flex items-start gap-3 text-sm">
                <span className="w-24 shrink-0 font-bold text-white/60">{m.label}</span>
                <span className="text-primary font-mono">{m.number}</span>
                <span className="text-white/40 ml-auto text-xs">{m.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-amber-400/80">
              ⚠️ Write <strong>"payment"</strong> in the remarks — do NOT write "VPN"
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
          >
            <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-3">
              Top-Up Amount
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAmount(a); setCustomAmount(""); }}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    amount === a
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                  }`}
                >
                  {(a / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1000}
              step={500}
              placeholder="Custom amount (Ks)"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); }}
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 focus:outline-none text-sm"
            />
            {finalAmount > 0 && (
              <p className="text-xs text-white/40 mt-2">
                Amount: <span className="text-white font-bold">{finalAmount.toLocaleString()} Ks</span>
              </p>
            )}
          </motion.div>

          {/* Payment method */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
          >
            <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-3">
              Payment Method Used
            </label>
            <div className="grid gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === m.id
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    selectedMethod === m.id ? "border-primary bg-primary" : "border-white/30"
                  }`} />
                  <div>
                    <span className="text-sm font-bold text-white">{m.label}</span>
                    <span className="text-primary text-sm font-mono ml-2">{m.number}</span>
                    <span className="text-white/40 text-xs ml-2">{m.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Screenshot */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
          >
            <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-3 flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              Transaction Screenshot URL
            </label>
            <p className="text-xs text-white/40 mb-3">
              Upload your screenshot to{" "}
              <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                imgbb.com
              </a>{" "}
              or{" "}
              <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                imgur.com
              </a>{" "}
              and paste the direct image link below.
            </p>
            <input
              type="url"
              required
              placeholder="https://i.ibb.co/..."
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 focus:outline-none text-sm"
            />
            {screenshotUrl && screenshotUrl.startsWith("http") && (
              <div className="mt-3 rounded-xl overflow-hidden border border-white/10 max-h-48">
                <img src={screenshotUrl} alt="Preview" className="w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-4 rounded-xl bg-primary text-white font-display font-bold tracking-widest text-sm uppercase shadow-[0_0_25px_-5px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.9)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Top-Up Request"}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
