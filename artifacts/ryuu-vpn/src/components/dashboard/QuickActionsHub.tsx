import { motion } from "framer-motion";
import { ArrowUpRight, ShoppingCart, Gift, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: () => void;
  gradient: string;
  pulse?: boolean;
}

export function QuickActionsHub() {
  const [, navigate] = useLocation();

  const actions: QuickAction[] = [
    {
      icon: <ArrowUpRight className="w-6 h-6" />,
      title: "Top Up Balance",
      description: "Add funds to your account",
      action: () => navigate("/topup"),
      gradient: "from-primary to-purple-600",
      pulse: false,
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: "Buy a Plan",
      description: "Get started with VPN",
      action: () => {
        const buySection = document.getElementById("buy-plans");
        buySection?.scrollIntoView({ behavior: "smooth" });
      },
      gradient: "from-cyan-500 to-primary",
      pulse: true, // Primary CTA
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: "Gift a Plan",
      description: "Send VPN to friends",
      action: () => {
        const giftBtn = document.querySelector('[data-gift-button]') as HTMLButtonElement;
        giftBtn?.click();
      },
      gradient: "from-pink-500 to-rose-600",
      pulse: false,
    },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.action}
            className={`
              relative overflow-hidden rounded-2xl p-6 text-left
              bg-white/[0.03] backdrop-blur-xl border border-white/10
              hover:border-white/20 transition-all duration-300
              group
              ${action.pulse ? 'animate-pulse-slow' : ''}
            `}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} mb-4 shadow-lg`}>
                <div className="text-white">
                  {action.icon}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1">
                {action.title}
              </h3>
              
              <p className="text-sm text-white/50">
                {action.description}
              </p>

              {action.pulse && (
                <div className="absolute top-4 right-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
