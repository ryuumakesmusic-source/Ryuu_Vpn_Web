import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function AuthModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const reset = () => {
    setUsername("");
    setPassword("");
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      if (tab === "login") {
        await login(username, password);
        toast({ title: "Welcome back!", description: `Logged in as ${username}` });
      } else {
        await register(username, password);
        toast({ title: "Account Created!", description: "Top up your balance to activate a plan." });
      }
      setOpen(false);
      reset();
      navigate("/dashboard");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/10 bg-[#0a0a14] backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(168,85,247,0.5)] p-0 overflow-hidden">
        <div className="flex border-b border-white/10">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-sm font-display font-bold tracking-widest uppercase transition-all ${
                tab === t
                  ? "text-primary border-b-2 border-primary"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-2xl font-bold tracking-wide text-white uppercase">
              {tab === "login" ? (
                <>Welcome <span className="text-primary">Back</span></>
              ) : (
                <>Join <span className="text-primary">RYUU VPN</span></>
              )}
            </DialogTitle>
            {tab === "register" && (
              <p className="text-sm text-white/40 mt-1">
                Create your account, then top up your balance to activate a plan.
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder={tab === "register" ? "e.g. myusername" : "your_username"}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 focus:outline-none focus:ring-0 transition-colors text-sm"
              />
              {tab === "register" && (
                <p className="text-xs text-white/30 mt-1.5">Lowercase letters, numbers, underscores. 3–32 chars.</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 focus:outline-none focus:ring-0 transition-colors text-sm"
              />
              {tab === "register" && (
                <p className="text-xs text-white/30 mt-1.5">At least 6 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 py-3.5 rounded-xl bg-primary text-white font-display font-bold tracking-widest text-sm uppercase shadow-[0_0_25px_-5px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.9)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Please wait..." : tab === "login" ? "Log In" : "Create Account"}
            </button>

            {tab === "login" ? (
              <p className="text-center text-sm text-white/40">
                Don't have an account?{" "}
                <button type="button" onClick={() => setTab("register")} className="text-primary hover:underline font-medium">
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-center text-sm text-white/40">
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")} className="text-primary hover:underline font-medium">
                  Log in
                </button>
              </p>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
